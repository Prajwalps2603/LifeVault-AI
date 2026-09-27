/**
 * LifeVault — Core Type Definitions
 * All shared data models for the application.
 */

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  googleAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Sync ────────────────────────────────────────────────────────────────────

export type SyncStatus =
  | 'LOCAL_ONLY'
  | 'PENDING_SYNC'
  | 'SYNCING'
  | 'SYNCED'
  | 'SYNC_FAILED'
  | 'CONFLICT';

export interface SyncMetadata {
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ─── Base Record ──────────────────────────────────────────────────────────────

export interface BaseRecord extends SyncMetadata {
  id: string;
  userId: string;
  tags?: string[];
  notes?: string;
}

// ─── Document ────────────────────────────────────────────────────────────────

export type DocumentType =
  | 'INSURANCE'
  | 'INVOICE'
  | 'RECEIPT'
  | 'WARRANTY'
  | 'REGISTRATION'
  | 'PUC'
  | 'SERVICE_RECORD'
  | 'CONTRACT'
  | 'IDENTITY'
  | 'MEDICAL'
  | 'OTHER';

export type DocumentStatus = 'ORGANIZED' | 'PENDING_REVIEW' | 'NEEDS_REVIEW' | 'EXPIRED';

export interface Document extends BaseRecord {
  type: 'DOCUMENT';
  documentType: DocumentType;
  name: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  driveFileId?: string;
  driveUrl?: string;
  localUri?: string;
  thumbnailUrl?: string;
  status: DocumentStatus;
  expiryDate?: string;
  issueDate?: string;
  relatedEntityId?: string;   // vehicle/asset ID
  relatedEntityType?: 'VEHICLE' | 'ASSET';
  extractedData?: Record<string, string>;
  ocrText?: string;
}

// ─── Receipt ─────────────────────────────────────────────────────────────────

export interface Receipt extends BaseRecord {
  type: 'RECEIPT';
  merchantName: string;
  amount: number;
  currency: string;
  date: string;
  category: ExpenseCategory;
  items?: ReceiptItem[];
  fileName?: string;
  driveFileId?: string;
  localUri?: string;
  expenseId?: string;
}

export interface ReceiptItem {
  name: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
}

// ─── Expense ─────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'GROCERIES'
  | 'FOOD'
  | 'PETROL'
  | 'SHOPPING'
  | 'BILLS'
  | 'TRANSPORT'
  | 'MEDICAL'
  | 'ENTERTAINMENT'
  | 'INSURANCE'
  | 'SERVICE'
  | 'FUEL'
  | 'OTHER';

export interface Expense extends BaseRecord {
  type: 'EXPENSE';
  title: string;
  amount: number;
  currency: string;
  date: string;
  category: ExpenseCategory;
  merchantName?: string;
  receiptId?: string;
  vehicleId?: string;
  description?: string;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export type PaymentStatus = 'DUE' | 'UPCOMING' | 'PAID' | 'OVERDUE';

export interface Payment extends BaseRecord {
  type: 'PAYMENT';
  title: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  category: string;
  isRecurring: boolean;
  recurringPeriodDays?: number;
  relatedEntityId?: string;
}

// ─── Reminder ────────────────────────────────────────────────────────────────

export type ReminderFrequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export interface Reminder extends BaseRecord {
  type: 'REMINDER';
  title: string;
  description?: string;
  dueDate: string;
  reminderDates: string[];   // multiple alert times
  time: string;              // HH:mm
  frequency: ReminderFrequency;
  customPeriodDays?: number;
  isCompleted: boolean;
  completedAt?: string;
  nextOccurrence?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'DOCUMENT' | 'VEHICLE' | 'ASSET' | 'PAYMENT';
  notificationIds?: string[];
}

// ─── Vehicle ─────────────────────────────────────────────────────────────────

export type VehicleType = 'BIKE' | 'CAR' | 'TRUCK' | 'SCOOTER' | 'OTHER';

export interface Vehicle extends BaseRecord {
  type: 'VEHICLE';
  name: string;
  vehicleType: VehicleType;
  brand: string;
  model?: string;
  year?: number;
  registrationNumber: string;
  color?: string;
  fuelType?: string;
  chassisNumber?: string;
  engineNumber?: string;
  // Linked records
  insuranceDocumentId?: string;
  pucDocumentId?: string;
  registrationDocumentId?: string;
}

// ─── Asset ───────────────────────────────────────────────────────────────────

export type AssetCategory =
  | 'ELECTRONICS'
  | 'APPLIANCE'
  | 'FURNITURE'
  | 'VEHICLE'
  | 'JEWELLERY'
  | 'PROPERTY'
  | 'OTHER';

export interface Asset extends BaseRecord {
  type: 'ASSET';
  name: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currency: string;
  warrantyExpiryDate?: string;
  // Linked records
  invoiceDocumentId?: string;
  warrantyDocumentId?: string;
}

// ─── Insurance ───────────────────────────────────────────────────────────────

export interface Insurance extends BaseRecord {
  type: 'INSURANCE';
  policyName: string;
  policyNumber: string;
  provider: string;
  premium: number;
  currency: string;
  startDate: string;
  expiryDate: string;
  coverageType?: string;
  vehicleId?: string;
  assetId?: string;
  documentId?: string;
}

// ─── Warranty ────────────────────────────────────────────────────────────────

export interface Warranty extends BaseRecord {
  type: 'WARRANTY';
  productName: string;
  brand?: string;
  purchaseDate: string;
  expiryDate: string;
  assetId?: string;
  documentId?: string;
}

// ─── Service Record ──────────────────────────────────────────────────────────

export interface ServiceRecord extends BaseRecord {
  type: 'SERVICE_RECORD';
  title: string;
  serviceDate: string;
  nextServiceDate?: string;
  cost?: number;
  currency: string;
  serviceCentre?: string;
  vehicleId?: string;
  assetId?: string;
  documentId?: string;
}

// ─── Calendar Event ──────────────────────────────────────────────────────────

export interface CalendarEvent extends BaseRecord {
  type: 'CALENDAR_EVENT';
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay: boolean;
  googleEventId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// ─── AI Extraction ───────────────────────────────────────────────────────────

export interface AIExtraction {
  id: string;
  sourceDocumentId: string;
  extractedFields: ExtractedField[];
  confidence: number;
  documentType?: DocumentType;
  status: 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';
  createdAt: string;
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  needsReview: boolean;
}

// ─── Vault Record Union ───────────────────────────────────────────────────────

export type VaultRecord =
  | Document
  | Receipt
  | Expense
  | Payment
  | Reminder
  | Vehicle
  | Asset
  | Insurance
  | Warranty
  | ServiceRecord
  | CalendarEvent;

// ─── Navigation Params ────────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainTabs: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Vault: undefined;
  Money: undefined;
  Profile: undefined;
};

export type VaultStackParamList = {
  VaultHome: undefined;
  DocumentList: undefined;
  DocumentDetail: { documentId: string };
  AIExtractionReview: { extractionId: string };
  ReceiptScan: undefined;
  VehicleList: undefined;
  VehicleDetail: { vehicleId: string };
  AssetList: undefined;
  AssetDetail: { assetId: string };
};

export type MoneyStackParamList = {
  MoneyHome: undefined;
  ExpenseList: undefined;
  PaymentList: undefined;
  Analytics: undefined;
  CalendarView: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  AIAssistant: undefined;
  Reminders: undefined;
};
