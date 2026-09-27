import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { useAppStore } from '../../store/AppContext';
import { LVButton } from '../../components/LVButton';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { PhoneCalendarService } from '../../services/calendar/PhoneCalendarService';
import { NotificationService } from '../../services/notifications/NotificationService';
import type { ReminderFrequency } from '../../types';

interface AddReminderFormProps {
  visible: boolean;
  onClose: () => void;
}

const FREQUENCIES: { label: string; value: ReminderFrequency }[] = [
  { label: 'Once', value: 'ONCE' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Yearly', value: 'YEARLY' },
];

export const AddReminderForm: React.FC<AddReminderFormProps> = ({ visible, onClose }) => {
  const { addReminder } = useAppStore();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('09:00');
  const [saveToPhoneCalendar, setSaveToPhoneCalendar] = useState(true);
  const [frequency, setFrequency] = useState<ReminderFrequency>('ONCE');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDueDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    });
    setTime('09:00');
    setSaveToPhoneCalendar(true);
    setFrequency('ONCE');
    setDescription('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a reminder title.');
      return;
    }

    if (!dueDate.trim()) {
      Alert.alert('Required', 'Please enter a due date (YYYY-MM-DD).');
      return;
    }

    try {
      setLoading(true);
      const reminderTime = time.trim() || '09:00';
      const created = await addReminder({
        type: 'REMINDER',
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate.trim(),
        reminderDates: [dueDate.trim()],
        time: reminderTime,
        frequency,
        isCompleted: false,
        userId: 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      // Schedule local notification
      try {
        const notifDate = new Date(`${dueDate.trim()}T${reminderTime}:00`);
        await NotificationService.scheduleLocalNotification({
          id: created.id,
          title: `Reminder: ${title.trim()}`,
          body: description.trim() || `Scheduled for today at ${reminderTime}.`,
          scheduledDate: notifDate.getTime() > Date.now() ? notifDate : new Date(Date.now() + 5000),
          data: { reminderId: created.id },
        });
      } catch (e) {
        console.warn('Notification schedule warning:', e);
      }

      // Save to phone calendar if enabled
      if (saveToPhoneCalendar) {
        await PhoneCalendarService.addToPhoneCalendar({
          title: title.trim(),
          description: description.trim() || `LifeVault reminder for ${title.trim()}`,
          date: dueDate.trim(),
          time: reminderTime,
        });
      }

      resetForm();
      onClose();
      Alert.alert(
        'Reminder Created',
        `Reminder saved for ${dueDate.trim()} at ${reminderTime}.${
          saveToPhoneCalendar ? '\nOpening event in your Phone Calendar.' : ''
        }`,
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save reminder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Reminder</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Reminder Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Car Insurance Renewal, Dentist Checkup"
                placeholderTextColor={colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            {/* Date & Time Row */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Time (24h)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00"
                  placeholderTextColor={colors.textTertiary}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

            {/* Quick Time Preset Chips */}
            <View style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.label, { marginBottom: 6 }]}>Quick Time Presets</Text>
              <View style={styles.chipsContainer}>
                {[
                  { label: '08:00 AM', value: '08:00' },
                  { label: '09:00 AM', value: '09:00' },
                  { label: '12:00 PM', value: '12:00' },
                  { label: '06:00 PM', value: '18:00' },
                  { label: '08:00 PM', value: '20:00' },
                ].map(item => {
                  const isSelected = time === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setTime(item.value)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Frequency selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.chipsContainer}>
                {FREQUENCIES.map(item => {
                  const selected = frequency === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setFrequency(item.value)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description / Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description / Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional instructions or notes..."
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Phone Calendar Sync Switch */}
            <View style={styles.switchRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.calIconWrap}>
                  <AnimatedIcon name="calendar" size={18} color={colors.primary} active />
                </View>
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text style={styles.switchTitle}>Save to Phone Calendar</Text>
                  <Text style={styles.switchSubtitle}>Opens event in your device calendar app</Text>
                </View>
              </View>
              <Switch
                value={saveToPhoneCalendar}
                onValueChange={setSaveToPhoneCalendar}
                trackColor={{ false: colors.border, true: colors.primaryMid }}
                thumbColor={saveToPhoneCalendar ? colors.primary : colors.surface}
              />
            </View>

            <View style={styles.actions}>
              <LVButton
                title={loading ? 'Saving...' : 'Set Reminder'}
                onPress={handleSave}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelText: {
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
    paddingBottom: spacing['3xl'],
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: spacing.xs,
    ...shadows.xs,
  },
  calIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.md,
  },
});
