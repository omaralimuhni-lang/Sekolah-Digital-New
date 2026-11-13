# Security Specification — Sekolah Digital Realtime Firestore Storage

## 1. Data Invariants
1. **Master Gate Invariant**: An `AppStateEntry` under `/workspaces/{workspaceId}/appState/{storeKey}` cannot be created, read (`get`), updated, or deleted unless the parent `/workspaces/{workspaceId}` exists and its `ownerId` matches `request.auth.uid` (or the caller is a verified admin).
2. **Identity Integrity**: On `create`, `ownerId` and `updatedBy` MUST strictly equal `request.auth.uid`, and `request.auth.token.email_verified == true` is enforced on all standard writes.
3. **Immutable Lineage**: `ownerId`, `workspaceId`, `storeKey`, and `createdAt` are immutable after document creation.
4. **Temporal Integrity**: `createdAt == request.time` on `create`, and `updatedAt == request.time` on `create` and `update`.
5. **Path & Key Hardening**: `workspaceId` and `storeKey` must pass `isValidId()`, `storeKey` must match `^sd_[a-zA-Z0-9_\-]+$`, and `payload` must be a Firestore `map` containing only `['data']`.
6. **Query Isolation**: `allow list` never uses `get()` or `exists()`, and strictly filters `resource.data.ownerId == request.auth.uid` (or `isAdmin()`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: Create `/workspaces/userA` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Create `/workspaces/userA` with `email_verified: false` (even with admin email) -> `PERMISSION_DENIED`.
3. **Identity Spoofing**: Create `/workspaces/userA` with `ownerId: "victimUid"` while signed in as `attackerUid` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Create `AppStateEntry` with extra ghost field `isVerified: true` -> `PERMISSION_DENIED`.
5. **Owner Mutation on Update**: Update `AppStateEntry` changing `ownerId` -> `PERMISSION_DENIED`.
6. **Immutable Timestamp Tampering**: Update `AppStateEntry` modifying `createdAt` -> `PERMISSION_DENIED`.
7. **Client-Forged Timestamp**: Create `AppStateEntry` with a hardcoded past timestamp instead of `request.time` -> `PERMISSION_DENIED`.
8. **ID Poisoning**: Create `AppStateEntry` with a 1500-char `storeKey` or invalid characters `sd_bad/key` -> `PERMISSION_DENIED`.
9. **Value Type Poisoning**: Update `schoolName` with a boolean `true` or 500-char string -> `PERMISSION_DENIED`.
10. **Orphaned Subcollection Write**: Create `AppStateEntry` under `/workspaces/nonExistent/appState/sd_settings` -> `PERMISSION_DENIED`.
11. **Cross-Tenant List Scraping**: List `/workspaces/{otherUid}/appState` without `ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
12. **Privilege Escalation**: Create or update `/admins/{attackerUid}` -> `PERMISSION_DENIED`.
