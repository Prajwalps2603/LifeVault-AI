/**
 * PaymentDetailModal — Bill & Payment inspection, settlement, and reminder manager.
 *
 * Implements Section 80 (Phase 5):
 * - Bill / Payment detail presentation
 * - Status progression (DUE -> PAID, with auto-expense logging prompt)
 * - Resetting payment status
 * - Scheduling calendar/reminder alerts
 * - Payment deletion
 */

import React, { useState } from 'react';
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
import { formatCurrency, formatDate } from '../../utils/helpers';
import type { Payment } from '../../types';
import { SetReminderTimingModal } from '../Vault/SetReminderTimingModal';

interface PaymentDetailModalProps {
  visible: boolean;
  payment: Payment | null;
  onClose: () => void;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  visible,
  payment,
  onClose,
}) => {
  const [reminderTimingOpen, setReminderTimingOpen] = useState(false);
  const { markPaymentPaid, updatePayment, deletePayment, addExpense, addReminder } = useAppStore();

  if (!payment) return null;

  const isPaid = payment.status === 'PAID';

  const handleMarkPaid = () => {
    Alert.alert(
      'Mark as Paid',
      `Record payment of ${formatCurrency(payment.amount)} for "${payment.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid & Add Expense',
          onPress: async () => {
            try {
              await markPaymentPaid(payment.id);
              // Auto-log corresponding expense
              await addExpense({
                type: 'EXPENSE',
                title: payment.title,
                amount: payment.amount,
                currency: payment.currency || '₹',
                date: new Date().toISOString().split('T')[0],
                category: 'BILLS',
                merchantName: payment.title,
                description: `Settled tracked bill on ${new Date().toLocaleDateString('en-IN')}`,
                userId: 'current-user',
                syncStatus: 'LOCAL_ONLY',
                version: 1,
              });
              Alert.alert('Bill Paid', `Recorded as paid and added to your expenses.`);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to update payment');
            }
          },
        },
        {
          text: 'Mark Paid Only',
          onPress: async () => {
            try {
              await markPaymentPaid(payment.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to update payment');
            }
          },
        },
      ],
    );
  };

  const handleResetToDue = async () => {
    Alert.alert(
      'Reset Status',
      'Change status back to Due / Upcoming?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Due',
          onPress: async () => {
            try {
              await updatePayment(payment.id, {
                status: 'DUE',
                paidDate: undefined,
              });
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to update status');
            }
          },
        },
      ],
    );
  };

  const handleSetReminder = async () => {
    try {
      await addReminder({
        type: 'REMINDER',
        title: `Bill Due: ${payment.title}`,
        dueDate: payment.dueDate,
        reminderDates: [payment.dueDate],
        time: '09:00',
        frequency: payment.isRecurring ? 'MONTHLY' : 'ONCE',
        isCompleted: false,
        description: `Pay ${formatCurrency(payment.amount)} for ${payment.title}`,
        relatedEntityId: payment.id,
        relatedEntityType: 'PAYMENT',
        userId: 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      Alert.alert('Reminder Set', `Alert scheduled for ${payment.dueDate} at 09:00 AM.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create reminder');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Payment',
      `Delete "${payment.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePayment(payment.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete payment');
            }
          },
        },
      ],
    );
  };

  const getStatusBadge = () => {
    switch (payment.status) {
      case 'PAID':
        return <LVBadge label="PAID & SETTLED" variant="success" />;
      case 'DUE':
        return <LVBadge label="DUE TODAY" variant="error" />;
      case 'OVERDUE':
        return <LVBadge label="OVERDUE" variant="error" />;
      default:
        return <LVBadge label="UPCOMING" variant="warning" />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bill Details</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Card */}
          <LVCard style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroLabel}>BILL AMOUNT</Text>
                <Text style={styles.heroAmount}>{formatCurrency(payment.amount)}</Text>
              </View>
              {getStatusBadge()}
            </View>
            <Text style={styles.heroTitle}>{payment.title}</Text>
            <Text style={styles.heroDate}>
              {isPaid
                ? `Paid on ${payment.paidDate ? formatDate(payment.paidDate) : 'Today'}`
                : `Due on ${formatDate(payment.dueDate)}`}
            </Text>
          </LVCard>

          {/* Details Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BILL SCHEDULE</Text>
            <LVCard style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{payment.category}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{payment.dueDate}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Recurrence</Text>
                <Text style={styles.infoValue}>
                  {payment.isRecurring
                    ? `Repeats every ${payment.recurringPeriodDays || 30} days`
                    : 'One-time bill'}
                </Text>
              </View>
              {payment.paidDate && (
                <>
                  <LVDivider style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Payment Date</Text>
                    <Text style={[styles.infoValue, { color: colors.success }]}>
                      {payment.paidDate.split('T')[0]}
                    </Text>
                  </View>
                </>
              )}
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sync Status</Text>
                <LVBadge
                  label={payment.syncStatus === 'SYNCED' ? 'Google Sheets' : 'Local Only'}
                  variant={payment.syncStatus === 'SYNCED' ? 'success' : 'neutral'}
                  small
                />
              </View>
            </LVCard>
          </View>

          {/* Actions */}
          <View style={styles.buttonStack}>
            {!isPaid ? (
              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={handleMarkPaid}
                activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <AnimatedIcon name="check" size={16} color={colors.white} />
                  <Text style={styles.payNowText}>Mark as Paid</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.unpayBtn}
                onPress={handleResetToDue}
                activeOpacity={0.8}>
                <Text style={styles.unpayText}>Reset to Unpaid</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.reminderBtn}
              onPress={() => setReminderTimingOpen(true)}
              activeOpacity={0.8}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AnimatedIcon name="calendar" size={16} active color={colors.primary} />
                <Text style={styles.reminderBtnText}>Set Due Date Reminder</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.8}>
              <Text style={styles.deleteBtnText}>Delete Bill</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <SetReminderTimingModal
        visible={reminderTimingOpen}
        reminderData={{
          title: `Bill Due: ${payment.title}`,
          dueDate: payment.dueDate,
          description: `Bill reminder for ${payment.title} (${payment.category}) due on ${payment.dueDate}. Amount: ${formatCurrency(payment.amount)}.`,
        }}
        onClose={() => setReminderTimingOpen(false)}
      />
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
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  heroDate: {
    fontSize: 13,
    color: colors.textSecondary,
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
  buttonStack: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  payNowBtn: {
    backgroundColor: colors.success,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  payNowText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  unpayBtn: {
    backgroundColor: '#FEF3C7',
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  unpayText: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '700',
  },
  reminderBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  reminderBtnText: {
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
