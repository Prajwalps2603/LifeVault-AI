/**
 * LifeVault — Mock Data
 *
 * ⚠️  DEMO DATA ONLY
 * This file contains static mock data for Phase 1 UI development.
 * It is NOT connected to any real database, Google Drive, or backend service.
 * Replace with real data services in Phase 2+.
 */

import type {
  User,
  Document,
  Receipt,
  Expense,
  Payment,
  Reminder,
  Vehicle,
  Asset,
  Insurance,
} from '../types';

// ─── Mock User ───────────────────────────────────────────────────────────────

export const mockUser: User = {
  id: 'usr_001',
  name: 'Prajwal',
  email: 'prajwal@gmail.com',
  photoUrl: undefined,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-27T00:00:00.000Z',
};

// ─── Mock Documents ───────────────────────────────────────────────────────────

export const mockDocuments: Document[] = [
  {
    id: 'doc_001',
    type: 'DOCUMENT',
    userId: 'usr_001',
    documentType: 'INSURANCE',
    name: 'Bike Insurance',
    fileName: 'Bike_Insurance_2026.pdf',
    mimeType: 'application/pdf',
    fileSize: 234567,
    status: 'ORGANIZED',
    expiryDate: '2027-10-14T00:00:00.000Z',
    issueDate: '2026-10-15T00:00:00.000Z',
    relatedEntityId: 'veh_001',
    relatedEntityType: 'VEHICLE',
    extractedData: {
      policyNumber: 'POL12345',
      premium: '₹12,500',
      vehicleNumber: 'KA01XX1234',
      startDate: '15 Oct 2026',
      expiryDate: '14 Oct 2027',
    },
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-10T08:00:00.000Z',
    updatedAt: '2026-09-10T08:00:00.000Z',
  },
  {
    id: 'doc_002',
    type: 'DOCUMENT',
    userId: 'usr_001',
    documentType: 'INVOICE',
    name: 'Laptop Invoice',
    fileName: 'Dell_Laptop_Invoice.pdf',
    mimeType: 'application/pdf',
    fileSize: 189234,
    status: 'ORGANIZED',
    issueDate: '2026-01-15T00:00:00.000Z',
    relatedEntityId: 'ast_001',
    relatedEntityType: 'ASSET',
    extractedData: {
      brand: 'Dell',
      model: 'Inspiron 15',
      amount: '₹78,000',
      invoiceNumber: 'INV-2026-001',
      store: 'Dell Official Store',
    },
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  },
  {
    id: 'doc_003',
    type: 'DOCUMENT',
    userId: 'usr_001',
    documentType: 'WARRANTY',
    name: 'Laptop Warranty',
    fileName: 'Dell_Warranty_Card.pdf',
    mimeType: 'application/pdf',
    fileSize: 98765,
    status: 'ORGANIZED',
    issueDate: '2026-01-15T00:00:00.000Z',
    expiryDate: '2027-01-15T00:00:00.000Z',
    relatedEntityId: 'ast_001',
    relatedEntityType: 'ASSET',
    extractedData: {
      brand: 'Dell',
      warrantyPeriod: '1 Year',
      expiryDate: '15 Jan 2027',
    },
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-15T10:05:00.000Z',
    updatedAt: '2026-09-15T10:05:00.000Z',
  },
  {
    id: 'doc_004',
    type: 'DOCUMENT',
    userId: 'usr_001',
    documentType: 'PUC',
    name: 'Bike PUC Certificate',
    fileName: 'Bike_PUC.pdf',
    mimeType: 'application/pdf',
    status: 'ORGANIZED',
    issueDate: '2026-04-22T00:00:00.000Z',
    expiryDate: '2026-10-22T00:00:00.000Z',
    relatedEntityId: 'veh_001',
    relatedEntityType: 'VEHICLE',
    extractedData: {
      vehicleNumber: 'KA01XX1234',
      testDate: '22 Apr 2026',
      validUntil: '22 Oct 2026',
    },
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-04-22T11:00:00.000Z',
    updatedAt: '2026-04-22T11:00:00.000Z',
  },
];

// ─── Mock Receipts ────────────────────────────────────────────────────────────

