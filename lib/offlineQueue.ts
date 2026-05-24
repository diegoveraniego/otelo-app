import { choreService } from './services/choreService';

export interface OfflineChore {
  choreId: string;
  memberId: string;
  homeId: string;
  doneAt: string;
}

const STORAGE_KEY = 'offline_chore_logs';

export const offlineQueue = {
  getQueue(): OfflineChore[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading offline queue', e);
      return [];
    }
  },

  enqueue(choreId: string, memberId: string, homeId: string, doneAt: string) {
    const queue = this.getQueue();
    queue.push({ choreId, memberId, homeId, doneAt });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Error writing to offline queue', e);
    }
  },

  clearQueue() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing offline queue', e);
    }
  },

  async sync() {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`📡 Sincronizando ${queue.length} tareas registradas de forma offline...`);
    
    // Process all pending chores
    let successCount = 0;
    for (const item of queue) {
      try {
        await choreService.completeChore(item.choreId, item.memberId, item.homeId, item.doneAt);
        successCount++;
      } catch (err) {
        console.error('Error syncing offline chore:', err);
      }
    }

    this.clearQueue();
    
    if (successCount > 0) {
      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('chore-logged'));
      
      // Dispatch a toast or log event
      const msg = `Sincronización exitosa: Se guardaron ${successCount} tareas pendientes. 🎉`;
      console.log(msg);
      // Dispatch custom toast event if desired
      window.dispatchEvent(new CustomEvent('offline-sync-complete', { detail: msg }));
    }
  }
};

// Auto-sync when going online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineQueue.sync();
  });
  
  // Also try to sync on load if online
  window.addEventListener('load', () => {
    if (navigator.onLine) {
      offlineQueue.sync();
    }
  });
}
