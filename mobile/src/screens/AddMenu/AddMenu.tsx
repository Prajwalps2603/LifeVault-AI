import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, shadows } from '../../theme';
import { AnimatedIcon, type IconType } from '../../components/AnimatedIcon';

interface AddMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption?: (optionId: string) => void;
}

interface AddOption {
  id: string;
  icon: IconType;
  title: string;
  description: string;
  accentColor: string;
  phase?: string;
}

const ADD_OPTIONS: AddOption[] = [
  {
    id: 'document',
    icon: 'document',
    title: 'Add Document',
    description: 'Insurance, invoices, contracts & more',
    accentColor: colors.primary,
  },
  {
    id: 'expense',
    icon: 'money',
    title: 'Add Expense',
    description: 'Log money you\'ve already spent',
    accentColor: '#F59E0B',
  },
  {
    id: 'payment',
    icon: 'bill',
    title: 'Add Payment',
    description: 'Track upcoming bills and dues',
    accentColor: '#7C3AED',
  },
  {
    id: 'reminder',
    icon: 'reminder',
    title: 'Add Reminder',
    description: 'Set alerts for expiries and due dates',
    accentColor: '#0EA5E9',
  },
  {
    id: 'vehicle',
    icon: 'vehicle',
    title: 'Add Vehicle',
    description: 'Track insurance, PUC, service & fuel',
    accentColor: '#8B5CF6',
  },
  {
    id: 'asset',
    icon: 'asset',
    title: 'Add Asset',
    description: 'Laptop, phone, appliances & more',
    accentColor: '#06B6D4',
  },
  {
    id: 'receipt',
    icon: 'receipt',
    title: 'Scan Receipt',
    description: 'Capture and auto-extract receipt details',
    accentColor: colors.success,
  },
  {
    id: 'manual',
    icon: 'document',
    title: 'Manual Record',
    description: 'Add custom document record',
    accentColor: colors.textSecondary,
  },
];

export const AddMenu: React.FC<AddMenuProps> = ({ visible, onClose, onSelectOption }) => {
  const handleOption = (option: AddOption) => {
    onClose();
    if (onSelectOption) {
      setTimeout(() => {
        onSelectOption(option.id === 'manual' ? 'document' : option.id);
      }, 200);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Add to LifeVault</Text>
              <Text style={styles.headerSub}>What would you like to add?</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Options */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.optionsList}>
            {ADD_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionRow}
                onPress={() => handleOption(option)}
                activeOpacity={0.8}>
                <View style={[styles.optionIcon, { backgroundColor: `${option.accentColor}18` }]}>
                  <AnimatedIcon name={option.icon} size={22} active color={option.accentColor} />
                </View>
                <View style={styles.optionInfo}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    {option.phase && (
                      <View style={styles.phaseBadge}>
                        <Text style={styles.phaseBadgeText}>{option.phase}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
                <Text style={styles.optionArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <SafeAreaView edges={['bottom']} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    paddingTop: spacing.md,
    maxHeight: '85%',
    ...shadows['2xl'],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  optionsList: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.background,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionEmoji: { fontSize: 26 },
  optionInfo: { flex: 1 },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionArrow: {
    fontSize: 22,
    color: colors.textTertiary,
    flexShrink: 0,
  },
  phaseBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.badge,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  phaseBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
});
