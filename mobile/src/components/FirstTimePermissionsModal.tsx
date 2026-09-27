/**
 * FirstTimePermissionsModal — Permission Request Sheet on First Launch / Login.
 *
 * Explicitly prompts for:
 * 1. Google Drive & Sheets Cloud Storage Consent (Rule 6 & Rule 8/9).
 * 2. Android Notification Permission (POST_NOTIFICATIONS for bills & expiries).
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  PermissionsAndroid,
  Image,
} from 'react-native';
import { colors, spacing, radii, shadows } from '../theme';
import { LVButton } from './LVButton';
import { AnimatedIcon } from './AnimatedIcon';
import { StorageService } from '../services/storage/StorageService';

interface FirstTimePermissionsModalProps {
  visible: boolean;
  onComplete: (preferences: { cloudSync: boolean; notifications: boolean }) => void;
}

export const FirstTimePermissionsModal: React.FC<FirstTimePermissionsModalProps> = ({
  visible,
  onComplete,
}) => {
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleGrantAndContinue = async () => {
    setIsRequesting(true);
    try {
      // 1. Android Notification Permission Request (Android 13+ / API 33+)
      if (notificationsEnabled && Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'LifeVault Notifications',
              message: 'Get timely alerts before bills, warranties, and vehicle registrations expire.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }
          );
        } catch (e) {
          console.warn('Notification permission error:', e);
        }
      }

      // Mark permission modal as completed
      await StorageService.setFlag('permissions_prompt_completed', true);
      await StorageService.set('lv:consent:cloud_storage', cloudSyncEnabled);
      await StorageService.set('lv:consent:notifications', notificationsEnabled);

      onComplete({
        cloudSync: cloudSyncEnabled,
        notifications: notificationsEnabled,
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon */}
          <View style={styles.headerIconContainer}>
            <View style={styles.iconCircle}>
              <AnimatedIcon name="lock" size={32} color={colors.primary} active />
            </View>
          </View>

          <Text style={styles.title}>Welcome to LifeVault AI</Text>
          <Text style={styles.subtitle}>
            Please review and grant permissions to configure your personal vault storage and smart reminders.
          </Text>

          {/* Permission 1: Google Drive & Sheets */}
          <View style={styles.permissionItem}>
            <View style={styles.itemIcon}>
              <AnimatedIcon name="cloud" size={24} color={colors.primary} active />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Google Drive & Sheets Storage</Text>
              <Text style={styles.itemDesc}>
                Store uploaded documents in "/LifeVault AI" and sync vault data to "LifeVault AI - Data Records".
              </Text>
            </View>
            <Switch
              value={cloudSyncEnabled}
              onValueChange={setCloudSyncEnabled}
              trackColor={{ false: colors.borderLight, true: colors.primaryMid }}
              thumbColor={cloudSyncEnabled ? colors.primary : colors.textTertiary}
            />
          </View>

          {/* Permission 2: Notifications */}
          <View style={styles.permissionItem}>
            <View style={styles.itemIcon}>
              <AnimatedIcon name="reminder" size={24} color={colors.secondary} active />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Smart Expiry Notifications</Text>
              <Text style={styles.itemDesc}>
                Receive alerts 30, 7, and 1 day before bills, warranty, insurance, and tasks are due.
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.borderLight, true: colors.secondaryMid }}
              thumbColor={notificationsEnabled ? colors.secondary : colors.textTertiary}
            />
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <AnimatedIcon name="shield" size={16} color={colors.secondary} active />
              <Text style={[styles.privacyText, { fontWeight: '700', marginLeft: 6, color: colors.secondary }]}>
                Your Privacy First
              </Text>
            </View>
            <Text style={styles.privacyText}>
              LifeVault operates offline-first. Your files are only stored on your phone and your private Google account.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <LVButton
              title={isRequesting ? 'Configuring Vault...' : 'Confirm & Continue'}
              variant="primary"
              onPress={handleGrantAndContinue}
              disabled={isRequesting}
            />
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => handleGrantAndContinue()}
              disabled={isRequesting}>
              <Text style={styles.skipText}>Continue with Local Vault Only</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryMid,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 15,
  },
  privacyBox: {
    backgroundColor: colors.successLight,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyText: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
  buttonContainer: {
    gap: spacing.sm,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
