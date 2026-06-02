import Dexie, { type Table } from "dexie";

export interface LocalTransaction {
  id?: number;
  localId: string; // Client uuid
  description: string;
  amount: number;
  category: string;
  paymentMethod: "CASH" | "MOBILE_MONEY" | "CARD" | "DEBT";
  offlineCreatedAt: string;
  synced: 0 | 1; // IndexedDB works better searching integer flags rather than booleans
  syncFailed: 0 | 1;
  syncError?: string;
  retryCount: number;
}

export interface SyncQueueItem {
  id?: number;
  actionType: "CREATE_TRANSACTION";
  payload: any;
  timestamp: string;
  status: "pending" | "failed";
  retryCount: number;
  lastError?: string;
}

export class CashBridgeOfflineDB extends Dexie {
  transactions!: Table<LocalTransaction, number>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("CashBridgeOfflineDB");
    this.version(1).stores({
      transactions: "++id, localId, synced, offlineCreatedAt, paymentMethod",
      syncQueue: "++id, actionType, status, timestamp"
    });
  }
}

export const db = new CashBridgeOfflineDB();
