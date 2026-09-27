/**
 * ExpenseDetailModal — Detailed view and receipt linking for individual expenses.
 *
 * Implements Section 80 (Phase 5):
 * - Expense transaction breakdown
 * - Receipt linking & inspection
 * - Category & merchant details
 * - Google Drive receipt preview action
 * - Safe deletion with store update
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { LVButton, LVBadge, LVCard, LVDivider } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import type { Expense, Receipt } from '../../types';

interface ExpenseDetailModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#F59E0B',
  GROCERIES: '#10B981',
  PETROL: '#EF4444',
  SHOPPING: '#8B5CF6',
  BILLS: '#3B82F6',
  TRANSPORT: '#6366F1',
  MEDICAL: '#EC4899',
  ENTERTAINMENT: '#F97316',
  SERVICE: '#14B8A6',
  OTHER: '#6B7280',
};

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  visible,
  expense,
  onClose,
}) => {
  const { state, deleteExpense, updateExpense } = useAppStore();
  const [showAttachPicker, setShowAttachPicker] = useState(false);

  if (!expense) return null;

  const linkedReceipt = state.receipts.find(r => r.id === expense.receiptId);
  const unlinkedReceipts = state.receipts.filter(r => !r.expenseId && r.id !== expense.receiptId);

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expense.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete expense');
            }
          },
        },
      ],
    );
  };

  const handleOpenDriveReceipt = (receipt: Receipt) => {
    const url = receipt.driveFileId
      ? `https://drive.google.com/file/d/${receipt.driveFileId}/view`
      : null;

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Google Drive Link', `File ID: ${receipt.driveFileId}`);
      });
    } else {
      Alert.alert(
        'Receipt in Drive',
        `Receipt is stored in your Google Drive under /LifeVault/Receipts/.\nFile ID: ${receipt.driveFileId || 'pending_sync'}`,
      );
    }
  };

  const handleAttachReceipt = async (receiptId: string) => {
    try {
      await updateExpense(expense.id, { receiptId });
      setShowAttachPicker(false);
      Alert.alert('Success', 'Receipt successfully linked to this expense.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to attach receipt');
    }
  };

  const handleDetachReceipt = async () => {
    Alert.alert(
      'Detach Receipt',
      'Remove receipt link from this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Detach',
          style: 'destructive',
          onPress: async () => {
            await updateExpense(expense.id, { receiptId: undefined });
          },
        },
      ],
    );
  };

  const catColor = CATEGORY_COLORS[expense.category] || colors.primary;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expense Details</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Hero Card */}
          <LVCard style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.heroAmount}>{formatCurrency(expense.amount)}</Text>
              </View>
              <View style={[styles.catBadgeWrap, { backgroundColor: `${catColor}20`, borderColor: catColor }]}>
                <Text style={[styles.catBadgeText, { color: catColor }]}>
                  {expense.category}
                </Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>{expense.title}</Text>
            <Text style={styles.heroDate}>{formatDate(expense.date)}</Text>
          </LVCard>

          {/* Details Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TRANSACTION DETAILS</Text>
            <LVCard style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Merchant / Store</Text>
                <Text style={styles.infoValue}>{expense.merchantName || '—'}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{expense.category}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{expense.date}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cloud Storage</Text>
                <LVBadge
                  label={expense.syncStatus === 'SYNCED' ? 'Google Sheets' : 'Local Device'}
                  variant={expense.syncStatus === 'SYNCED' ? 'success' : 'neutral'}
                  small
                />
              </View>
              {expense.description ? (
                <>
                  <LVDivider style={styles.divider} />
                  <View style={styles.notesBlock}>
                    <Text style={styles.infoLabel}>Notes & Description</Text>
                    <Text style={styles.notesValue}>{expense.description}</Text>
                  </View>
                </>
              ) : null}
            </LVCard>
          </View>

          {/* Receipt Linking Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LINKED RECEIPT</Text>
            {linkedReceipt ? (
              <LVCard style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptIcon}>
                    <AnimatedIcon name="receipt" size={20} active color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptMerchant}>{linkedReceipt.merchantName}</Text>
                    <Text style={styles.receiptDate}>{formatDate(linkedReceipt.date)}</Text>
                  </View>
                  <Text style={styles.receiptAmount}>
                    ₹{linkedReceipt.amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                {linkedReceipt.items && linkedReceipt.items.length > 0 && (
                  <View style={styles.receiptItemsList}>
                    <Text style={styles.itemsHeader}>Itemized Breakdown:</Text>
                    {linkedReceipt.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>₹{item.totalPrice.toLocaleString('en-IN')}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.receiptActions}>
                  <TouchableOpacity
                    style={styles.driveBtn}
                    onPress={() => handleOpenDriveReceipt(linkedReceipt)}
                    activeOpacity={0.8}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <AnimatedIcon name="folder" size={16} active color={colors.primary} />
                      <Text style={styles.driveBtnText}>View on Google Drive</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detachBtn}
                    onPress={handleDetachReceipt}
                    activeOpacity={0.8}>
                    <Text style={styles.detachBtnText}>Detach</Text>
                  </TouchableOpacity>
                </View>
              </LVCard>
            ) : (
              <LVCard style={styles.emptyReceiptCard}>
                <AnimatedIcon name="receipt" size={28} active color={colors.primary} />
                <Text style={styles.emptyReceiptTitle}>No Receipt Attached</Text>
                <Text style={styles.emptyReceiptSub}>
                  Link a scanned bill or receipt to prove purchase and record tax invoices.
                </Text>
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={() => setShowAttachPicker(true)}
                  activeOpacity={0.8}>
                  <Text style={styles.attachBtnText}>+ Attach from Vault Receipts</Text>
                </TouchableOpacity>
              </LVCard>
            )}

            {/* Unlinked Receipts Picker Modal */}
            {showAttachPicker && (
              <View style={styles.pickerBox}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Receipt from Vault</Text>
                  <TouchableOpacity onPress={() => setShowAttachPicker(false)}>
                    <Text style={styles.pickerClose}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                {unlinkedReceipts.length === 0 ? (
                  <Text style={styles.noUnlinkedText}>
                    No unlinked receipts available. Use the camera scanner to scan a new receipt!
                  </Text>
                ) : (
                  unlinkedReceipts.map(rc => (
                    <TouchableOpacity
                      key={rc.id}
                      style={styles.pickerItem}
                      onPress={() => handleAttachReceipt(rc.id)}
                      activeOpacity={0.7}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerItemMerchant}>{rc.merchantName}</Text>
                        <Text style={styles.pickerItemDate}>{rc.date} • {rc.category}</Text>
                      </View>
                      <Text style={styles.pickerItemAmount}>
                        ₹{rc.amount.toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <Text style={styles.deleteBtnText}>Delete Expense</Text>
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
  catBadgeWrap: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
  notesBlock: {
    gap: 4,
    paddingTop: spacing.xs,
  },
  notesValue: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  receiptCard: {
    padding: spacing.md,
    borderColor: '#A7F3D0',
    borderWidth: 1,
    backgroundColor: '#F0FDF4',
    gap: spacing.sm,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  receiptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptMerchant: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
  },
  receiptDate: {
    fontSize: 12,
    color: '#047857',
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  receiptItemsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  itemsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  receiptActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  driveBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: radii.button,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
  },
  driveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detachBtn: {
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detachBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyReceiptCard: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyReceiptIcon: {
    fontSize: 28,
  },
  emptyReceiptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyReceiptSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  attachBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.button,
  },
  attachBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  pickerBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pickerClose: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  noUnlinkedText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemMerchant: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickerItemDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  pickerItemAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionButtons: {
    marginTop: spacing.md,
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
