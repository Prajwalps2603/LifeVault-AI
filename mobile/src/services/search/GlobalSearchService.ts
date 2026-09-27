/**
 * GlobalSearchService — Fast, multi-entity search engine across all LifeVault categories.
 *
 * Implements Section 83 (Phase 8):
 * - Unified indexing across Documents, Expenses, Payments, Vehicles, Assets, and Reminders
 * - Highlight snippet generation
 * - Direct deep-link identifier references
 */

import { DocumentRepository } from '../repositories/DocumentRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { AssetRepository } from '../repositories/AssetRepository';
import { ReminderRepository } from '../repositories/ReminderRepository';
import { formatCurrency, formatDate } from '../../utils/helpers';
import type { Document, Expense, Payment, Vehicle, Asset, Reminder } from '../../types';
import type { IconType } from '../../components/AnimatedIcon';

export interface GlobalSearchResult {
  id: string;
  type: 'DOCUMENT' | 'EXPENSE' | 'PAYMENT' | 'VEHICLE' | 'ASSET' | 'REMINDER';
  title: string;
  subtitle: string;
  snippet?: string;
  icon: IconType;
  rawItem: Document | Expense | Payment | Vehicle | Asset | Reminder;
}

class GlobalSearchServiceClass {
  async search(query: string): Promise<GlobalSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const [docs, expenses, payments, vehicles, assets, reminders] = await Promise.all([
      DocumentRepository.search(q),
      ExpenseRepository.search(q),
      PaymentRepository.search(q),
      VehicleRepository.search(q),
      AssetRepository.search(q),
      ReminderRepository.search(q),
    ]);

    const results: GlobalSearchResult[] = [];

    // Documents
    docs.forEach(d => {
      results.push({
        id: d.id,
        type: 'DOCUMENT',
        title: d.name,
        subtitle: `${d.documentType} ${d.expiryDate ? `• Exp: ${d.expiryDate}` : ''}`,
        snippet: d.notes || d.fileName,
        icon: d.documentType === 'INSURANCE' ? 'shield' : d.documentType === 'PUC' ? 'car' : 'file',
        rawItem: d,
      });
    });

    // Expenses
    expenses.forEach(e => {
      results.push({
        id: e.id,
        type: 'EXPENSE',
        title: e.title,
        subtitle: `${formatCurrency(e.amount)} • ${e.category} (${e.date})`,
        snippet: e.merchantName ? `Merchant: ${e.merchantName}` : e.description,
        icon: 'cart',
        rawItem: e,
      });
    });

    // Payments
    payments.forEach(p => {
      results.push({
        id: p.id,
        type: 'PAYMENT',
        title: p.title,
        subtitle: `${formatCurrency(p.amount)} • Due: ${p.dueDate} (${p.status})`,
        snippet: `Category: ${p.category}`,
        icon: 'bill',
        rawItem: p,
      });
    });

    // Vehicles
    vehicles.forEach(v => {
      results.push({
        id: v.id,
        type: 'VEHICLE',
        title: v.name,
        subtitle: `${v.registrationNumber} • ${v.brand} ${v.model || ''}`,
        snippet: `Fuel: ${v.fuelType || 'Petrol'} • Year: ${v.year || '—'}`,
        icon: 'vehicle',
        rawItem: v,
      });
    });

    // Assets
    assets.forEach(a => {
      results.push({
        id: a.id,
        type: 'ASSET',
        title: a.name,
        subtitle: `${a.brand || 'Item'} • ${a.category}`,
        snippet: a.warrantyExpiryDate ? `Warranty until ${a.warrantyExpiryDate}` : undefined,
        icon: 'file',
        rawItem: a,
      });
    });

    // Reminders
    reminders.forEach(r => {
      results.push({
        id: r.id,
        type: 'REMINDER',
        title: r.title,
        subtitle: `Due: ${r.dueDate} at ${r.time || '09:00'}`,
        snippet: r.description,
        icon: 'calendar',
        rawItem: r,
      });
    });

    return results;
  }
}

export const GlobalSearchService = new GlobalSearchServiceClass();
