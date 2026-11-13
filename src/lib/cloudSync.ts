import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogleCloud,
  signOutGoogleCloud,
} from './firebase';

const IGNORED_KEYS = new Set(['sd_current_user', 'sd_active_page']);
const VALID_STORE_KEY_REGEX = /^sd_[a-zA-Z0-9_\-]+$/;
const MAX_DOC_BYTES = 900_000;
const PUSH_DEBOUNCE_MS = 250;

export interface CloudSyncStatus {
  connected: boolean;
  syncing: boolean;
  email: string | null;
  uid: string | null;
  lastSyncedAt: string | null;
  syncedKeysCount: number;
  errorMessage: string | null;
}

type StatusListener = (status: CloudSyncStatus) => void;

function sanitizeForFirestore(val: unknown): unknown {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val === 'string' || typeof val === 'boolean') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) =>
      Array.isArray(item)
        ? { __nestedArray: item.map(sanitizeForFirestore) }
        : sanitizeForFirestore(item)
    );
  }
  if (typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = sanitizeForFirestore(v);
      }
    }
    return out;
  }
  return String(val);
}

function restoreFromFirestore(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.map(restoreFromFirestore);
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 1 && keys[0] === '__nestedArray' && Array.isArray(obj.__nestedArray)) {
      return obj.__nestedArray.map(restoreFromFirestore);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = restoreFromFirestore(v);
    }
    return out;
  }
  return val;
}

function isValidStoreKey(key: string): boolean {
  return key.length >= 1 && key.length <= 128 && VALID_STORE_KEY_REGEX.test(key) && !IGNORED_KEYS.has(key);
}

function getSchoolNameFromStorage(): string {
  try {
    const settingsRaw = window.localStorage.getItem('sd_settings');
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      const name = parsed?.appIdentity?.appName;
      if (typeof name === 'string' && name.trim().length > 0) {
        return name.trim().slice(0, 150);
      }
    }
  } catch {
    // ignore
  }
  return 'Sekolah Digital';
}

function isPermissionOrQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('Quota exceeded')
  );
}

class CloudSyncController {
  isSyncing = false;
  private unsubscribeSnapshot: Unsubscribe | null = null;
  private authInitialized = false;
  private ensuredWorkspaceUid: string | null = null;
  private knownCloudKeys = new Set<string>();
  private lastSyncedSerialized = new Map<string, string>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private statusListeners = new Set<StatusListener>();
  private status: CloudSyncStatus = {
    connected: false,
    syncing: false,
    email: null,
    uid: null,
    lastSyncedAt: null,
    syncedKeysCount: 0,
    errorMessage: null,
  };

  private emitStatus(partial: Partial<CloudSyncStatus>) {
    this.status = { ...this.status, ...partial };
    this.statusListeners.forEach((listener) => listener(this.status));
  }

