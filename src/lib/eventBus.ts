type EventCallback = (data?: any) => void;

class EventBus {
  private listeners: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

export const eventBus = new EventBus();

/**
 * Middleware terpusat untuk memicu pembaruan notifikasi lencana
 * setiap kali terjadi operasi penulisan/pengiriman data.
 */
export const triggerNotificationUpdate = (menusToUpdate: string[]) => {
  menusToUpdate.forEach(menuId => {
    const unseen = parseInt(localStorage.getItem(`unseen_${menuId}`) || '0', 10);
    localStorage.setItem(`unseen_${menuId}`, (unseen + 1).toString());
  });
  
  // Terbitkan event 'refresh-notifications' ke seluruh aplikasi
  eventBus.emit('refresh-notifications');
  
  // Tetap panggil localStorageUpdate untuk kompatibilitas
  window.dispatchEvent(new Event('localStorageUpdate'));
};
