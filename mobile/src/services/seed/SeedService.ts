/**
 * SeedService — Populates demo data on first launch only.
 *
 * Flow:
 *   App start → check lv:meta:seeded flag
 *   → if false: insert demo records, set flag = true
 *   → if true: skip (never overwrites user data)
 */

import { StorageService } from '../storage/StorageService';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { ReceiptRepository }  from '../repositories/ReceiptRepository';
import { ExpenseRepository }  from '../repositories/ExpenseRepository';
import { PaymentRepository }  from '../repositories/PaymentRepository';
import { VehicleRepository }  from '../repositories/VehicleRepository';
import { AssetRepository }    from '../repositories/AssetRepository';
import { ReminderRepository } from '../repositories/ReminderRepository';

import {
  mockDocuments,
  mockReceipts,
  mockExpenses,
  mockPayments,
  mockVehicles,
  mockAssets,
  mockReminders,
} from '../../mock/mockData';

const SEEDED_FLAG = 'meta:seeded';

export const SeedService = {
  /** Returns true if the vault has already been seeded. */
  async isSeeded(): Promise<boolean> {
    return StorageService.getFlag(SEEDED_FLAG);
  },

  /**
   * Seeds demo data ONLY on first launch.
   * Idempotent — safe to call on every app start.
   */
  async seedIfNeeded(): Promise<void> {
    const alreadySeeded = await SeedService.isSeeded();
    if (alreadySeeded) {
      console.log('[SeedService] Already seeded — skipping.');
      return;
    }

    console.log('[SeedService] First launch — seeding demo data...');

    // Upsert each mock record by its existing ID so re-seeding is safe
    await Promise.all(mockDocuments.map(r => DocumentRepository.upsert(r)));
    await Promise.all(mockReceipts.map(r  => ReceiptRepository.upsert(r)));
    await Promise.all(mockExpenses.map(r  => ExpenseRepository.upsert(r)));
    await Promise.all(mockPayments.map(r  => PaymentRepository.upsert(r)));
    await Promise.all(mockVehicles.map(r  => VehicleRepository.upsert(r)));
    await Promise.all(mockAssets.map(r    => AssetRepository.upsert(r)));
    await Promise.all(mockReminders.map(r => ReminderRepository.upsert(r)));

    await StorageService.setFlag(SEEDED_FLAG, true);
    console.log('[SeedService] Demo data seeded successfully.');
  },

  /**
   * Resets ALL LifeVault storage and clears the seeded flag.
   * Use only for development/debugging or on explicit user request.
   */
  async resetAll(): Promise<void> {
    await StorageService.clearAll();
    console.log('[SeedService] All data cleared.');
  },
};
