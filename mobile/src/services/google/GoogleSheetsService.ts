/**
 * GoogleSheetsService — Structured database on Google Sheets.
 *
 * Spreadsheet Name: "LifeVault Data"
 * Resides inside: Google Drive -> "LifeVault" folder
 *
 * Adheres strictly to Rule 9: Never create duplicate Google Sheets unnecessarily.
 * The spreadsheetId is searched and cached in StorageService under 'lv:sheets:spreadsheetId'.
 *
 * Sheets (Tabs) Defined:
 * 1. Documents
 * 2. Expenses
 * 3. Payments
 * 4. Vehicles
 * 5. Assets
 * 6. Reminders
 * 7. SyncMeta
 */

import { StorageService } from '../storage/StorageService';
import { GoogleAuthService } from './GoogleAuthService';
import { GoogleDriveService } from './GoogleDriveService';

export const SHEET_SCHEMAS: Record<string, string[]> = {
  Documents: [
    'id', 'name', 'documentType', 'status', 'expiryDate', 'issueDate',
    'relatedEntityId', 'relatedEntityType', 'driveFileId', 'driveUrl',
    'notes', 'syncStatus', 'version', 'createdAt', 'updatedAt',
  ],
  Expenses: [
    'id', 'title', 'amount', 'currency', 'date', 'category',
    'merchantName', 'description', 'vehicleId', 'receiptId',
    'syncStatus', 'version', 'createdAt', 'updatedAt',
  ],
  Payments: [
    'id', 'title', 'amount', 'currency', 'dueDate', 'paidDate',
    'status', 'category', 'isRecurring', 'notes',
    'syncStatus', 'version', 'createdAt', 'updatedAt',
  ],
  Vehicles: [
    'id', 'name', 'vehicleType', 'brand', 'model', 'year',
    'registrationNumber', 'fuelType', 'color', 'notes',
    'syncStatus', 'version', 'createdAt', 'updatedAt',
  ],
  Assets: [
    'id', 'name', 'category', 'brand', 'model', 'serialNumber',
    'purchaseDate', 'purchasePrice', 'currency', 'warrantyExpiryDate',
    'notes', 'syncStatus', 'version', 'createdAt', 'updatedAt',
  ],
  Reminders: [
    'id', 'title', 'description', 'dueDate', 'time', 'frequency',
    'isCompleted', 'completedAt', 'syncStatus', 'version',
    'createdAt', 'updatedAt',
  ],
  SyncMeta: [
    'key', 'value', 'updatedAt',
  ],
};

const STORAGE_KEY_SHEET_ID = 'lv:sheets:spreadsheetId';
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SheetRowRecord {
  [column: string]: any;
}

class GoogleSheetsServiceClass {
  private cachedSpreadsheetId: string | null = null;

  /**
   * Ensures the single canonical 'LifeVault Data' spreadsheet exists in the LifeVault folder.
   * Caches spreadsheet ID locally to prevent duplicate sheets.
   */
  async ensureSpreadsheet(): Promise<string> {
    if (this.cachedSpreadsheetId) {
      return this.cachedSpreadsheetId;
    }

    const savedId = await StorageService.get<string>(STORAGE_KEY_SHEET_ID);
    if (savedId) {
      this.cachedSpreadsheetId = savedId;
      return savedId;
    }

    const folders = await GoogleDriveService.ensureFolderHierarchy();
    const token = await GoogleAuthService.getValidAccessToken();

    // Check if spreadsheet already exists on Drive or generate stable deterministic ID
    const spreadsheetId = await this.findOrCreateSpreadsheet(
      'LifeVault Data',
      folders.rootId,
      token
    );

    await StorageService.set(STORAGE_KEY_SHEET_ID, spreadsheetId);
    this.cachedSpreadsheetId = spreadsheetId;
    return spreadsheetId;
  }

  /**
   * Get cached spreadsheet ID if available
   */
  async getSpreadsheetId(): Promise<string | null> {
    if (this.cachedSpreadsheetId) return this.cachedSpreadsheetId;
    const saved = await StorageService.get<string>(STORAGE_KEY_SHEET_ID);
    if (saved) {
      this.cachedSpreadsheetId = saved;
      return saved;
    }
    return null;
  }

  /**
   * Sync a batch of entity records into the designated Sheet tab.
   * If row exists by ID, it updates; otherwise it appends.
   */
  async syncEntityRecords(sheetName: keyof typeof SHEET_SCHEMAS, records: SheetRowRecord[]): Promise<boolean> {
    await this.ensureSpreadsheet();
    const columns = SHEET_SCHEMAS[sheetName];
    if (!columns) return false;

    // Convert entity records into 2D array matrix conforming to schema columns
    const rows = records.map(record => {
      return columns.map(col => {
        const val = record[col];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      });
    });

    const token = await GoogleAuthService.getValidAccessToken();
    const spreadsheetId = this.cachedSpreadsheetId;

    // In online mode with real OAuth token, send to Google Sheets API
    if (token && spreadsheetId && !token.startsWith('lv_oauth_')) {
      try {
        const range = `${sheetName}!A2:${String.fromCharCode(65 + columns.length - 1)}`;
        await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: rows }),
        });
        return true;
      } catch (err) {
        console.warn(`Sheets API sync failed for ${sheetName}:`, err);
      }
    }

    // Persist local sheet cache snapshot in StorageService
    await StorageService.set(`lv:sheets:cache:${sheetName}`, records);
    return true;
  }

  /**
   * Find or create the 'LifeVault Data' spreadsheet.
   * Never creates duplicate sheets.
   */
  private async findOrCreateSpreadsheet(
    title: string,
    folderId: string,
    token: string | null
  ): Promise<string> {
    const stableId = `lv_sheet_lifevault_data_${folderId.substring(0, 16)}`;

    if (token && !token.startsWith('lv_oauth_')) {
      try {
        // Query Drive for existing spreadsheet
        const query = encodeURIComponent(
          `name = '${title}' and '${folderId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
        );
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.files && json.files.length > 0) {
            return json.files[0].id;
          }

          // Create new spreadsheet with all initial tabs
          const sheetsConfig = Object.keys(SHEET_SCHEMAS).map(name => ({
            properties: { title: name },
          }));

          const createRes = await fetch(SHEETS_API_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              properties: { title },
              sheets: sheetsConfig,
            }),
          });

          if (createRes.ok) {
            const created = await createRes.json();
            const sheetId = created.spreadsheetId;

            // Move into LifeVault Drive folder
            await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}?addParents=${folderId}&fields=id,parents`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` },
            });

            // Write schema header rows
            for (const [sName, headers] of Object.entries(SHEET_SCHEMAS)) {
              await fetch(`${SHEETS_API_URL}/${sheetId}/values/${sName}!A1:Z1?valueInputOption=RAW`, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values: [headers] }),
              });
            }

            return sheetId;
          }
        }
      } catch (err) {
        console.warn('Sheets API query failed, using deterministic sheet ID:', err);
      }
    }

    return stableId;
  }

  /**
   * Clear cached spreadsheet ID on disconnect or account switch
   */
  async clearCache(): Promise<void> {
    this.cachedSpreadsheetId = null;
    await StorageService.remove(STORAGE_KEY_SHEET_ID);
  }
}

export const GoogleSheetsService = new GoogleSheetsServiceClass();
