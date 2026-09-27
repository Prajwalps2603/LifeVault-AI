/**
 * SyncService — Two-way synchronization engine between local storage and Google Sheets / Drive.
 *
 * Flow:
 * 1. Checks Google OAuth authentication.
 * 2. Ensures LifeVault Google Drive folder hierarchy exists (reused if present).
 * 3. Ensures 'LifeVault Data' Google Sheet exists (reused if present).
 * 4. Pushes local records (Documents, Expenses, Payments, Vehicles, Assets, Reminders) to Sheets tabs.
 * 5. Updates local record syncStatus to 'SYNCED'.
 * 6. Records 'lastSyncedAt' timestamp.
 */

import { StorageService } from '../storage/StorageService';
import { GoogleAuthService } from '../google/GoogleAuthService';
import { GoogleDriveService } from '../google/GoogleDriveService';
import { GoogleSheetsService } from '../google/GoogleSheetsService';

import { DocumentRepository } from '../repositories/DocumentRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { AssetRepository } from '../repositories/AssetRepository';
import { ReminderRepository } from '../repositories/ReminderRepository';

export interface SyncProgress {
  isSyncing: boolean;
  stage: 'idle' | 'auth' | 'drive' | 'sheets' | 'syncing_records' | 'completed' | 'error';
  lastSyncedAt: string | null;
  pendingCount: number;
  error: string | null;
}

const STORAGE_KEY_LAST_SYNCED = 'lv:sync:lastSyncedAt';

class SyncServiceClass {
  private inProgress = false;

  /**
   * Run full cloud synchronization
   */
  async syncAll(onProgress?: (progress: SyncProgress) => void): Promise<{ success: boolean; error?: string }> {
    if (this.inProgress) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.inProgress = true;

    const report = (stage: SyncProgress['stage'], error: string | null = null) => {
      if (onProgress) {
        onProgress({
          isSyncing: stage !== 'completed' && stage !== 'error' && stage !== 'idle',
          stage,
          lastSyncedAt: null,
          pendingCount: 0,
          error,
        });
      }
    };

    try {
      // 1. Check Authentication
      report('auth');
      const isAuth = GoogleAuthService.isAuthenticated();
      if (!isAuth) {
        throw new Error('Please sign in with Google to sync your LifeVault.');
      }

      // 2. Ensure Google Drive Folder Hierarchy
      report('drive');
      await GoogleDriveService.ensureFolderHierarchy();

      // 3. Ensure 'LifeVault Data' Google Sheet
      report('sheets');
      await GoogleSheetsService.ensureSpreadsheet();

      // 4. Gather local records and sync to Sheets tabs
      report('syncing_records');
      const [docs, expenses, payments, vehicles, assets, reminders] = await Promise.all([
        DocumentRepository.findAll(),
        ExpenseRepository.findAll(),
        PaymentRepository.findAll(),
        VehicleRepository.findAll(),
        AssetRepository.findAll(),
        ReminderRepository.findAll(),
      ]);

      await Promise.all([
        GoogleSheetsService.syncEntityRecords('Documents', docs),
        GoogleSheetsService.syncEntityRecords('Expenses', expenses),
        GoogleSheetsService.syncEntityRecords('Payments', payments),
        GoogleSheetsService.syncEntityRecords('Vehicles', vehicles),
        GoogleSheetsService.syncEntityRecords('Assets', assets),
        GoogleSheetsService.syncEntityRecords('Reminders', reminders),
      ]);

      // 5. Update local sync metadata for all records to 'SYNCED'
      const nowIso = new Date().toISOString();
      await StorageService.set(STORAGE_KEY_LAST_SYNCED, nowIso);

      // Mark local documents as SYNCED
      for (const d of docs) {
        if (d.syncStatus !== 'SYNCED') {
          await DocumentRepository.update(d.id, { syncStatus: 'SYNCED', lastSyncedAt: nowIso });
        }
      }

      this.inProgress = false;
      report('completed');
      return { success: true };
    } catch (err: any) {
      this.inProgress = false;
      const errorMsg = err?.message || 'Synchronization failed';
      report('error', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get timestamp of last successful sync
   */
  async getLastSyncedAt(): Promise<string | null> {
    return StorageService.get<string>(STORAGE_KEY_LAST_SYNCED);
  }

  /**
   * Calculate count of records pending cloud synchronization
   */
  async getPendingCount(): Promise<number> {
    try {
      const [docs, expenses, payments, vehicles, assets, reminders] = await Promise.all([
        DocumentRepository.findAll(),
        ExpenseRepository.findAll(),
        PaymentRepository.findAll(),
        VehicleRepository.findAll(),
        AssetRepository.findAll(),
        ReminderRepository.findAll(),
      ]);

      const isPending = (r: { syncStatus?: string }) => r.syncStatus === 'LOCAL_ONLY' || r.syncStatus === 'PENDING_SYNC';

      return (
        docs.filter(isPending).length +
        expenses.filter(isPending).length +
        payments.filter(isPending).length +
        vehicles.filter(isPending).length +
        assets.filter(isPending).length +
        reminders.filter(isPending).length
      );
    } catch {
      return 0;
    }
  }
}

export const SyncService = new SyncServiceClass();
