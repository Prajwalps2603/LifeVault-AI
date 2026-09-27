/**
 * Pure reducer — no side effects, no async, no storage calls.
 */

import { AppState, AppAction, initialState } from './types';

function replaceById<T extends { id: string }>(list: T[], updated: T): T[] {
  return list.map(item => (item.id === updated.id ? updated : item));
}

function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter(item => item.id !== id);
}

export function appReducer(state: AppState = initialState, action: AppAction): AppState {
  switch (action.type) {
    // ── Lifecycle ──────────────────────────────────────────────────────────────
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_SEEDED':
      return { ...state, isSeeded: action.payload };

    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
      };

    // ── Phase 3 — Google & Sync ────────────────────────────────────────────────
    case 'SET_GOOGLE_USER':
      return {
        ...state,
        googleUser: action.payload.user,
        isGoogleConnected: action.payload.isConnected,
      };

    case 'SET_DRIVE_FOLDERS':
      return { ...state, driveFolders: action.payload };

    case 'SET_SPREADSHEET_ID':
      return { ...state, spreadsheetId: action.payload };

    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload, syncError: action.payload ? null : state.syncError };

    case 'SET_SYNC_RESULT':
      return {
        ...state,
        isSyncing: false,
        lastSyncedAt: action.payload.lastSyncedAt || state.lastSyncedAt,
        syncError: action.payload.error,
      };

    case 'SET_PENDING_COUNT':
      return { ...state, pendingCount: action.payload };

    // ── Documents ──────────────────────────────────────────────────────────────
    case 'ADD_DOCUMENT':
      return { ...state, documents: [action.payload, ...state.documents] };
    case 'UPDATE_DOCUMENT':
      return { ...state, documents: replaceById(state.documents, action.payload) };
    case 'DELETE_DOCUMENT':
      return { ...state, documents: removeById(state.documents, action.payload) };

    // ── Receipts ───────────────────────────────────────────────────────────────
    case 'ADD_RECEIPT':
      return { ...state, receipts: [action.payload, ...state.receipts] };
    case 'UPDATE_RECEIPT':
      return { ...state, receipts: replaceById(state.receipts, action.payload) };
    case 'DELETE_RECEIPT':
      return { ...state, receipts: removeById(state.receipts, action.payload) };

    // ── Expenses ───────────────────────────────────────────────────────────────
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case 'UPDATE_EXPENSE':
      return { ...state, expenses: replaceById(state.expenses, action.payload) };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: removeById(state.expenses, action.payload) };

    // ── Payments ───────────────────────────────────────────────────────────────
    case 'ADD_PAYMENT':
      return { ...state, payments: [action.payload, ...state.payments] };
    case 'UPDATE_PAYMENT':
      return { ...state, payments: replaceById(state.payments, action.payload) };
    case 'DELETE_PAYMENT':
      return { ...state, payments: removeById(state.payments, action.payload) };

    // ── Vehicles ───────────────────────────────────────────────────────────────
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [action.payload, ...state.vehicles] };
    case 'UPDATE_VEHICLE':
      return { ...state, vehicles: replaceById(state.vehicles, action.payload) };
    case 'DELETE_VEHICLE':
      return { ...state, vehicles: removeById(state.vehicles, action.payload) };

    // ── Assets ─────────────────────────────────────────────────────────────────
    case 'ADD_ASSET':
      return { ...state, assets: [action.payload, ...state.assets] };
    case 'UPDATE_ASSET':
      return { ...state, assets: replaceById(state.assets, action.payload) };
    case 'DELETE_ASSET':
      return { ...state, assets: removeById(state.assets, action.payload) };

    // ── Reminders ──────────────────────────────────────────────────────────────
    case 'ADD_REMINDER':
      return { ...state, reminders: [action.payload, ...state.reminders] };
    case 'UPDATE_REMINDER':
      return { ...state, reminders: replaceById(state.reminders, action.payload) };
    case 'DELETE_REMINDER':
      return { ...state, reminders: removeById(state.reminders, action.payload) };

    default:
      return state;
  }
}
