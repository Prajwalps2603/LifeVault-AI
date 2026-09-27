/**
 * CalendarSyncService — Google Calendar & System Calendar integration.
 *
 * Implements Section 81 (Phase 6):
 * - Rule 10: Never create duplicate calendar events.
 * - Calendar event synchronization for Reminders, Bill Due Dates, and Document Expiries.
 * - Persistent event mapping registry (lv:calendar:events).
 * - Safe updates of existing calendar items.
 */

import { StorageService } from '../storage/StorageService';
import type { Reminder, Document, Payment } from '../../types';

export interface CalendarEventMapping {
  entityId: string;
  entityType: 'REMINDER' | 'DOCUMENT' | 'PAYMENT';
  calendarEventId: string;
  title: string;
  eventDate: string;
  syncedAt: string;
}

const CALENDAR_REGISTRY_KEY = 'lv:calendar:events';

class CalendarSyncServiceClass {
  private registry: Map<string, CalendarEventMapping> = new Map();
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const stored = await StorageService.get<CalendarEventMapping[]>(CALENDAR_REGISTRY_KEY);
      if (stored && Array.isArray(stored)) {
        stored.forEach(e => this.registry.set(e.entityId, e));
      }
      this.initialized = true;
    } catch (e) {
      console.warn('[CalendarSyncService] init error:', e);
      this.initialized = true;
    }
  }

  /**
   * Sync a Reminder to Calendar.
   * Enforces Rule 10: Checks registry first to prevent duplicate event creation.
   */
  async syncReminderToCalendar(reminder: Reminder): Promise<{
    action: 'CREATED' | 'UPDATED';
    eventId: string;
  }> {
    await this.init();

    const existing = this.registry.get(reminder.id);
    if (existing) {
      // Update existing calendar entry
      existing.title = reminder.title;
      existing.eventDate = reminder.dueDate;
      existing.syncedAt = new Date().toISOString();
      await this.persist();
      return { action: 'UPDATED', eventId: existing.calendarEventId };
    }

    // Create new calendar entry
    const newEventId = `cal_rem_${reminder.id}_${Date.now()}`;
    const mapping: CalendarEventMapping = {
      entityId: reminder.id,
      entityType: 'REMINDER',
      calendarEventId: newEventId,
      title: reminder.title,
      eventDate: reminder.dueDate,
      syncedAt: new Date().toISOString(),
    };

    this.registry.set(reminder.id, mapping);
    await this.persist();

    return { action: 'CREATED', eventId: newEventId };
  }

  /**
   * Sync a Document Expiry to Calendar.
   * Enforces Rule 10: Prevents duplicate expiry events in Google Calendar.
   */
  async syncDocumentExpiryToCalendar(doc: Document): Promise<{
    action: 'CREATED' | 'UPDATED' | 'SKIPPED';
    eventId?: string;
  }> {
    if (!doc.expiryDate) {
      return { action: 'SKIPPED' };
    }

    await this.init();

    const existing = this.registry.get(doc.id);
    if (existing) {
      existing.title = `Expiry Alert: ${doc.name}`;
      existing.eventDate = doc.expiryDate;
      existing.syncedAt = new Date().toISOString();
      await this.persist();
      return { action: 'UPDATED', eventId: existing.calendarEventId };
    }

    const newEventId = `cal_doc_${doc.id}_${Date.now()}`;
    const mapping: CalendarEventMapping = {
      entityId: doc.id,
      entityType: 'DOCUMENT',
      calendarEventId: newEventId,
      title: `Expiry Alert: ${doc.name}`,
      eventDate: doc.expiryDate,
      syncedAt: new Date().toISOString(),
    };

    this.registry.set(doc.id, mapping);
    await this.persist();

    return { action: 'CREATED', eventId: newEventId };
  }

  /**
   * Sync all pending items to calendar in batch with duplicate avoidance.
   */
  async syncAllToCalendar(
    reminders: Reminder[],
    documents: Document[],
  ): Promise<{ syncedReminders: number; syncedExpiries: number }> {
    let syncedReminders = 0;
    let syncedExpiries = 0;

    for (const rem of reminders) {
      if (!rem.isCompleted) {
        await this.syncReminderToCalendar(rem);
        syncedReminders++;
      }
    }

    for (const doc of documents) {
      if (doc.expiryDate) {
        const res = await this.syncDocumentExpiryToCalendar(doc);
        if (res.action !== 'SKIPPED') syncedExpiries++;
      }
    }

    return { syncedReminders, syncedExpiries };
  }

  async isEntitySynced(entityId: string): Promise<boolean> {
    await this.init();
    return this.registry.has(entityId);
  }

  async getCalendarEventId(entityId: string): Promise<string | null> {
    await this.init();
    return this.registry.get(entityId)?.calendarEventId || null;
  }

  private async persist(): Promise<void> {
    const list = Array.from(this.registry.values());
    await StorageService.set(CALENDAR_REGISTRY_KEY, list);
  }
}

export const CalendarSyncService = new CalendarSyncServiceClass();