  getStatus(): CloudSyncStatus {
    return this.status;
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private getCurrentVerifiedUser(): FirebaseUser | null {
    const current = auth.currentUser;
    if (!current || !current.emailVerified) return null;
    return current;
  }

  private async ensureWorkspace(user: FirebaseUser): Promise<void> {
    if (this.ensuredWorkspaceUid === user.uid) return;

    const workspacePath = `workspaces/${user.uid}`;
    const workspaceRef = doc(db, 'workspaces', user.uid);
    try {
      const snap = await getDoc(workspaceRef);
      if (!snap.exists()) {
        await setDoc(workspaceRef, {
          ownerId: user.uid,
          schoolName: getSchoolNameFromStorage(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      this.ensuredWorkspaceUid = user.uid;
    } catch (error) {
      if (isPermissionOrQuotaError(error)) {
        handleFirestoreError(error, OperationType.WRITE, workspacePath);
      }
      throw error;
    }
  }

  private async writeEntryToCloud(user: FirebaseUser, key: string, value: unknown): Promise<void> {
    const sanitizedData = sanitizeForFirestore(value);
    const serializedSanitized = JSON.stringify(sanitizedData ?? null);
    if (this.lastSyncedSerialized.get(key) === serializedSanitized) {
      return;
    }

    const approxBytes = new Blob([serializedSanitized]).size;
    if (approxBytes > MAX_DOC_BYTES) {
      console.warn(`Data untuk kunci "${key}" melebihi batas dokumen 900KB Firestore dan tidak disinkronkan.`);
      return;
    }

    const docPath = `workspaces/${user.uid}/appState/${key}`;
    const entryRef = doc(db, 'workspaces', user.uid, 'appState', key);

    try {
      await this.ensureWorkspace(user);

      if (this.knownCloudKeys.has(key)) {
        try {
          await updateDoc(entryRef, {
            payload: { data: sanitizedData },
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
          });
        } catch (updateErr) {
          const msg = updateErr instanceof Error ? updateErr.message : String(updateErr);
          if (msg.includes('not-found') || msg.includes('No document to update')) {
            await setDoc(entryRef, {
              ownerId: user.uid,
              workspaceId: user.uid,
              storeKey: key,
              payload: { data: sanitizedData },
              updatedBy: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            throw updateErr;
          }
        }
      } else {
        const existingSnap = await getDoc(entryRef);
        if (!existingSnap.exists()) {
          await setDoc(entryRef, {
            ownerId: user.uid,
            workspaceId: user.uid,
            storeKey: key,
            payload: { data: sanitizedData },
            updatedBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(entryRef, {
            payload: { data: sanitizedData },
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
          });
        }
        this.knownCloudKeys.add(key);
      }

      this.lastSyncedSerialized.set(key, serializedSanitized);
      this.emitStatus({
        lastSyncedAt: new Date().toISOString(),
        syncedKeysCount: this.knownCloudKeys.size,
        errorMessage: null,
      });
    } catch (error) {
      this.emitStatus({
        errorMessage: error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke cloud.',
      });
      if (isPermissionOrQuotaError(error)) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }
  }

  async pullAllData(): Promise<boolean> {
    const user = this.getCurrentVerifiedUser();
    if (!user) {
      return false;
    }

    const collectionPath = `workspaces/${user.uid}/appState`;
    try {
      this.isSyncing = true;
      this.emitStatus({ syncing: true, errorMessage: null });

      await this.ensureWorkspace(user);

      const q = query(
        collection(db, 'workspaces', user.uid, 'appState'),
        where('ownerId', '==', user.uid)
      );
      const snapshot = await getDocs(q);

      let updatedCount = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const key = typeof data.storeKey === 'string' ? data.storeKey : docSnap.id;
        if (!isValidStoreKey(key)) return;

        this.knownCloudKeys.add(key);
        this.lastSyncedSerialized.set(key, JSON.stringify(data?.payload?.data ?? null));

        const restored = restoreFromFirestore(data?.payload?.data);
        const serialized = typeof restored === 'string' ? restored : JSON.stringify(restored);
        if (window.localStorage.getItem(key) !== serialized) {
          window.localStorage.setItem(key, serialized);
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        window.dispatchEvent(new Event('localStorageUpdate'));
        window.dispatchEvent(new Event('data-updated'));
      }

      this.emitStatus({
        connected: true,
        syncing: false,
        uid: user.uid,
        email: user.email,
        syncedKeysCount: snapshot.size,
        lastSyncedAt: new Date().toISOString(),
        errorMessage: null,
      });
      return true;
    } catch (error) {
      this.emitStatus({
        syncing: false,
        errorMessage: error instanceof Error ? error.message : 'Gagal menyinkronkan data cloud.',
      });
      if (isPermissionOrQuotaError(error)) {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  pushData(key: string, value: unknown): void {
    if (this.isSyncing) return;
    if (!isValidStoreKey(key)) return;

    const user = this.getCurrentVerifiedUser();
    if (!user) return;

    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      const activeUser = this.getCurrentVerifiedUser();
      if (activeUser && activeUser.uid === user.uid) {
        void this.writeEntryToCloud(activeUser, key, value);
      }
    }, PUSH_DEBOUNCE_MS);

    this.debounceTimers.set(key, timer);
  }

  async pushAllLocalToCloud(): Promise<number> {
    const user = this.getCurrentVerifiedUser();
    if (!user) return 0;

    this.emitStatus({ syncing: true, errorMessage: null });
    await this.ensureWorkspace(user);

    let pushed = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !isValidStoreKey(key)) continue;
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      let parsed: unknown = raw;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }
      await this.writeEntryToCloud(user, key, parsed);
      pushed++;
    }

    this.emitStatus({
      syncing: false,
      lastSyncedAt: new Date().toISOString(),
    });
    return pushed;
  }

  private attachRealtimeListener(user: FirebaseUser): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }

    const collectionPath = `workspaces/${user.uid}/appState`;
    const q = query(
      collection(db, 'workspaces', user.uid, 'appState'),
      where('ownerId', '==', user.uid)
    );

    this.unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        let hasChanges = false;
        this.isSyncing = true;
        try {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const key = typeof data.storeKey === 'string' ? data.storeKey : change.doc.id;
            if (!isValidStoreKey(key)) return;

            if (change.type === 'removed') {
              this.knownCloudKeys.delete(key);
              this.lastSyncedSerialized.delete(key);
              return;
            }

            this.knownCloudKeys.add(key);
            this.lastSyncedSerialized.set(key, JSON.stringify(data?.payload?.data ?? null));

            if (change.type === 'added' || change.type === 'modified') {
              const restored = restoreFromFirestore(data?.payload?.data);
              const serialized = typeof restored === 'string' ? restored : JSON.stringify(restored);
              if (window.localStorage.getItem(key) !== serialized) {
                window.localStorage.setItem(key, serialized);
                hasChanges = true;
              }
            }
          });
        } finally {
          this.isSyncing = false;
        }

        if (hasChanges) {
          window.dispatchEvent(new Event('localStorageUpdate'));
          window.dispatchEvent(new Event('data-updated'));
        }

        this.emitStatus({
          connected: true,
          syncing: false,
          uid: user.uid,
          email: user.email,
          syncedKeysCount: snapshot.size,
          lastSyncedAt: new Date().toISOString(),
          errorMessage: null,
        });
      },
      (error) => {
        this.emitStatus({
          syncing: false,
          errorMessage: error.message,
        });
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  }

  subscribeToChanges(): void {
    if (this.authInitialized) return;
    this.authInitialized = true;

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        this.emitStatus({
          connected: true,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          errorMessage: null,
        });
        try {
          await this.ensureWorkspace(firebaseUser);
          this.attachRealtimeListener(firebaseUser);
        } catch (error) {
          console.error('Gagal menginisialisasi sinkronisasi Firestore:', error);
        }
      } else {
        if (this.unsubscribeSnapshot) {
          this.unsubscribeSnapshot();
          this.unsubscribeSnapshot = null;
        }
        this.ensuredWorkspaceUid = null;
        this.knownCloudKeys.clear();
        this.lastSyncedSerialized.clear();
        this.debounceTimers.forEach((t) => clearTimeout(t));
        this.debounceTimers.clear();
        this.emitStatus({
          connected: false,
          syncing: false,
          uid: null,
          email: null,
          syncedKeysCount: 0,
        });
      }
    });
  }

