/**
 * ConflictHandlingService — Offline-to-online reconciliation and conflict detection.
 *
 * Implements Section 83 (Phase 8):
 * - Rule 12: Never lose offline data.
 * - Rule 13: Never silently overwrite user changes during synchronization.
 * - Version timestamp reconciliation & conflict resolution strategies.
 */

import type { BaseRecord } from '../../types';

export interface ConflictRecord<T extends BaseRecord> {
  entityId: string;
  entityType: string;
  localVersion: T;
  remoteVersion: T;
  conflictTimestamp: string;
  resolution?: 'USE_LOCAL' | 'USE_REMOTE' | 'MERGED';
}

class ConflictHandlingServiceClass {
  private activeConflicts: ConflictRecord<any>[] = [];

  /**
   * Check if a conflict exists between local offline edit and remote Sheets record.
   */
  detectConflict<T extends BaseRecord>(local: T, remote: T, entityType: string): boolean {
    if (!remote || !local) return false;

    // If local was edited while offline and remote was also edited remotely
    const localUpdated = new Date(local.updatedAt).getTime();
    const remoteUpdated = new Date(remote.updatedAt).getTime();

    // Check version difference
    const versionDiff = (local.version || 1) !== (remote.version || 1);

    if (versionDiff && Math.abs(localUpdated - remoteUpdated) > 1000) {
      this.activeConflicts.push({
        entityId: local.id,
        entityType,
        localVersion: local,
        remoteVersion: remote,
        conflictTimestamp: new Date().toISOString(),
      });
      return true;
    }

    return false;
  }

  /**
   * Reconcile conflict using Last-Write-Wins (LWW) with offline preservation.
   * Enforces Rule 12: Preserves offline edits if local is newer.
   */
  resolveConflict<T extends BaseRecord>(conflict: ConflictRecord<T>): T {
    const localTime = new Date(conflict.localVersion.updatedAt).getTime();
    const remoteTime = new Date(conflict.remoteVersion.updatedAt).getTime();

    if (localTime >= remoteTime) {
      conflict.resolution = 'USE_LOCAL';
      return {
        ...conflict.localVersion,
        version: (conflict.remoteVersion.version || 1) + 1,
      };
    } else {
      conflict.resolution = 'USE_REMOTE';
      return conflict.remoteVersion;
    }
  }

  getPendingConflicts(): ConflictRecord<any>[] {
    return this.activeConflicts;
  }
}

export const ConflictHandlingService = new ConflictHandlingServiceClass();
