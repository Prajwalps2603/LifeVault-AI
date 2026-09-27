/**
 * ReminderDetailModal — Inspection, rescheduling, and calendar syncing for reminders.
 *
 * Implements Section 81 (Phase 6):
 * - Status toggle (Complete / Reopen)
 * - Recurring reminder engine automation
 * - Reschedule quick buttons (+1 Day, +1 Week, +1 Month)
 * - Google Calendar sync (Rule 10 duplicate prevention)
 * - Deletion with local notification cleanup
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { LVButton, LVBadge, LVCard, LVDivider } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { formatDate } from '../../utils/helpers';
import { ReminderEngine } from '../../services/reminders/ReminderEngine';
import { CalendarSyncService } from '../../services/calendar/CalendarSyncService';
import { PhoneCalendarService } from '../../services/calendar/PhoneCalendarService';
import type { Reminder } from '../../types';

interface ReminderDetailModalProps {
  visible: boolean;
  reminder: Reminder | null;
  onClose: () => void;
}

export const ReminderDetailModal: React.FC<ReminderDetailModalProps> = ({
  visible,
  reminder,
  onClose,
}) => {
  const { deleteReminder, updateReminder, loadAll } = useAppStore();
  const [isCalSynced, setIsCalSynced] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reminder) {
      CalendarSyncService.isEntitySynced(reminder.id).then(setIsCalSynced);
    }
  }, [reminder]);

  if (!reminder) return null;

  const handleToggleDone = async () => {
    try {
      setLoading(true);
      if (!reminder.isCompleted) {
        const { nextInstance } = await ReminderEngine.handleCompleteReminder(reminder.id);
        await loadAll();
        if (nextInstance) {
          Alert.alert(
            'Completed & Rescheduled',
            `Marked complete! Because this reminder repeats ${reminder.frequency.toLowerCase()}, the next alert has been scheduled for ${nextInstance.dueDate}.`,
          );
        } else {
          Alert.alert('Completed', 'Reminder marked as done.');
        }
      } else {
        await updateReminder(reminder.id, {
          isCompleted: false,
          completedAt: undefined,
        });
        await loadAll();
      }
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (daysToAdd: number) => {
    try {
      const d = new Date(reminder.dueDate);
      d.setDate(d.getDate() + daysToAdd);
      const newDateStr = d.toISOString().split('T')[0];

      await ReminderEngine.rescheduleReminder(reminder.id, newDateStr, reminder.time || '09:00');
      await loadAll();
      Alert.alert('Rescheduled', `Reminder postponed to ${newDateStr}.`);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reschedule');
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setLoading(true);
      const res = await CalendarSyncService.syncReminderToCalendar(reminder);
      setIsCalSynced(true);
      Alert.alert(
        'Calendar Synchronized',
        res.action === 'CREATED'
          ? `Event created in your Google Calendar for ${reminder.dueDate}.`
          : `Calendar event updated for ${reminder.dueDate}. Duplicate prevention active.`,
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to sync to calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToPhoneCalendar = async () => {
    try {
      await PhoneCalendarService.addToPhoneCalendar({
        title: reminder.title,
        description: reminder.description || `LifeVault reminder: ${reminder.title}`,
        date: reminder.dueDate,
        time: reminder.time || '09:00',
      });
      Alert.alert('Phone Calendar', 'Opened reminder in your phone calendar.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to open phone calendar');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Reminder',
      `Delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminder(reminder.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete reminder');
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reminder Details</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Hero Card */}
          <LVCard style={styles.heroCard}>
            <View style={styles.heroRow}>
              <AnimatedIcon name="clock" size={28} active color={colors.primary} />
              <LVBadge
                label={reminder.isCompleted ? 'COMPLETED' : 'ACTIVE ALERT'}
                variant={reminder.isCompleted ? 'success' : 'warning'}
              />
            </View>
            <Text style={styles.heroTitle}>{reminder.title}</Text>
            <Text style={styles.heroDue}>
              Due: {formatDate(reminder.dueDate)} at {reminder.time || '09:00 AM'}
            </Text>
          </LVCard>

          {/* Details Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ALERT CONFIGURATION</Text>
            <LVCard style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Frequency</Text>
                <Text style={styles.infoValue}>{reminder.frequency}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{reminder.time || '09:00 AM'}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: reminder.isCompleted ? colors.success : colors.warning }]}>
                  {reminder.isCompleted ? 'Completed' : 'Pending Alert'}
                </Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Calendar Sync</Text>
                <LVBadge
                  label={isCalSynced ? 'In Calendar' : 'Not synced'}
                  variant={isCalSynced ? 'success' : 'neutral'}
                  small
                />
              </View>
              {reminder.description ? (
                <>
                  <LVDivider style={styles.divider} />
                  <View style={styles.notesBlock}>
                    <Text style={styles.infoLabel}>Description</Text>
                    <Text style={styles.notesValue}>{reminder.description}</Text>
                  </View>
                </>
              ) : null}
            </LVCard>
          </View>

          {/* Reschedule Options */}
          {!reminder.isCompleted && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>QUICK POSTPONE / SNOOZE</Text>
              <View style={styles.snoozeRow}>
                <TouchableOpacity
                  style={styles.snoozeBtn}
                  onPress={() => handleReschedule(1)}
                  activeOpacity={0.7}>
                  <Text style={styles.snoozeBtnText}>+1 Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.snoozeBtn}
                  onPress={() => handleReschedule(7)}
                  activeOpacity={0.7}>
                  <Text style={styles.snoozeBtnText}>+1 Week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.snoozeBtn}
                  onPress={() => handleReschedule(30)}
                  activeOpacity={0.7}>
                  <Text style={styles.snoozeBtnText}>+1 Month</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonStack}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                reminder.isCompleted ? styles.reopenBtn : styles.completeBtn,
              ]}
              onPress={handleToggleDone}
              activeOpacity={0.8}
              disabled={loading}>
              <Text style={styles.actionBtnText}>
                {reminder.isCompleted ? 'Reopen Reminder' : 'Mark as Completed'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.calBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary, marginBottom: spacing.sm }]}
              onPress={handleSaveToPhoneCalendar}
              activeOpacity={0.8}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AnimatedIcon name="calendar" size={16} active color={colors.primary} />
                <Text style={[styles.calBtnText, { fontWeight: '700' }]}>Save to Phone Calendar</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calBtn}
              onPress={handleSyncCalendar}
              activeOpacity={0.8}
              disabled={loading}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AnimatedIcon name="calendar" size={16} active color={colors.primary} />
                <Text style={styles.calBtnText}>Sync to Google Calendar</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.8}>
              <Text style={styles.deleteBtnText}>Delete Reminder</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  closeText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  heroCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroEmoji: {
    fontSize: 28,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  heroDue: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  infoCard: {
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.xs,
  },
  notesBlock: {
    gap: 4,
    paddingTop: spacing.xs,
  },
  notesValue: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  snoozeBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  snoozeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  buttonStack: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  completeBtn: {
    backgroundColor: colors.success,
  },
  reopenBtn: {
    backgroundColor: colors.warning,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  calBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  calBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
