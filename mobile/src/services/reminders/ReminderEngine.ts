/**
 * ReminderEngine — Calculation of recurring occurrences, document expiry sweeps,
 * and automated alert scheduling.
 *
 * Implements Section 81 (Phase 6):
 * - Recurring reminder calculation (DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM)
 * - Auto-creation of next recurring instance upon completion
 * - Expiry sweeps across documents, assets, and vehicles
 * - Auto-alert scheduling with NotificationService & CalendarSyncService
 */

import type { Reminder, Document, ReminderFrequency } from '../../types';
import { ReminderRepository } from '../repositories/ReminderRepository';
import { NotificationService } from '../notifications/NotificationService';
import { CalendarSyncService } from '../calendar/CalendarSyncService';

class ReminderEngineClass {
  /**
   * Calculate next due date for recurring reminder.
   */
  calculateNextDueDate(
    currentDueDate: string,
    frequency: ReminderFrequency,
    customDays?: number,
  ): string {
    const d = new Date(currentDueDate);

    switch (frequency) {
      case 'DAILY':
        d.setDate(d.getDate() + 1);
        break;
      case 'WEEKLY':
        d.setDate(d.getDate() + 7);
        break;
      case 'MONTHLY':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'YEARLY':
        d.setFullYear(d.getFullYear() + 1);
        break;
      case 'CUSTOM':
        d.setDate(d.getDate() + (customDays || 30));
        break;
      case 'ONCE':
      default:
        return currentDueDate;
    }

    return d.toISOString().split('T')[0];
  }

  /**
   * Complete reminder and spawn next occurrence if recurring.
   */
  async handleCompleteReminder(reminderId: string): Promise<{
    completed: Reminder | null;
    nextInstance: Reminder | null;
  }> {
    const existing = await ReminderRepository.findById(reminderId);
    if (!existing) return { completed: null, nextInstance: null };

    // 1. Mark current reminder as completed
    const completed = await ReminderRepository.markComplete(reminderId);

    // 2. Cancel pending local notifications for completed item
    await NotificationService.cancelReminderNotifications(reminderId);

    // 3. If recurring, calculate and spawn next instance
    let nextInstance: Reminder | null = null;
    if (existing.frequency !== 'ONCE') {
      const nextDueDate = this.calculateNextDueDate(
        existing.dueDate,
        existing.frequency,
        existing.customPeriodDays,
      );

      nextInstance = await ReminderRepository.create({
        type: 'REMINDER',
        title: existing.title,
        description: existing.description,
        dueDate: nextDueDate,
        reminderDates: [nextDueDate],
        time: existing.time || '09:00',
        frequency: existing.frequency,
        customPeriodDays: existing.customPeriodDays,
        isCompleted: false,
        relatedEntityId: existing.relatedEntityId,
        relatedEntityType: existing.relatedEntityType,
        userId: existing.userId || 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      // Schedule notification and calendar event for next instance
      await NotificationService.scheduleReminderNotification(nextInstance);
      await CalendarSyncService.syncReminderToCalendar(nextInstance);
    }

    return { completed, nextInstance };
  }

  /**
   * Reschedule a reminder to a new date and time.
   */
  async rescheduleReminder(
    reminderId: string,
    newDueDate: string,
    newTime = '09:00',
  ): Promise<Reminder | null> {
    const updated = await ReminderRepository.update(reminderId, {
      dueDate: newDueDate,
      time: newTime,
      reminderDates: [newDueDate],
      isCompleted: false,
      completedAt: undefined,
    });

    if (updated) {
      // Re-schedule notification
      await NotificationService.cancelReminderNotifications(reminderId);
      await NotificationService.scheduleReminderNotification(updated);
      await CalendarSyncService.syncReminderToCalendar(updated);
    }

    return updated;
  }

  /**
   * Scan all documents for upcoming expiries and return alerts.
   */
  detectExpiringDocuments(
    documents: Document[],
    withinDays = 30,
  ): Array<{ document: Document; daysLeft: number }> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiring: Array<{ document: Document; daysLeft: number }> = [];

    for (const doc of documents) {
      if (!doc.expiryDate) continue;

      const exp = new Date(doc.expiryDate);
      exp.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / 86400_000);

      if (diffDays >= 0 && diffDays <= withinDays) {
        expiring.push({ document: doc, daysLeft: diffDays });
      }
    }

    return expiring.sort((a, b) => a.daysLeft - b.daysLeft);
  }
}

export const ReminderEngine = new ReminderEngineClass();
