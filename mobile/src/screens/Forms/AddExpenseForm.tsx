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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { useAppStore } from '../../store/AppContext';
import { LVButton } from '../../components/LVButton';
import { AnimatedIcon, type IconType } from '../../components/AnimatedIcon';
import type { ExpenseCategory } from '../../types';
import { SAMPLE_PRESETS } from '../../services/ai/DocumentProcessingService';

interface AddExpenseFormProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { label: string; value: ExpenseCategory; icon: IconType }[] = [
  { label: 'Food & Dining', value: 'FOOD', icon: 'cart' },
  { label: 'Groceries', value: 'GROCERIES', icon: 'cart' },
  { label: 'Petrol & Fuel', value: 'PETROL', icon: 'fuel' },
  { label: 'Shopping', value: 'SHOPPING', icon: 'money' },
  { label: 'Bills & Utilities', value: 'BILLS', icon: 'bill' },
  { label: 'Transport', value: 'TRANSPORT', icon: 'vehicle' },
  { label: 'Medical & Health', value: 'MEDICAL', icon: 'shield' },
  { label: 'Entertainment', value: 'ENTERTAINMENT', icon: 'sparkle' },
  { label: 'Service', value: 'SERVICE', icon: 'wrench' },
  { label: 'Other', value: 'OTHER', icon: 'document' },
];

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ visible, onClose }) => {
  const { addExpense } = useAppStore();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('FOOD');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [merchantName, setMerchantName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('FOOD');
    setDate(new Date().toISOString().split('T')[0]);
    setMerchantName('');
    setDescription('');
  };

  const applyPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const { presetData } = preset;
    setTitle(presetData.title);
    if (presetData.amount) setAmount(String(presetData.amount));
    if (presetData.suggestedCategory) setCategory(presetData.suggestedCategory);
    if (presetData.merchantOrProvider) setMerchantName(presetData.merchantOrProvider);
    if (presetData.date) setDate(presetData.date);
    setDescription(`Imported from ${preset.title}`);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an expense title.');
      return;
    }

    const parsedAmount = parseFloat(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      await addExpense({
        type: 'EXPENSE',
        title: title.trim(),
        amount: parsedAmount,
        currency: '₹',
        date: date.trim() || new Date().toISOString().split('T')[0],
        category,
        merchantName: merchantName.trim() || undefined,
        description: description.trim() || undefined,
        userId: 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      resetForm();
      onClose();
      Alert.alert('Success', 'Expense recorded successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save expense.');
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
            <Text style={styles.headerTitle}>Add Expense</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Quick AI Fill Banner */}
            <View style={styles.aiBanner}>
              <View style={styles.aiBannerHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AnimatedIcon name="lightning" size={16} color={colors.warning} active />
                  <Text style={[styles.aiBannerTitle, { marginLeft: 6 }]}>AI Receipt Presets</Text>
                </View>
                <Text style={styles.aiBannerDesc}>Simulate camera OCR & auto-populate</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiPresetsScroll}>
                <TouchableOpacity
                  style={styles.aiPresetChip}
                  onPress={() => applyPreset('supermarket')}
                  activeOpacity={0.7}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AnimatedIcon name="cart" size={13} color={colors.primary} />
                    <Text style={[styles.aiPresetText, { marginLeft: 5 }]}>Groceries (₹1,850)</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aiPresetChip}
                  onPress={() => applyPreset('petrol')}
                  activeOpacity={0.7}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AnimatedIcon name="fuel" size={13} color={colors.primary} />
                    <Text style={[styles.aiPresetText, { marginLeft: 5 }]}>Fuel Refill (₹2,500)</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aiPresetChip}
                  onPress={() => applyPreset('insurance')}
                  activeOpacity={0.7}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AnimatedIcon name="shield" size={13} color={colors.primary} />
                    <Text style={[styles.aiPresetText, { marginLeft: 5 }]}>Insurance (₹14,250)</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Amount (Big hero input) */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>AMOUNT SPENT</Text>
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
              <Text style={styles.label}>Title / What was it for? *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Swiggy Lunch, Supermarket"
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

            {/* Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                value={date}
                onChangeText={setDate}
              />
            </View>

            {/* Merchant */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Merchant / Store (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Nature's Basket, HP Petrol Pump"
                placeholderTextColor={colors.textTertiary}
                value={merchantName}
                onChangeText={setMerchantName}
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any extra details..."
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.actions}>
              <LVButton
                title={loading ? 'Saving...' : 'Save Expense'}
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
  actions: {
    marginTop: spacing.md,
  },
  aiBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: spacing.sm,
  },
  aiBannerHeader: {
    gap: 2,
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  aiBannerDesc: {
    fontSize: 11,
    color: '#3B82F6',
  },
  aiPresetsScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  aiPresetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  aiPresetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
});
