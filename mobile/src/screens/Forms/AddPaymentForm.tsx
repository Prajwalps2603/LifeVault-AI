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
import { AnimatedIcon, IconType } from '../../components/AnimatedIcon';
import type { PaymentStatus } from '../../types';

interface AddPaymentFormProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { label: string; value: string; icon: IconType }[] = [
  { label: 'Bills & Utilities', value: 'Bills', icon: 'bill' },
  { label: 'Subscriptions', value: 'Subscription', icon: 'lightning' },
  { label: 'EMI / Loans', value: 'EMI', icon: 'money' },
  { label: 'Rent', value: 'Rent', icon: 'folder' },
  { label: 'Credit Card', value: 'Credit Card', icon: 'cart' },
  { label: 'Insurance Premium', value: 'Insurance', icon: 'shield' },
  { label: 'Other', value: 'Other', icon: 'file' },
];

export const AddPaymentForm: React.FC<AddPaymentFormProps> = ({ visible, onClose }) => {
  const { addPayment } = useAppStore();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [category, setCategory] = useState('Bills');
  const [isRecurring, setIsRecurring] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('DUE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDueDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    });
    setCategory('Bills');
    setIsRecurring(false);
    setStatus('DUE');
    setNotes('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a payment title.');
      return;
    }

    const parsedAmount = parseFloat(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (!dueDate.trim()) {
      Alert.alert('Required', 'Please enter a due date (YYYY-MM-DD).');
      return;
    }

    try {
      setLoading(true);
      await addPayment({
        type: 'PAYMENT',
        title: title.trim(),
        amount: parsedAmount,
        currency: '₹',
        dueDate: dueDate.trim(),
        status,
        category,
        isRecurring,
        notes: notes.trim() || undefined,
        userId: 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      resetForm();
      onClose();
      Alert.alert('Success', 'Upcoming payment added.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save payment.');
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
            <Text style={styles.headerTitle}>Add Bill / Payment</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Amount */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>BILL AMOUNT</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>
            </View>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bill / Payment Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Electricity Bill, Home WiFi, Car EMI"
                placeholderTextColor={colors.textTertiary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Category selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipsContainer}>
                {CATEGORIES.map(item => {
                  const selected = category === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setCategory(item.value)}
                      activeOpacity={0.7}>
                      <AnimatedIcon
                        name={item.icon}
                        size={15}
                        color={selected ? colors.primary : colors.textSecondary}
                        active={selected}
                      />
                      <Text style={[styles.chipText, selected && styles.chipTextSelected, { marginLeft: 6 }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Due Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>

            {/* Status toggle */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.row}>
                {(['DUE', 'UPCOMING'] as PaymentStatus[]).map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusTab, status === st && styles.statusTabActive]}
                    onPress={() => setStatus(st)}>
                    <Text style={[styles.statusTabText, status === st && styles.statusTabTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recurring switch */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Recurring Payment</Text>
                <Text style={styles.switchSubtitle}>Repeats monthly or on schedule</Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: colors.border, true: colors.primaryMid }}
                thumbColor={isRecurring ? colors.primary : colors.surface}
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes / Account Number (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Consumer ID, portal login link, notes..."
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.actions}>
              <LVButton
                title={loading ? 'Saving...' : 'Save Payment'}
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
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    minWidth: 120,
    textAlign: 'center',
  },
  fieldGroup: {
    gap: spacing.xs,
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
    height: 70,
    textAlignVertical: 'top',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  chipEmoji: {
    fontSize: 14,
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusTab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  statusTabTextActive: {
    color: colors.white,
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
    borderColor: colors.border,
  },
  switchTitle: {
    fontSize: typography.fontSize.base,
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
