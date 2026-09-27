/**
 * Store Types — AppState shape and discriminated action union.
 */

import type {
  Document,
  Receipt,
  Expense,
  Payment,
  Vehicle,
  Asset,
  Reminder,
  User,
} from '../types';

import type { DriveFolderMap } from '../services/google/GoogleDriveService';

// ─── State ────────────────────────────────────────────────────────────────────

export interface AppState {
  isLoading: boolean;
  isSeeded: boolean;
  documents: Document[];
  receipts: Receipt[];
  expenses: Expense[];
  payments: Payment[];
  vehicles: Vehicle[];
  assets: Asset[];
  reminders: Reminder[];
  error: string | null;

  // Phase 3 — Google & Cloud Sync
  googleUser: User | null;
  isGoogleConnected: boolean;
  driveFolders: DriveFolderMap | null;
  spreadsheetId: string | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
  pendingCount: number;
}

export const initialState: AppState = {
  isLoading: true,
  isSeeded: false,
  documents: [],
  receipts: [],
  expenses: [],
  payments: [],
  vehicles: [],
  assets: [],
  reminders: [],
  error: null,

  googleUser: null,
  isGoogleConnected: false,
  driveFolders: null,
  spreadsheetId: null,
  isSyncing: false,
  lastSyncedAt: null,
  syncError: null,
  pendingCount: 0,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export type AppAction =
  // Lifecycle
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEEDED'; payload: boolean }
  | { type: 'LOAD_DATA'; payload: Pick<AppState, 'documents'|'receipts'|'expenses'|'payments'|'vehicles'|'assets'|'reminders'> }

  // Phase 3 — Google Auth & Sync
  | { type: 'SET_GOOGLE_USER'; payload: { user: User | null; isConnected: boolean } }
  | { type: 'SET_DRIVE_FOLDERS'; payload: DriveFolderMap | null }
  | { type: 'SET_SPREADSHEET_ID'; payload: string | null }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_SYNC_RESULT'; payload: { lastSyncedAt: string | null; error: string | null } }
  | { type: 'SET_PENDING_COUNT'; payload: number }

  // Documents
  | { type: 'ADD_DOCUMENT';    payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'DELETE_DOCUMENT'; payload: string }

  // Receipts
  | { type: 'ADD_RECEIPT';    payload: Receipt }
  | { type: 'UPDATE_RECEIPT'; payload: Receipt }
  | { type: 'DELETE_RECEIPT'; payload: string }

  // Expenses
  | { type: 'ADD_EXPENSE';    payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }

  // Payments
  | { type: 'ADD_PAYMENT';    payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: Payment }
  | { type: 'DELETE_PAYMENT'; payload: string }

  // Vehicles
  | { type: 'ADD_VEHICLE';    payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'DELETE_VEHICLE'; payload: string }

  // Assets
  | { type: 'ADD_ASSET';    payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }

  // Reminders
  | { type: 'ADD_REMINDER';    payload: Reminder }
  | { type: 'UPDATE_REMINDER'; payload: Reminder }
  | { type: 'DELETE_REMINDER'; payload: string };

