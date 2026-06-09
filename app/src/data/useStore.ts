/* ============================================================
   React binding for the Store singleton.
   ============================================================ */
import { useSyncExternalStore } from 'react';
import { store, type StoreSnapshot } from './store';

export function useStoreSnapshot(): StoreSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export { store };
