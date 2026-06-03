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
  actionType: "CREATE_TRANSACTION" | "CREATE_CUSTOMER" | "RECORD_REPAYMENT";
  payload: any;
  timestamp: string;
  status: "pending" | "failed";
  retryCount: number;
  lastError?: string;
}

export interface LocalCustomer {
  id?: number;
  customerId: string;
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  registeredOffline: boolean;
  totalDebtGHS: number;
  remainingDebtGHS: number;
}

export interface LocalDebt {
  id?: number;
  debtId: string;
  customerId: string;
  transactionId?: string;
  amount: number;
  remainingAmount: number;
  status: "unpaid" | "partial" | "paid";
  dueDate: string;
  createdAt: string;
}

export interface LocalRepayment {
  id?: number;
  repaymentId: string;
  debtId: string;
  amount: number;
  paymentMethod: "CASH" | "MOBILE_MONEY" | "CARD";
  createdAt: string;
}

export class CashBridgeOfflineDB extends Dexie {
  transactions!: Table<LocalTransaction, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  customers!: Table<LocalCustomer, number>;
  debts!: Table<LocalDebt, number>;
  repayments!: Table<LocalRepayment, number>;

  constructor() {
    super("CashBridgeOfflineDB");
    this.version(1).stores({
      transactions: "++id, localId, synced, offlineCreatedAt, paymentMethod",
      syncQueue: "++id, actionType, status, timestamp",
      customers: "++id, customerId, phone, name",
      debts: "++id, debtId, customerId, status, dueDate",
      repayments: "++id, repaymentId, debtId, createdAt"
    });
  }
}

export const db = new CashBridgeOfflineDB();
