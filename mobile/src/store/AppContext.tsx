/**
 * AppContext — React Context + useReducer state management.
 *
 * Provides:
 *  - AppState (documents, expenses, payments, vehicles, assets, reminders, receipts)
 *  - CRUD operations for every entity
 *  - Loading / error states
 *  - loadAll() to refresh from storage
 *
 * Architecture:
 *   UI → useAppStore() → dispatch (action) → reducer (pure) → new state
 *   Side effects (AsyncStorage reads/writes) happen ONLY here in context methods.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import { appReducer } from './reducer';
import { initialState, type AppState, type AppAction } from './types';
import type {
  Document, Receipt, Expense, Payment, Vehicle, Asset, Reminder,
} from '../types';

import { StorageService }      from '../services/storage/StorageService';
import { SeedService }         from '../services/seed/SeedService';
import { DocumentRepository } from '../services/repositories/DocumentRepository';
import { ReceiptRepository }  from '../services/repositories/ReceiptRepository';
import { ExpenseRepository }  from '../services/repositories/ExpenseRepository';
import { PaymentRepository }  from '../services/repositories/PaymentRepository';
import { VehicleRepository }  from '../services/repositories/VehicleRepository';
import { AssetRepository }    from '../services/repositories/AssetRepository';
import { ReminderRepository } from '../services/repositories/ReminderRepository';

import { GoogleAuthService } from '../services/google/GoogleAuthService';
import { GoogleDriveService } from '../services/google/GoogleDriveService';
import { GoogleSheetsService } from '../services/google/GoogleSheetsService';
import { SyncService } from '../services/sync/SyncService';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  loadAll: () => Promise<void>;

  // Google Auth & Cloud Sync (Phase 3)
  signInWithGoogle: (customAccount?: { email: string; name: string }) => Promise<void>;
  signOutGoogle: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;
  switchGoogleAccount: (account: { email: string; name: string }) => Promise<void>;
  syncNow: () => Promise<boolean>;

  // Documents
  addDocument:    (data: Omit<Document, 'id'|'createdAt'|'updatedAt'>) => Promise<Document>;
  updateDocument: (id: string, patch: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  // Receipts
  addReceipt:    (data: Omit<Receipt, 'id'|'createdAt'|'updatedAt'>) => Promise<Receipt>;
  updateReceipt: (id: string, patch: Partial<Receipt>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;

  // Expenses
  addExpense:    (data: Omit<Expense, 'id'|'createdAt'|'updatedAt'>) => Promise<Expense>;
  updateExpense: (id: string, patch: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Payments
  addPayment:    (data: Omit<Payment, 'id'|'createdAt'|'updatedAt'>) => Promise<Payment>;
  updatePayment: (id: string, patch: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  markPaymentPaid: (id: string) => Promise<void>;

  // Vehicles
  addVehicle:    (data: Omit<Vehicle, 'id'|'createdAt'|'updatedAt'>) => Promise<Vehicle>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  // Assets
  addAsset:    (data: Omit<Asset, 'id'|'createdAt'|'updatedAt'>) => Promise<Asset>;
  updateAsset: (id: string, patch: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

  // Reminders
  addReminder:    (data: Omit<Reminder, 'id'|'createdAt'|'updatedAt'>) => Promise<Reminder>;
  updateReminder: (id: string, patch: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markReminderDone: (id: string) => Promise<void>;

  // Local Backup & Portability
  exportVaultBackup: () => Promise<{ json: string; counts: Record<string, number> }>;
  restoreVaultBackup: (backupJson: string) => Promise<{ success: boolean; count: number; message: string }>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  /** Load all data from AsyncStorage into state. */
  const loadAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [
        documents, receipts, expenses, payments, vehicles, assets, reminders,
        authSession, driveFolders, spreadsheetId, lastSyncedAt, pendingCount,
      ] = await Promise.all([
        DocumentRepository.findAll(),
        ReceiptRepository.findAll(),
        ExpenseRepository.findAll(),
        PaymentRepository.findAll(),
        VehicleRepository.findAll(),
        AssetRepository.findAll(),
        ReminderRepository.findAll(),
        GoogleAuthService.init(),
        GoogleDriveService.getFolders(),
        GoogleSheetsService.getSpreadsheetId(),
        SyncService.getLastSyncedAt(),
        SyncService.getPendingCount(),
      ]);

      dispatch({
        type: 'LOAD_DATA',
        payload: { documents, receipts, expenses, payments, vehicles, assets, reminders },
      });

      if (authSession) {
        dispatch({
          type: 'SET_GOOGLE_USER',
          payload: { user: authSession.user, isConnected: authSession.isConnected },
        });
      }

      dispatch({ type: 'SET_DRIVE_FOLDERS', payload: driveFolders });
      dispatch({ type: 'SET_SPREADSHEET_ID', payload: spreadsheetId });
      dispatch({ type: 'SET_SYNC_RESULT', payload: { lastSyncedAt, error: null } });
      dispatch({ type: 'SET_PENDING_COUNT', payload: pendingCount });
    } catch (e) {
      console.error('[AppContext] loadAll failed:', e);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load your data. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /** On mount: seed if needed, then load. */
  useEffect(() => {
    (async () => {
      try {
        await SeedService.seedIfNeeded();
        dispatch({ type: 'SET_SEEDED', payload: true });
      } catch (e) {
        console.error('[AppContext] seed failed:', e);
      }
      await loadAll();
    })();
  }, [loadAll]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleError = (e: unknown, context: string) => {
    console.error(`[AppContext] ${context}:`, e);
    dispatch({ type: 'SET_ERROR', payload: `Operation failed: ${context}` });
  };

  // ── Documents ──────────────────────────────────────────────────────────────
  const addDocument = async (data: Omit<Document, 'id'|'createdAt'|'updatedAt'>) => {
    const record = await DocumentRepository.create(data);
    dispatch({ type: 'ADD_DOCUMENT', payload: record });
    return record;
  };

  const updateDocument = async (id: string, patch: Partial<Document>) => {
    try {
      const updated = await DocumentRepository.update(id, patch);
      if (updated) dispatch({ type: 'UPDATE_DOCUMENT', payload: updated });
    } catch (e) { handleError(e, 'updateDocument'); }
  };

  const deleteDocument = async (id: string) => {
    try {
      await DocumentRepository.delete(id);
      dispatch({ type: 'DELETE_DOCUMENT', payload: id });
    } catch (e) { handleError(e, 'deleteDocument'); }
  };

  // ── Receipts ───────────────────────────────────────────────────────────────
  const addReceipt = async (data: Omit<Receipt, 'id'|'createdAt'|'updatedAt'>) => {
    const record = await ReceiptRepository.create(data);
    dispatch({ type: 'ADD_RECEIPT', payload: record });
    return record;
  };

  const updateReceipt = async (id: string, patch: Partial<Receipt>) => {
    try {
      const updated = await ReceiptRepository.update(id, patch);
      if (updated) dispatch({ type: 'UPDATE_RECEIPT', payload: updated });
    } catch (e) { handleError(e, 'updateReceipt'); }
  };

  const deleteReceipt = async (id: string) => {
    try {
      await ReceiptRepository.delete(id);
      dispatch({ type: 'DELETE_RECEIPT', payload: id });
    } catch (e) { handleError(e, 'deleteReceipt'); }
  };

  // ── Expenses ───────────────────────────────────────────────────────────────
  const addExpense = async (data: Omit<Expense, 'id'|'createdAt'|'updatedAt'>) => {
    const record = await ExpenseRepository.create(data);
    dispatch({ type: 'ADD_EXPENSE', payload: record });
    return record;
  };

  const updateExpense = async (id: string, patch: Partial<Expense>) => {
    try {
      const updated = await ExpenseRepository.update(id, patch);
      if (updated) dispatch({ type: 'UPDATE_EXPENSE', payload: updated });
    } catch (e) { handleError(e, 'updateExpense'); }
  };

  const deleteExpense = async (id: string) => {
    try {
      await ExpenseRepository.delete(id);
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
    } catch (e) { handleError(e, 'deleteExpense'); }
  };

  // ── Payments ───────────────────────────────────────────────────────────────
  const addPayment = async (data: Omit<Payment, 'id'|'createdAt'|'updatedAt'>) => {
    const record = await PaymentRepository.create(data);
    dispatch({ type: 'ADD_PAYMENT', payload: record });
    return record;
  };

  const updatePayment = async (id: string, patch: Partial<Payment>) => {
    try {
      const updated = await PaymentRepository.update(id, patch);
      if (updated) dispatch({ type: 'UPDATE_PAYMENT', payload: updated });
    } catch (e) { handleError(e, 'updatePayment'); }
  };

  const deletePayment = async (id: string) => {
    try {
      await PaymentRepository.delete(id);
      dispatch({ type: 'DELETE_PAYMENT', payload: id });
    } catch (e) { handleError(e, 'deletePayment'); }
  };

  const markPaymentPaid = async (id: string) => {
    try {
      const updated = await PaymentRepository.markAsPaid(id);
      if (updated) dispatch({ type: 'UPDATE_PAYMENT', payload: updated });
    } catch (e) { handleError(e, 'markPaymentPaid'); }
  };

  // ── Vehicles ───────────────────────────────────────────────────────────────
  const addVehicle = async (data: Omit<Vehicle, 'id'|'createdAt'|'updatedAt'>) => {
    const record = await VehicleRepository.create(data);
    dispatch({ type: 'ADD_VEHICLE', payload: record });
    return record;
  };

  const updateVehicle = async (id: string, patch: Partial<Vehicle>) => {
    try {
      const updated = await VehicleRepository.update(id, patch);
      if (updated) dispatch({ type: 'UPDATE_VEHICLE', payload: updated });
    } catch (e) { handleError(e, 'updateVehicle'); }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await VehicleRepository.delete(id);
      dispatch({ type: 'DELETE_VEHICLE', payload: id });
    } catch (e) { handleError(e, 'deleteVehicle'); }
  };

  // ── Assets ─────────────────────────────────────────────────────────────────
  const addAsset = async (data: Omit<Asset, 'id'|'createdAt'|'updatedAt'>) => {
    const record = await AssetRepository.create(data);
    dispatch({ type: 'ADD_ASSET', payload: record });
    return record;
  };

  const updateAsset = async (id: string, patch: Partial<Asset>) => {
    try {
      const updated = await AssetRepository.update(id, patch);
      if (updated) dispatch({ type: 'UPDATE_ASSET', payload: updated });
    } catch (e) { handleError(e, 'updateAsset'); }
  };

  const deleteAsset = async (id: string) => {
    try {
      await AssetRepository.delete(id);
      dispatch({ type: 'DELETE_ASSET', payload: id });
    } catch (e) { handleError(e, 'deleteAsset'); }
  };

  // ── Reminders ──────────────────────────────────────────────────────────────
  const addReminder = async (data: Omit<Reminder, 'id'|'createdAt'|'updatedAt'>) => {
    const record = await ReminderRepository.create(data);
    dispatch({ type: 'ADD_REMINDER', payload: record });
    return record;
  };

  const updateReminder = async (id: string, patch: Partial<Reminder>) => {
    try {
      const updated = await ReminderRepository.update(id, patch);
      if (updated) dispatch({ type: 'UPDATE_REMINDER', payload: updated });
    } catch (e) { handleError(e, 'updateReminder'); }
  };

  const deleteReminder = async (id: string) => {
    try {
      await ReminderRepository.delete(id);
      dispatch({ type: 'DELETE_REMINDER', payload: id });
    } catch (e) { handleError(e, 'deleteReminder'); }
  };

  const markReminderDone = async (id: string) => {
    try {
      const updated = await ReminderRepository.markComplete(id);
      if (updated) dispatch({ type: 'UPDATE_REMINDER', payload: updated });
    } catch (e) { handleError(e, 'markReminderDone'); }
  };

  // ── Google Auth & Cloud Sync (Phase 3) ──────────────────────────────────────
  const signInWithGoogle = async (customAccount?: { email: string; name: string }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const session = await GoogleAuthService.signIn(customAccount);
      dispatch({
        type: 'SET_GOOGLE_USER',
        payload: { user: session.user, isConnected: true },
      });

      // Ensure folders and sheet asynchronously
      const folders = await GoogleDriveService.ensureFolderHierarchy();
      dispatch({ type: 'SET_DRIVE_FOLDERS', payload: folders });

      const sheetId = await GoogleSheetsService.ensureSpreadsheet();
      dispatch({ type: 'SET_SPREADSHEET_ID', payload: sheetId });

      // Run initial sync
      await syncNow();
    } catch (e) {
      handleError(e, 'signInWithGoogle');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signOutGoogle = async () => {
    try {
      await GoogleAuthService.signOut();
      dispatch({
        type: 'SET_GOOGLE_USER',
        payload: { user: null, isConnected: false },
      });
    } catch (e) {
      handleError(e, 'signOutGoogle');
    }
  };

  const disconnectGoogle = async () => {
    try {
      await GoogleAuthService.disconnectGoogle();
      await GoogleDriveService.clearCache();
      await GoogleSheetsService.clearCache();
      dispatch({
        type: 'SET_GOOGLE_USER',
        payload: { user: null, isConnected: false },
      });
      dispatch({ type: 'SET_DRIVE_FOLDERS', payload: null });
      dispatch({ type: 'SET_SPREADSHEET_ID', payload: null });
      dispatch({ type: 'SET_SYNC_RESULT', payload: { lastSyncedAt: null, error: null } });
    } catch (e) {
      handleError(e, 'disconnectGoogle');
    }
  };

  const switchGoogleAccount = async (account: { email: string; name: string }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await GoogleDriveService.clearCache();
      await GoogleSheetsService.clearCache();
      const session = await GoogleAuthService.switchAccount(account);
      dispatch({
        type: 'SET_GOOGLE_USER',
        payload: { user: session.user, isConnected: true },
      });
      const folders = await GoogleDriveService.ensureFolderHierarchy();
      dispatch({ type: 'SET_DRIVE_FOLDERS', payload: folders });
      const sheetId = await GoogleSheetsService.ensureSpreadsheet();
      dispatch({ type: 'SET_SPREADSHEET_ID', payload: sheetId });
      await syncNow();
    } catch (e) {
      handleError(e, 'switchGoogleAccount');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const syncNow = async (): Promise<boolean> => {
    if (!state.isGoogleConnected) {
      return false;
    }
    dispatch({ type: 'SET_SYNCING', payload: true });
    try {
      const res = await SyncService.syncAll();
      const lastSynced = await SyncService.getLastSyncedAt();
      const pending = await SyncService.getPendingCount();

      dispatch({
        type: 'SET_SYNC_RESULT',
        payload: { lastSyncedAt: lastSynced, error: res.success ? null : (res.error || 'Sync error') },
      });
      dispatch({ type: 'SET_PENDING_COUNT', payload: pending });
      return res.success;
    } catch (e: any) {
      dispatch({
        type: 'SET_SYNC_RESULT',
        payload: { lastSyncedAt: state.lastSyncedAt, error: e?.message || 'Sync failed' },
      });
      return false;
    }
  };

  // ── Local Backup & Portability ─────────────────────────────────────────────
  const exportVaultBackup = async () => {
    return StorageService.exportVaultBackup();
  };

  const restoreVaultBackup = async (backupJson: string) => {
    const result = await StorageService.restoreVaultBackup(backupJson);
    if (result.success) {
      // Reload memory state immediately
      await loadAll();
    }
    return result;
  };

  // ── Value ──────────────────────────────────────────────────────────────────
  const value: AppContextValue = {
    state,
    loadAll,
    signInWithGoogle,
    signOutGoogle,
    disconnectGoogle,
    switchGoogleAccount,
    syncNow,
    addDocument, updateDocument, deleteDocument,
    addReceipt,  updateReceipt,  deleteReceipt,
    addExpense,  updateExpense,  deleteExpense,
    addPayment,  updatePayment,  deletePayment, markPaymentPaid,
    addVehicle,  updateVehicle,  deleteVehicle,
    addAsset,    updateAsset,    deleteAsset,
    addReminder, updateReminder, deleteReminder, markReminderDone,
    exportVaultBackup,
    restoreVaultBackup,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppStore must be used inside <AppProvider>');
  }
  return ctx;
}
