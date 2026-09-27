/**
 * StorageService — Typed AsyncStorage wrapper
 * All LifeVault keys use the prefix "lv:"
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'lv:';

export const StorageService = {
  /**
   * Get a single typed value by full key (without prefix).
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`${PREFIX}${key}`);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set a typed value by key.
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`[StorageService] set error for key "${key}":`, e);
    }
  },

  /**
   * Remove a single key.
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${PREFIX}${key}`);
    } catch (e) {
      console.error(`[StorageService] remove error for key "${key}":`, e);
    }
  },

  /**
   * Get all keys that start with a given prefix (e.g. "documents:").
   * Returns an array of parsed values.
   */
  async getAll<T>(namespace: string): Promise<T[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const matchingKeys = allKeys.filter(k =>
        k.startsWith(`${PREFIX}${namespace}:`),
      );
      if (matchingKeys.length === 0) return [];
      const pairs = await AsyncStorage.multiGet(matchingKeys);
      return pairs
        .map(([, value]) => {
          if (!value) return null;
          try {
            return JSON.parse(value) as T;
          } catch {
            return null;
          }
        })
        .filter((v): v is T => v !== null);
    } catch (e) {
      console.error(`[StorageService] getAll error for namespace "${namespace}":`, e);
      return [];
    }
  },

  /**
   * Delete all keys matching a namespace.
   */
  async clearNamespace(namespace: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const matchingKeys = allKeys.filter(k =>
        k.startsWith(`${PREFIX}${namespace}:`),
      );
      if (matchingKeys.length > 0) {
        await AsyncStorage.multiRemove(matchingKeys);
      }
    } catch (e) {
      console.error(`[StorageService] clearNamespace error:`, e);
    }
  },

  /**
   * Clear EVERYTHING in LifeVault storage (for sign-out or reset).
   */
  async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const lvKeys = allKeys.filter(k => k.startsWith(PREFIX));
      if (lvKeys.length > 0) {
        await AsyncStorage.multiRemove(lvKeys);
      }
    } catch (e) {
      console.error(`[StorageService] clearAll error:`, e);
    }
  },

  /**
   * Check if a flag key is set (used for one-time operations like seeding).
   */
  async getFlag(flag: string): Promise<boolean> {
    const val = await StorageService.get<boolean>(`meta:${flag}`);
    return val === true;
  },

  async setFlag(flag: string, value: boolean = true): Promise<void> {
    await StorageService.set(`meta:${flag}`, value);
  },

  /**
   * Export complete local vault database as a portable JSON backup.
   */
  async exportVaultBackup(): Promise<{ json: string; counts: Record<string, number> }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const lvKeys = allKeys.filter(k => k.startsWith(PREFIX));
      const pairs = await AsyncStorage.multiGet(lvKeys);

      const records: Record<string, any> = {};
      const counts: Record<string, number> = {
        documents: 0,
        receipts: 0,
        expenses: 0,
        payments: 0,
        vehicles: 0,
        assets: 0,
        reminders: 0,
        other: 0,
      };

      for (const [fullKey, value] of pairs) {
        if (!value) continue;
        const cleanKey = fullKey.substring(PREFIX.length);
        // Skip sensitive session token strings during export
        if (cleanKey === 'auth:tokens') continue;

        try {
          const parsed = JSON.parse(value);
          records[cleanKey] = parsed;

          // Aggregate domain count
          const domain = cleanKey.split(':')[0];
          if (domain in counts) {
            counts[domain] += 1;
          } else {
            counts.other += 1;
          }
        } catch {
          records[cleanKey] = value;
        }
      }

      const backup = {
        app: 'LifeVault AI',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        totalEntries: Object.keys(records).length,
        recordCounts: counts,
        records,
      };

      return {
        json: JSON.stringify(backup, null, 2),
        counts,
      };
    } catch (e) {
      console.error('[StorageService] exportVaultBackup error:', e);
      throw new Error('Failed to export vault backup.');
    }
  },

  /**
   * Restore local vault from a JSON backup.
   */
  async restoreVaultBackup(
    backupJson: string
  ): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const parsed = JSON.parse(backupJson);
      if (!parsed || (parsed.app !== 'LifeVault AI' && parsed.app !== 'LifeVault') || !parsed.records) {
        throw new Error('Invalid LifeVault backup format.');
      }

      const pairsToSet: [string, string][] = [];
      let count = 0;

      for (const [key, value] of Object.entries(parsed.records)) {
        pairsToSet.push([`${PREFIX}${key}`, JSON.stringify(value)]);
        count++;
      }

      if (pairsToSet.length > 0) {
        await AsyncStorage.multiSet(pairsToSet);
      }

      return {
        success: true,
        count,
        message: `Successfully restored ${count} vault records.`,
      };
    } catch (e: any) {
      console.error('[StorageService] restoreVaultBackup error:', e);
      return {
        success: false,
        count: 0,
        message: e?.message || 'Failed to restore backup.',
      };
    }
  },
};