  async connectGoogleCloud(): Promise<FirebaseUser | null> {
    const result = await signInWithGoogleCloud();
    const firebaseUser = result.user;
    if (firebaseUser && firebaseUser.emailVerified) {
      await this.ensureWorkspace(firebaseUser);
      await this.pullAllData();

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !isValidStoreKey(key) || this.knownCloudKeys.has(key)) continue;
        const raw = window.localStorage.getItem(key);
        if (raw === null) continue;
        try {
          await this.writeEntryToCloud(firebaseUser, key, JSON.parse(raw));
        } catch {
          await this.writeEntryToCloud(firebaseUser, key, raw);
        }
      }

      this.attachRealtimeListener(firebaseUser);
    }
    return firebaseUser;
  }

  async disconnectGoogleCloud(): Promise<void> {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
    this.ensuredWorkspaceUid = null;
    this.knownCloudKeys.clear();
    this.lastSyncedSerialized.clear();
    this.debounceTimers.forEach((t) => clearTimeout(t));
    this.debounceTimers.clear();
    await signOutGoogleCloud();
    this.emitStatus({
      connected: false,
      syncing: false,
      uid: null,
      email: null,
      syncedKeysCount: 0,
      lastSyncedAt: null,
      errorMessage: null,
    });
  }
}

export const CloudSyncManager = new CloudSyncController();