export const mockReceipts: Receipt[] = [
  {
    id: 'rct_001',
    type: 'RECEIPT',
    userId: 'usr_001',
    merchantName: 'Reliance Fresh',
    amount: 1850,
    currency: 'INR',
    date: '2026-09-26T00:00:00.000Z',
    category: 'GROCERIES',
    fileName: 'Grocery_Receipt.pdf',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-26T18:00:00.000Z',
    updatedAt: '2026-09-26T18:00:00.000Z',
  },
  {
    id: 'rct_002',
    type: 'RECEIPT',
    userId: 'usr_001',
    merchantName: 'Zomato',
    amount: 650,
    currency: 'INR',
    date: '2026-09-25T00:00:00.000Z',
    category: 'FOOD',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-25T20:00:00.000Z',
    updatedAt: '2026-09-25T20:00:00.000Z',
  },
  {
    id: 'rct_003',
    type: 'RECEIPT',
    userId: 'usr_001',
    merchantName: 'HP Petrol Bunk',
    amount: 1200,
    currency: 'INR',
    date: '2026-09-24T00:00:00.000Z',
    category: 'PETROL',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-24T09:00:00.000Z',
    updatedAt: '2026-09-24T09:00:00.000Z',
  },
];

// ─── Mock Expenses ────────────────────────────────────────────────────────────

