/**
 * SetReminderTimingModal — Interactive Timing & Phone Calendar Selector for LifeVault AI.
 * Opens when clicking "Set Expiry Reminder" to configure timings, lead time,
 * and seamlessly save the event into the user's phone calendar.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { LVCard } from '../../components/LVCard';
import { LVButton } from '../../components/LVButton';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { PhoneCalendarService } from '../../services/calendar/PhoneCalendarService';
import { CalendarSyncService } from '../../services/calendar/CalendarSyncService';
import { NotificationService } from '../../services/notifications/NotificationService';
import { useAppStore } from '../../store/AppContext';
import type { Document } from '../../types';

export interface ReminderTargetData {
  title: string;
  dueDate: string;
  description?: string;
  category?: string;
}

interface SetReminderTimingModalProps {
  visible: boolean;
  document?: Document | null;
  reminderData?: ReminderTargetData | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const TIME_PRESETS = [
  { label: '08:00 AM', value: '08:00', desc: 'Early Morning' },
  { label: '09:00 AM', value: '09:00', desc: 'Standard' },
  { label: '12:00 PM', value: '12:00', desc: 'Noon' },
  { label: '06:00 PM', value: '18:00', desc: 'Evening' },
  { label: '08:00 PM', value: '20:00', desc: 'Night' },
];

const LEAD_TIME_OPTIONS = [
  { label: 'On Due Date', days: 0 },
  { label: '1 Day Before', days: 1 },
  { label: '3 Days Before', days: 3 },
  { label: '7 Days Before', days: 7 },
  { label: '15 Days Before', days: 15 },
  { label: '30 Days Before', days: 30 },
];

export const SetReminderTimingModal: React.FC<SetReminderTimingModalProps> = ({
  visible,
  document,
  reminderData,
  onClose,
  onSuccess,
}) => {
  const { addReminder } = useAppStore();

  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [selectedLeadDays, setSelectedLeadDays] = useState<number>(document ? 7 : 0);
  const [saveToPhoneCalendar, setSaveToPhoneCalendar] = useState<boolean>(true);
  const [enableNotification, setEnableNotification] = useState<boolean>(true);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!document && !reminderData) return null;

  const targetDateStr = document
    ? (document.expiryDate || new Date().toISOString().slice(0, 10))
    : (reminderData?.dueDate || new Date().toISOString().slice(0, 10));

  const baseTitle = document
    ? `Renew: ${document.name}`
    : (reminderData?.title || 'Reminder');

  // Calculate reminder date based on lead days
  const calculateReminderDate = (baseDateStr: string, daysBefore: number): string => {
    try {
      const date = new Date(baseDateStr);
      date.setDate(date.getDate() - daysBefore);
      return date.toISOString().slice(0, 10);
    } catch {
      return baseDateStr;
    }
  };

  const scheduledAlertDate = calculateReminderDate(targetDateStr, selectedLeadDays);

  const handleSaveReminder = async () => {
    try {
      setIsSaving(true);

      const reminderTitle = baseTitle;
      const description = customNotes.trim()
        ? `${customNotes} (Due: ${targetDateStr})`
        : document
        ? `Expiry alert for ${document.name} (Policy/Ref: ${document.notes || 'N/A'}). Expiry date: ${targetDateStr}.`
        : (reminderData?.description || `Reminder for ${reminderTitle} scheduled on ${targetDateStr}.`);

      // 1. Save Reminder in App Context (persisted in SQLite / local storage)
      const createdReminder = await addReminder({
        type: 'REMINDER',
        title: reminderTitle,
        dueDate: targetDateStr,
        reminderDates: [scheduledAlertDate],
        time: selectedTime,
        frequency: 'ONCE',
        isCompleted: false,
        description,
        userId: 'current-user',
        syncStatus: 'PENDING_SYNC',
        version: 1,
      });

      // 2. Schedule push notification if enabled
      if (enableNotification) {
        const notifDate = new Date(`${scheduledAlertDate}T${selectedTime}:00`);
        await NotificationService.scheduleLocalNotification({
          id: createdReminder.id,
          title: `Reminder: ${reminderTitle}`,
          body: `Due ${selectedLeadDays === 0 ? 'today' : `in ${selectedLeadDays} days`} (${targetDateStr}). Tap to view.`,
          scheduledDate: notifDate.getTime() > Date.now() ? notifDate : new Date(Date.now() + 5000),
          data: {
            documentId: document?.id,
            reminderId: createdReminder.id,
          },
        });
      }

      // 3. Sync to Google Calendar mapping registry
      await CalendarSyncService.syncReminderToCalendar(createdReminder);

      // 4. Save to phone's native calendar app if enabled
      if (saveToPhoneCalendar) {
        await PhoneCalendarService.addToPhoneCalendar({
          title: reminderTitle,
          description,
          date: scheduledAlertDate,
          time: selectedTime,
        });
      }

      setIsSaving(false);
      onClose();
      if (onSuccess) onSuccess();

      Alert.alert(
        'Reminder Scheduled',
        `Alert set for ${scheduledAlertDate} at ${selectedTime}.\n${
          saveToPhoneCalendar ? 'Event also opened for your Phone Calendar.' : ''
        }`,
      );
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Error', err?.message || 'Failed to schedule reminder');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <AnimatedIcon name="calendar" size={22} active color={colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {document ? 'Set Expiry Reminder' : 'Set Reminder Timing'}
                </Text>
                <Text style={styles.headerSub} numberOfLines={1}>{baseTitle}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Target Date Card */}
            <LVCard style={styles.targetCard}>
              <View style={styles.targetRow}>
                <View>
                  <Text style={styles.targetLabel}>
                    {document ? 'DOCUMENT EXPIRY DATE' : 'TARGET / DUE DATE'}
                  </Text>
                  <Text style={styles.targetDate}>{targetDateStr}</Text>
                </View>
                <View style={styles.targetPill}>
                  <Text style={styles.targetPillText}>Alert: {scheduledAlertDate}</Text>
                </View>
              </View>
            </LVCard>

            {/* Advance Alert Days */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>WHEN TO NOTIFY YOU</Text>
              <View style={styles.chipsWrap}>
                {LEAD_TIME_OPTIONS.map(opt => {
                  const isSelected = selectedLeadDays === opt.days;
                  return (
                    <TouchableOpacity
                      key={opt.days}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedLeadDays(opt.days)}
                      activeOpacity={0.8}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Timing Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ALERT TIME</Text>
              <View style={styles.chipsWrap}>
                {TIME_PRESETS.map(preset => {
                  const isSelected = selectedTime === preset.value;
                  return (
                    <TouchableOpacity
                      key={preset.value}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedTime(preset.value)}
                      activeOpacity={0.8}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {preset.label}
                      </Text>
                      <Text
                        style={[
                          styles.chipSubText,
                          isSelected && styles.chipSubTextActive,
                        ]}>
                        {preset.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Calendar & Notification Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>INTEGRATIONS</Text>
              <LVCard noPadding>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <View style={styles.rowInline}>
                      <AnimatedIcon name="calendar" size={18} active color={colors.primary} />
                      <Text style={styles.toggleLabel}>Save to Phone Calendar</Text>
                    </View>
                    <Text style={styles.toggleSub}>
                      Directly opens and registers event in your phone's native calendar
                    </Text>
                  </View>
                  <Switch
                    value={saveToPhoneCalendar}
                    onValueChange={setSaveToPhoneCalendar}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <View style={styles.rowInline}>
                      <AnimatedIcon name="bell" size={18} active color={colors.secondary} />
                      <Text style={styles.toggleLabel}>Device Push Notification</Text>
                    </View>
                    <Text style={styles.toggleSub}>
                      Receive an alert chime on this phone at scheduled time
                    </Text>
                  </View>
                  <Switch
                    value={enableNotification}
                    onValueChange={setEnableNotification}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
              </LVCard>
            </View>

            {/* Custom Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>OPTIONAL REMINDER NOTE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Call agent before renewal, check NCB bonus..."
                placeholderTextColor={colors.textTertiary}
                value={customNotes}
                onChangeText={setCustomNotes}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <LVButton
                title={isSaving ? 'Scheduling...' : 'Save & Add to Phone Calendar'}
                onPress={handleSaveReminder}
                variant="primary"
                fullWidth
                size="lg"
                disabled={isSaving}
              />
              <LVButton
                title="Cancel"
                onPress={onClose}
                variant="ghost"
                fullWidth
                size="md"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 220,
  },
  closeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  closeText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.md,
  },
  targetCard: {
    backgroundColor: `${colors.primary}08`,
    borderColor: `${colors.primary}30`,
    borderWidth: 1,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  targetDate: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  targetPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
  },
  targetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 100,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.white,
  },
  chipSubText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chipSubTextActive: {
    color: `${colors.white}90`,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  actions: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
