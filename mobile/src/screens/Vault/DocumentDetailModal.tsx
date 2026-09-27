/**
 * DocumentDetailModal — Complete details view for vault documents.
 *
 * Implements Section 18 & 19:
 * Displays document metadata, policy details, validity/expiry countdown,
 * linked Google Drive file link, and quick actions (Set Reminder Timing Popup, Share, Delete).
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
import { SetReminderTimingModal } from './SetReminderTimingModal';
import { useAppStore } from '../../store/AppContext';
import { documentTypeLabel } from '../../utils/helpers';
import type { Document } from '../../types';

interface DocumentDetailModalProps {
  visible: boolean;
  document: Document | null;
  onClose: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  visible,
  document,
  onClose,
}) => {
  const { deleteDocument } = useAppStore();
  const [showTimingModal, setShowTimingModal] = useState<boolean>(false);

  if (!document) return null;

  const handleOpenDrive = () => {
    const url = document.driveUrl || (document.driveFileId ? `https://drive.google.com/file/d/${document.driveFileId}/view` : null);
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Google Drive Link', `File ID: ${document.driveFileId}\nURL: ${url}`);
      });
    } else {
      Alert.alert('Drive File', `Document is stored in your Google Drive under /LifeVault/Documents/.\nFile ID: ${document.driveFileId || 'local_file_pending_sync'}`);
    }
  };

  const handleOpenReminderTiming = () => {
    if (!document.expiryDate) {
      Alert.alert('No Expiry Date', 'This document does not have an expiry date set.');
      return;
    }
    setShowTimingModal(true);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to remove "${document.name}" from your vault?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDocument(document.id);
            onClose();
          },
        },
      ],
    );
  };

  const handleShare = () => {
    Alert.alert('Share Document', `Sharing details for "${document.name}"`);
  };

  const isExpired = document.expiryDate ? new Date(document.expiryDate) < new Date() : false;

  const getDocIconName = () => {
    switch (document.documentType) {
      case 'INSURANCE':
        return 'shield';
      case 'INVOICE':
        return 'receipt';
      case 'PUC':
        return 'vehicle';
      default:
        return 'document';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Details</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Hero Card */}
          <LVCard style={styles.heroCard}>
            <View style={styles.iconCircle}>
              <AnimatedIcon name={getDocIconName()} size={36} active color={colors.primary} />
            </View>
            <Text style={styles.docTitle}>{document.name}</Text>
            <View style={styles.badgeRow}>
              <LVBadge
                label={documentTypeLabel(document.documentType)}
                variant="primary"
              />
              <LVBadge
                label={isExpired ? 'Expired' : 'Verified in Vault'}
                variant={isExpired ? 'error' : 'success'}
              />
            </View>
          </LVCard>

          {/* Details Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>METADATA & DETAILS</Text>
            <LVCard noPadding>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Document Type</Text>
                <Text style={styles.detailValue}>{documentTypeLabel(document.documentType)}</Text>
              </View>
              <LVDivider />

              {document.issueDate && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Issue / Start Date</Text>
                    <Text style={styles.detailValue}>{document.issueDate}</Text>
                  </View>
                  <LVDivider />
                </>
              )}

              {document.expiryDate && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expiry Date</Text>
                    <Text style={[styles.detailValue, isExpired && { color: colors.error }]}>
                      {document.expiryDate} {isExpired ? '(Expired)' : ''}
                    </Text>
                  </View>
                  <LVDivider />
                </>
              )}

              {document.notes && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Policy / Reference #</Text>
                    <Text style={styles.detailValue}>{document.notes}</Text>
                  </View>
                  <LVDivider />
                </>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cloud Status</Text>
                <LVBadge
                  label={document.syncStatus === 'SYNCED' ? 'Synced with Drive' : 'Local Vault'}
                  variant={document.syncStatus === 'SYNCED' ? 'success' : 'neutral'}
                  small
                />
              </View>
            </LVCard>
          </View>

          {/* Google Drive Action */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.driveButton} onPress={handleOpenDrive} activeOpacity={0.8}>
              <View style={styles.driveIconWrap}>
                <AnimatedIcon name="folder" size={22} active color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driveTitle}>Google Drive Location</Text>
                <Text style={styles.driveSubtitle}>
                  {document.driveFileId ? `ID: ${document.driveFileId.substring(0, 24)}...` : 'Stored in /LifeVault/Documents/'}
                </Text>
              </View>
              <Text style={styles.driveArrow}>↗</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.actions}>
            {document.expiryDate && (
              <TouchableOpacity
                style={styles.reminderBtn}
                onPress={handleOpenReminderTiming}
                activeOpacity={0.8}>
                <AnimatedIcon name="calendar" size={18} active color={colors.primary} />
                <Text style={styles.reminderBtnText}>Set Expiry Reminder & Calendar</Text>
              </TouchableOpacity>
            )}
            <LVButton
              title="Delete Document"
              onPress={handleDelete}
              variant="danger"
              fullWidth
              size="md"
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Interactive Timing & Phone Calendar Modal */}
      <SetReminderTimingModal
        visible={showTimingModal}
        document={document}
        onClose={() => setShowTimingModal(false)}
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shareBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  shareText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.screenPadding,
    gap: spacing.lg,
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    paddingLeft: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  driveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.card,
  },
  driveIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driveTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  driveSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  driveArrow: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  reminderBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
