/**
 * ExtractionReviewModal — AI Extraction Confirmation & Review Workflow.
 *
 * Adheres strictly to:
 * - Section 20: AI EXTRACTION CONFIRMATION
 * - Rule 14: AI extraction must always be reviewable.
 * - Rule 15 & 50: User can edit or correct any detected field before persisting.
 */

import React, { useState, useEffect } from 'react';
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
import { LVButton, LVBadge, LVCard } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { GoogleDriveService } from '../../services/google/GoogleDriveService';
import type { DocumentAnalysisResult } from '../../services/ai/DocumentProcessingService';
import type { DocumentType, ExpenseCategory } from '../../types';

interface ExtractionReviewModalProps {
  visible: boolean;
  analysis: DocumentAnalysisResult | null;
  onClose: () => void;
  onSaved?: () => void;
}

export const ExtractionReviewModal: React.FC<ExtractionReviewModalProps> = ({
  visible,
  analysis,
  onClose,
  onSaved,
}) => {
  const { addDocument, addReceipt, addExpense, addReminder } = useAppStore();

  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('OTHER');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [merchantOrProvider, setMerchantOrProvider] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const [createExpense, setCreateExpense] = useState(false);
  const [createReminder, setCreateReminder] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (analysis) {
      setTitle(analysis.title || '');
      setDocType(analysis.detectedType || 'OTHER');
      setAmount(analysis.amount ? String(analysis.amount) : '');
      setDate(analysis.date || new Date().toISOString().split('T')[0]);
      setExpiryDate(analysis.expiryDate || '');
      setMerchantOrProvider(analysis.merchantOrProvider || '');
      setIdentifier(analysis.policyOrInvoiceNumber || '');
      setVehicleNumber(analysis.relatedVehicleNumber || '');

      setCreateExpense(Boolean(analysis.amount && (analysis.detectedType === 'RECEIPT' || analysis.detectedType === 'INVOICE')));
      setCreateReminder(Boolean(analysis.expiryDate));
    }
  }, [analysis]);

  if (!analysis) return null;

  const handleConfirmAndSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please provide a document title.');
      return;
    }

    setSaving(true);
    try {
      const parsedAmount = amount.trim() ? parseFloat(amount.trim()) : undefined;

      // 1. Upload file metadata to Google Drive (in background/drive service)
      const folderCategory =
        docType === 'RECEIPT' ? 'Receipts' :
        docType === 'INSURANCE' ? 'Documents' : 'Documents';

      const driveMeta = await GoogleDriveService.uploadFile({
        name: `${title.trim()}.pdf`,
        mimeType: 'application/pdf',
        folderType: folderCategory,
      });

      // 2. Save Document / Receipt in local store
      if (docType === 'RECEIPT') {
        await addReceipt({
          type: 'RECEIPT',
          merchantName: merchantOrProvider.trim() || title.trim(),
          amount: parsedAmount || 0,
          currency: '₹',
          date: date.trim() || new Date().toISOString().split('T')[0],
          category: (analysis.suggestedCategory as ExpenseCategory) || 'OTHER',
          driveFileId: driveMeta.id,
          notes: identifier.trim() ? `Ref: ${identifier.trim()}` : undefined,
          userId: 'current-user',
          syncStatus: 'PENDING_SYNC',
          version: 1,
        });
      } else {
        await addDocument({
          type: 'DOCUMENT',
          name: title.trim(),
          fileName: `${title.trim().toLowerCase().replace(/\s+/g, '_')}.pdf`,
          mimeType: 'application/pdf',
          documentType: docType,
          status: 'ORGANIZED',
          expiryDate: expiryDate.trim() || undefined,
          issueDate: date.trim() || undefined,
          driveFileId: driveMeta.id,
          driveUrl: driveMeta.webViewLink,
          notes: [
            merchantOrProvider.trim() ? `Issuer: ${merchantOrProvider.trim()}` : '',
            identifier.trim() ? `No: ${identifier.trim()}` : '',
            vehicleNumber.trim() ? `Vehicle: ${vehicleNumber.trim()}` : '',
          ].filter(Boolean).join(' • '),
          userId: 'current-user',
          syncStatus: 'PENDING_SYNC',
          version: 1,
        });
      }

      // 3. Auto-create Expense if toggled
      if (createExpense && parsedAmount && parsedAmount > 0) {
        await addExpense({
          type: 'EXPENSE',
          title: title.trim(),
          amount: parsedAmount,
          currency: '₹',
          date: date.trim() || new Date().toISOString().split('T')[0],
          category: (analysis.suggestedCategory as ExpenseCategory) || 'OTHER',
          merchantName: merchantOrProvider.trim() || undefined,
          userId: 'current-user',
          syncStatus: 'PENDING_SYNC',
          version: 1,
        });
      }

      // 4. Auto-create Expiry Reminder if toggled
      if (createReminder && expiryDate.trim()) {
        await addReminder({
          type: 'REMINDER',
          title: `Renewal: ${title.trim()}`,
          dueDate: expiryDate.trim(),
          reminderDates: [expiryDate.trim()],
          time: '09:00',
          frequency: 'ONCE',
          isCompleted: false,
          description: `Expiring policy/warranty for ${title.trim()}`,
          userId: 'current-user',
          syncStatus: 'PENDING_SYNC',
          version: 1,
        });
      }

      onClose();
      if (onSaved) onSaved();
      Alert.alert(
        'Verified & Saved',
        `"${title.trim()}" has been organized in your vault and uploaded to Google Drive.`,
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save extraction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Discard</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>AI Review</Text>
              <Text style={styles.headerSub}>Verify Extracted Info</Text>
            </View>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* AI Review Banner */}
            <View style={styles.aiBanner}>
              <AnimatedIcon name="sparkle" size={22} active color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aiBannerTitle}>AI Detected Fields</Text>
                <Text style={styles.aiBannerSub}>
                  Review the detected metadata below. You can edit any field before confirming.
                </Text>
              </View>
              <LVBadge
                label={analysis.confidence === 'HIGH' ? 'High Confidence' : 'Review Needed'}
                variant={analysis.confidence === 'HIGH' ? 'success' : 'warning'}
                small
              />
            </View>

            {/* Document Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Document Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Document Title"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Document Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Detected Type</Text>
              <View style={[styles.typeBadge, { flexDirection: 'row', alignItems: 'center' }]}>
                <AnimatedIcon name="file" size={14} color={colors.primary} />
                <Text style={[styles.typeBadgeText, { marginLeft: 5 }]}>{docType}</Text>
              </View>
            </View>

            {/* Merchant / Insurer / Provider */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Merchant / Insurer / Issuer</Text>
              <TextInput
                style={styles.input}
                value={merchantOrProvider}
                onChangeText={setMerchantOrProvider}
                placeholder="Not detected — optional"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Policy or Invoice Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Policy / Invoice / Reference #</Text>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Not detected — optional"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Amount & Date in Row */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Document Date</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            {/* Expiry Date (if detected) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Expiry / Validity Date</Text>
              <TextInput
                style={styles.input}
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="YYYY-MM-DD (or leave blank if no expiry)"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Vehicle Number (if detected) */}
            {vehicleNumber ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Linked Vehicle Plate</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                />
              </View>
            ) : null}

            {/* Automated Actions */}
            <View style={styles.sectionDivider} />

            {Boolean(amount) && (
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Auto-record as Expense</Text>
                  <Text style={styles.switchSub}>Adds ₹{amount} to your Money ledger</Text>
                </View>
                <Switch
                  value={createExpense}
                  onValueChange={setCreateExpense}
                  trackColor={{ false: colors.border, true: colors.primaryMid }}
                  thumbColor={createExpense ? colors.primary : colors.surface}
                />
              </View>
            )}

            {Boolean(expiryDate) && (
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Set Expiry Reminder</Text>
                  <Text style={styles.switchSub}>Alert me before {expiryDate}</Text>
                </View>
                <Switch
                  value={createReminder}
                  onValueChange={setCreateReminder}
                  trackColor={{ false: colors.border, true: colors.primaryMid }}
                  thumbColor={createReminder ? colors.primary : colors.surface}
                />
              </View>
            )}

            {/* Confirm Actions */}
            <View style={styles.actions}>
              <LVButton
                title={saving ? 'Saving & Syncing...' : 'Confirm & Save to Vault'}
                onPress={handleConfirmAndSave}
                loading={saving}
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
    color: colors.error,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  aiBannerEmoji: {
    fontSize: 22,
  },
  aiBannerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
  },
  aiBannerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
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
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
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
  switchSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.md,
  },
});
