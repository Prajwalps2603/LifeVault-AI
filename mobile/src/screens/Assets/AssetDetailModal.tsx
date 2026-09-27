/**
 * AssetDetailModal — Detailed asset inspection, warranty tracking & connected invoices.
 *
 * Implements Section 82 (Phase 7):
 * - Asset specifications (Brand, model, serial number, price)
 * - Warranty countdown & validity tracking
 * - Related documents (Invoices, warranty certificates, manuals)
 * - Automatic warranty renewal/expiry reminder creation
 * - Asset deletion
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
import { LVButton, LVBadge, LVCard, LVDivider, LVSectionHeader } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import type { Asset, Document } from '../../types';
import { DocumentDetailModal } from '../Vault/DocumentDetailModal';
import { SetReminderTimingModal } from '../Vault/SetReminderTimingModal';

interface AssetDetailModalProps {
  visible: boolean;
  asset: Asset | null;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  visible,
  asset,
  onClose,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [reminderTimingOpen, setReminderTimingOpen] = useState(false);
  const { state, deleteAsset, addReminder } = useAppStore();
  const { documents } = state;

  if (!asset) return null;

  // Find related documents
  const assetDocs = documents.filter(
    d => d.relatedEntityId === asset.id ||
      d.name.toLowerCase().includes(asset.name.toLowerCase()) ||
      (asset.brand && d.name.toLowerCase().includes(asset.brand.toLowerCase())),
  );

  // Warranty calculation
  const hasWarranty = Boolean(asset.warrantyExpiryDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let daysLeft: number | null = null;
  let isExpired = false;

  if (asset.warrantyExpiryDate) {
    const exp = new Date(asset.warrantyExpiryDate);
    exp.setHours(0, 0, 0, 0);
    daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400_000);
    isExpired = daysLeft < 0;
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Asset',
      `Delete "${asset.name}" from your vault?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAsset(asset.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete asset');
            }
          },
        },
      ],
    );
  };

  const handleSetWarrantyReminder = async () => {
    if (!asset.warrantyExpiryDate) {
      Alert.alert('No Warranty Date', 'This asset has no recorded warranty expiry date.');
      return;
    }

    try {
      await addReminder({
        type: 'REMINDER',
        title: `Warranty Expiry: ${asset.name}`,
        dueDate: asset.warrantyExpiryDate,
        reminderDates: [asset.warrantyExpiryDate],
        time: '09:00',
        frequency: 'ONCE',
        isCompleted: false,
        description: `Warranty expiring for ${asset.name} (${asset.brand || 'Asset'}). Check for repairs or extensions.`,
        relatedEntityId: asset.id,
        relatedEntityType: 'ASSET',
        userId: 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      Alert.alert('Reminder Set', `Alert scheduled for ${asset.warrantyExpiryDate} at 09:00 AM.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to set reminder');
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
          <Text style={styles.headerTitle}>Asset Details</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Card */}
          <LVCard style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.assetIcon}>
                <AnimatedIcon name="asset" size={26} active color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{asset.name}</Text>
                <Text style={styles.heroBrand}>
                  {asset.brand || 'Asset'} {asset.model ? `• ${asset.model}` : ''}
                </Text>
                <Text style={styles.heroPrice}>
                  {asset.purchasePrice ? formatCurrency(asset.purchasePrice) : 'Price not recorded'}
                </Text>
              </View>
            </View>

            {/* Warranty Badge Banner */}
            {hasWarranty && (
              <View style={[
                styles.warrantyBanner,
                isExpired ? styles.warrantyBannerExpired : styles.warrantyBannerActive,
              ]}>
                <AnimatedIcon name="shield" size={18} active color={isExpired ? colors.error : colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warrantyTitle}>
                    {isExpired ? 'Warranty Expired' : 'Warranty Active'}
                  </Text>
                  <Text style={styles.warrantySub}>
                    {isExpired
                      ? `Expired on ${asset.warrantyExpiryDate}`
                      : `${daysLeft} days remaining (Expires ${asset.warrantyExpiryDate})`}
                  </Text>
                </View>
              </View>
            )}
          </LVCard>

          {/* Asset Specs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ASSET SPECIFICATIONS</Text>
            <LVCard style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{asset.category}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Brand</Text>
                <Text style={styles.infoValue}>{asset.brand || '—'}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Model</Text>
                <Text style={styles.infoValue}>{asset.model || '—'}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Purchase Date</Text>
                <Text style={styles.infoValue}>{asset.purchaseDate || '—'}</Text>
              </View>
              <LVDivider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Serial Number</Text>
                <Text style={styles.infoValue}>{asset.serialNumber || '—'}</Text>
              </View>
            </LVCard>
          </View>

          {/* Related Documents */}
          <View style={styles.section}>
            <LVSectionHeader title={`Connected Documents (${assetDocs.length})`} />
            {assetDocs.map(doc => (
              <TouchableOpacity
                key={doc.id}
                activeOpacity={0.8}
                onPress={() => setSelectedDoc(doc)}>
                <LVCard style={styles.docItemCard}>
                  <View style={styles.docItemRow}>
                    <View style={styles.docItemIcon}>
                      <AnimatedIcon name="document" size={16} active color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docItemTitle}>{doc.name}</Text>
                      <Text style={styles.docItemSub}>
                        {doc.documentType} {doc.expiryDate ? `• Exp: ${doc.expiryDate}` : ''}
                      </Text>
                    </View>
                    <LVBadge label="View" variant="primary" small />
                  </View>
                </LVCard>
              </TouchableOpacity>
            ))}

            {assetDocs.length === 0 && (
              <LVCard style={{ padding: spacing.md, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  No invoices or warranty cards linked yet.
                </Text>
              </LVCard>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsStack}>
            {hasWarranty && !isExpired && (
              <TouchableOpacity
                style={styles.reminderBtn}
                onPress={() => setReminderTimingOpen(true)}
                activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <AnimatedIcon name="calendar" size={16} active color={colors.white} />
                  <Text style={styles.reminderBtnText}>Set Warranty Expiry Alert</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.8}>
              <Text style={styles.deleteBtnText}>Delete Asset</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <DocumentDetailModal
        visible={Boolean(selectedDoc)}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      <SetReminderTimingModal
        visible={reminderTimingOpen}
        reminderData={{
          title: `Warranty Expiry: ${asset.name}`,
          dueDate: asset.warrantyExpiryDate || '',
          description: `Warranty expiring for ${asset.name} (${asset.brand || 'Asset'}). Check for repairs or extensions.`,
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
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  assetIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  heroBrand: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  warrantyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.card,
  },
  warrantyBannerActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  warrantyBannerExpired: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warrantyEmoji: {
    fontSize: 20,
  },
  warrantyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  warrantySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  docItemCard: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  docItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  docItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  docItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsStack: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  reminderBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  reminderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