export const mockExpenses: Expense[] = [
  {
    id: 'exp_001',
    type: 'EXPENSE',
    userId: 'usr_001',
    title: 'Grocery Shopping',
    amount: 6200,
    currency: 'INR',
    date: '2026-09-01T00:00:00.000Z',
    category: 'GROCERIES',
    merchantName: 'Various',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'exp_002',
    type: 'EXPENSE',
    userId: 'usr_001',
    title: 'Food & Dining',
    amount: 4500,
    currency: 'INR',
    date: '2026-09-01T00:00:00.000Z',
    category: 'FOOD',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'exp_003',
    type: 'EXPENSE',
    userId: 'usr_001',
    title: 'Petrol',
    amount: 3800,
    currency: 'INR',
    date: '2026-09-01T00:00:00.000Z',
    category: 'PETROL',
    vehicleId: 'veh_001',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'exp_004',
    type: 'EXPENSE',
    userId: 'usr_001',
    title: 'Shopping',
    amount: 5250,
    currency: 'INR',
    date: '2026-09-01T00:00:00.000Z',
    category: 'SHOPPING',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'exp_005',
    type: 'EXPENSE',
    userId: 'usr_001',
    title: 'Bills & Utilities',
    amount: 6700,
    currency: 'INR',
    date: '2026-09-01T00:00:00.000Z',
    category: 'BILLS',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'exp_006',
    type: 'EXPENSE',
    userId: 'usr_001',
    title: 'Other',
    amount: 2000,
    currency: 'INR',
    date: '2026-09-01T00:00:00.000Z',
    category: 'OTHER',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
];

// ─── Mock Payments ────────────────────────────────────────────────────────────

export const mockPayments: Payment[] = [
  {
    id: 'pay_001',
    type: 'PAYMENT',
    userId: 'usr_001',
    title: 'Electricity Bill',
    amount: 1450,
    currency: 'INR',
    dueDate: '2026-09-27T00:00:00.000Z', // today
    status: 'DUE',
    category: 'BILLS',
    isRecurring: true,
    recurringPeriodDays: 30,
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'pay_002',
    type: 'PAYMENT',
    userId: 'usr_001',
    title: 'Internet Bill',
    amount: 899,
    currency: 'INR',
    dueDate: '2026-10-02T00:00:00.000Z',
    status: 'UPCOMING',
    category: 'BILLS',
    isRecurring: true,
    recurringPeriodDays: 30,
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'pay_003',
    type: 'PAYMENT',
    userId: 'usr_001',
    title: 'Bike Insurance Premium',
    amount: 12500,
    currency: 'INR',
    dueDate: '2027-10-14T00:00:00.000Z',
    status: 'UPCOMING',
    category: 'INSURANCE',
    isRecurring: true,
    recurringPeriodDays: 365,
    relatedEntityId: 'doc_001',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'pay_004',
    type: 'PAYMENT',
    userId: 'usr_001',
    title: 'OTT Subscription',
    amount: 649,
    currency: 'INR',
    dueDate: '2026-10-10T00:00:00.000Z',
    status: 'UPCOMING',
    category: 'OTHER',
    isRecurring: true,
    recurringPeriodDays: 30,
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
];

// ─── Mock Reminders ───────────────────────────────────────────────────────────

export const mockReminders: Reminder[] = [
  {
    id: 'rem_001',
    type: 'REMINDER',
    userId: 'usr_001',
    title: 'Bike Insurance Renewal',
    description: 'Renew bike insurance before it expires.',
    dueDate: '2027-10-14T00:00:00.000Z',
    reminderDates: ['2027-09-14', '2027-10-07', '2027-10-13'],
    time: '09:00',
    frequency: 'ONCE',
    isCompleted: false,
    relatedEntityId: 'doc_001',
    relatedEntityType: 'DOCUMENT',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-10T08:00:00.000Z',
    updatedAt: '2026-09-10T08:00:00.000Z',
  },
  {
    id: 'rem_002',
    type: 'REMINDER',
    userId: 'usr_001',
    title: 'Bike Service',
    description: 'Schedule next bike service.',
    dueDate: '2027-04-10T00:00:00.000Z',
    reminderDates: ['2027-04-03', '2027-04-09'],
    time: '09:00',
    frequency: 'CUSTOM',
    customPeriodDays: 180,
    isCompleted: false,
    relatedEntityId: 'veh_001',
    relatedEntityType: 'VEHICLE',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-10-10T08:00:00.000Z',
    updatedAt: '2026-10-10T08:00:00.000Z',
  },
  {
    id: 'rem_003',
    type: 'REMINDER',
    userId: 'usr_001',
    title: 'Laptop Warranty Expiry',
    dueDate: '2027-01-15T00:00:00.000Z',
    reminderDates: ['2026-12-15', '2027-01-08'],
    time: '09:00',
    frequency: 'ONCE',
    isCompleted: false,
    relatedEntityId: 'ast_001',
    relatedEntityType: 'VEHICLE',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-15T10:05:00.000Z',
    updatedAt: '2026-09-15T10:05:00.000Z',
  },
];

// ─── Mock Vehicle ─────────────────────────────────────────────────────────────

export const mockVehicles: Vehicle[] = [
  {
    id: 'veh_001',
    type: 'VEHICLE',
    userId: 'usr_001',
    name: 'Honda Activa',
    vehicleType: 'SCOOTER',
    brand: 'Honda',
    model: 'Activa 6G',
    year: 2022,
    registrationNumber: 'KA01XX1234',
    color: 'Pearl Nightstar Black',
    fuelType: 'Petrol',
    insuranceDocumentId: 'doc_001',
    pucDocumentId: 'doc_004',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
];

// ─── Mock Assets ──────────────────────────────────────────────────────────────

export const mockAssets: Asset[] = [
  {
    id: 'ast_001',
    type: 'ASSET',
    userId: 'usr_001',
    name: 'Dell Laptop',
    category: 'ELECTRONICS',
    brand: 'Dell',
    model: 'Inspiron 15 3520',
    serialNumber: 'DLXYZ123456',
    purchaseDate: '2026-01-15T00:00:00.000Z',
    purchasePrice: 78000,
    currency: 'INR',
    warrantyExpiryDate: '2027-01-15T00:00:00.000Z',
    invoiceDocumentId: 'doc_002',
    warrantyDocumentId: 'doc_003',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  },
  {
    id: 'ast_002',
    type: 'ASSET',
    userId: 'usr_001',
    name: 'iPhone 15',
    category: 'ELECTRONICS',
    brand: 'Apple',
    model: 'iPhone 15',
    serialNumber: 'IPHN987654',
    purchaseDate: '2025-11-01T00:00:00.000Z',
    purchasePrice: 79990,
    currency: 'INR',
    warrantyExpiryDate: '2026-11-01T00:00:00.000Z',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2025-11-01T10:00:00.000Z',
    updatedAt: '2025-11-01T10:00:00.000Z',
  },
];

// ─── Mock Insurance ───────────────────────────────────────────────────────────

export const mockInsurances: Insurance[] = [
  {
    id: 'ins_001',
    type: 'INSURANCE',
    userId: 'usr_001',
    policyName: 'Two Wheeler Insurance',
    policyNumber: 'POL12345',
    provider: 'HDFC ERGO',
    premium: 12500,
    currency: 'INR',
    startDate: '2026-10-15T00:00:00.000Z',
    expiryDate: '2027-10-14T00:00:00.000Z',
    coverageType: 'Comprehensive',
    vehicleId: 'veh_001',
    documentId: 'doc_001',
    syncStatus: 'LOCAL_ONLY',
    version: 1,
    createdAt: '2026-09-10T08:00:00.000Z',
    updatedAt: '2026-09-10T08:00:00.000Z',
  },
];

// ─── Aggregated Today Stats ────────────────────────────────────────────────────

export const mockTodayStats = {
  totalSpentThisMonth: 28450,
  currency: 'INR',
  paymentsUpcoming: 3,
  documentsExpiring: 2,
  needsReview: 2,
  dueToday: mockPayments.filter(p => p.status === 'DUE'),
  upcomingAlerts: [
    { id: 'alert_001', title: 'Bike Insurance', subtitle: 'Expires in 7 days', icon: 'shield' as const, urgent: true },
    { id: 'alert_002', title: 'Bike PUC', subtitle: 'Expires in 25 days', icon: 'file' as const, urgent: false },
    { id: 'alert_003', title: 'Laptop Warranty', subtitle: 'Expires in ~4 months', icon: 'shield' as const, urgent: false },
  ],
  recentlyAdded: [
    { id: 'doc_001', name: 'Bike Insurance.pdf', type: 'Insurance', icon: 'shield' as const },
    { id: 'rct_001', name: 'Grocery Receipt.pdf', type: 'Receipt', icon: 'receipt' as const },
    { id: 'doc_002', name: 'Laptop Invoice.pdf', type: 'Invoice', icon: 'file' as const },
  ],
};

// ─── Expense categories for charts ────────────────────────────────────────────

export const mockExpenseCategories = [
  { label: 'Groceries', amount: 6200, color: '#16A34A', percentage: 21.8 },
  { label: 'Food', amount: 4500, color: '#F59E0B', percentage: 15.8 },
  { label: 'Petrol', amount: 3800, color: '#7C3AED', percentage: 13.4 },
  { label: 'Shopping', amount: 5250, color: '#2563EB', percentage: 18.5 },
  { label: 'Bills', amount: 6700, color: '#DC2626', percentage: 23.6 },
  { label: 'Other', amount: 2000, color: '#64748B', percentage: 7.0 },
];

// ─── Mock AI suggestions ──────────────────────────────────────────────────────

export const mockAISuggestions = [
  'What expires this month?',
  'How much did I spend on petrol?',
  'Show my bike documents.',
  'What payments are due this week?',
  'Which warranties expire soon?',
  'How much did I spend this month?',
];

export const mockAIResponses: Record<string, string> = {
  'What expires this month?':
    'You have 2 items expiring this month:\n\n• Bike PUC — expires 22 Oct 2026\n• Laptop Warranty — expires 15 Jan 2027 (next month)',
  'How much did I spend on petrol?':
    'You spent ₹3,800 on petrol this month across 3 transactions.',
  'Show my bike documents.':
    'Your Honda Activa (KA01XX1234) has:\n• Insurance — Active until 14 Oct 2027\n• PUC — Valid until 22 Oct 2026\n• Registration — On file',
  'What payments are due this week?':
    'Payments due this week:\n• Electricity Bill — ₹1,450 — Due today',
  'Which warranties expire soon?':
    'Expiring warranties:\n• Laptop Warranty — 15 Jan 2027 (in ~4 months)',
  'How much did I spend this month?':
    'You have spent ₹28,450 this month across 6 categories. Your biggest expense is Bills (₹6,700).',
};
