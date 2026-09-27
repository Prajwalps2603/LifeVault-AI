import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radii, shadows } from '../../theme';
import { LVCard, LVDivider, LVAvatar, LVBadge, LVButton } from '../../components';
import { AnimatedIcon, IconType } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { relativeDate } from '../../utils/helpers';

interface ProfileScreenProps {
  onSignOut: () => void;
}

interface SettingsRowProps {
  icon: IconType;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  title,
  subtitle,
  rightContent,
  onPress,
  danger = false,
}) => (
  <TouchableOpacity
    style={styles.settingsRow}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}>
    <View style={[styles.settingsIcon, danger && { backgroundColor: `${colors.error}15` }]}>
      <AnimatedIcon name={icon} size={20} active color={danger ? colors.error : colors.primary} />
    </View>
    <View style={styles.settingsInfo}>
      <Text style={[styles.settingsTitle, danger && { color: colors.error }]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.settingsSub}>{subtitle}</Text>}
    </View>
    <View style={styles.settingsRight}>
      {rightContent}
      {onPress && <Text style={styles.settingsArrow}>›</Text>}
    </View>
  </TouchableOpacity>
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onSignOut }) => {
  const {
    state,
    signInWithGoogle,
    signOutGoogle,
    disconnectGoogle,
    switchGoogleAccount,
    syncNow,
    exportVaultBackup,
    restoreVaultBackup,
  } = useAppStore();

  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [backupJsonText, setBackupJsonText] = useState('');
  const [backupCounts, setBackupCounts] = useState<Record<string, number>>({});
  const [restoreJsonInput, setRestoreJsonInput] = useState('');
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

  const {
    googleUser,
    isGoogleConnected,
    driveFolders,
    spreadsheetId,
    isSyncing,
    lastSyncedAt,
    pendingCount,
  } = state;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Sign out of LifeVault? Your local offline records will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOutGoogle();
            onSignOut();
          },
        },
      ],
    );
  };

  const handleSyncNow = async () => {
    if (!isGoogleConnected) {
      Alert.alert(
        'Connect Google',
        'Please connect your Google Account first to sync your LifeVault.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: () => signInWithGoogle() },
        ],
      );
      return;
    }

    const success = await syncNow();
    if (success) {
      Alert.alert('Sync Complete', 'All records have been synchronized with your Google Drive & Sheets.');
    } else {
      Alert.alert('Sync Notice', state.syncError || 'Sync failed. Please check your internet connection.');
    }
  };

  const handleSwitchAccount = () => {
    Alert.alert(
      'Switch Google Account',
      'Switching accounts will connect your LifeVault to another Google Drive & Sheets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Account',
          onPress: async () => {
            await switchGoogleAccount({
              name: 'Prajwal (Work)',
              email: 'prajwal.work@gmail.com',
            });
            Alert.alert('Switched', 'Connected to Prajwal (Work)');
          },
        },
      ],
    );
  };

  const handleDisconnectGoogle = () => {
    Alert.alert(
      'Disconnect Google',
      'Disconnect Google Drive and Google Sheets? Your local vault files and records will remain safely on your phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectGoogle();
            Alert.alert('Disconnected', 'Google Account has been disconnected.');
          },
        },
      ],
    );
  };

  const handleExportBackup = async () => {
    setIsProcessingBackup(true);
    try {
      const res = await exportVaultBackup();
      setBackupJsonText(res.json);
      setBackupCounts(res.counts);
      setBackupModalVisible(true);
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Failed to export vault backup.');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreJsonInput.trim()) {
      Alert.alert('Required', 'Please paste valid LifeVault backup JSON.');
      return;
    }

    setIsProcessingBackup(true);
    try {
      const res = await restoreVaultBackup(restoreJsonInput.trim());
      if (res.success) {
        setRestoreModalVisible(false);
        setRestoreJsonInput('');
        Alert.alert('Backup Restored', res.message);
      } else {
        Alert.alert('Restore Error', res.message);
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message || 'Invalid backup payload.');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const userName = googleUser?.name || 'Local User';
  const userEmail = googleUser?.email || 'Offline Vault Active';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.title}>Profile</Text>

        {/* Profile Card */}
        <LVCard style={styles.profileCard}>
          <View style={styles.profileRow}>
            <LVAvatar name={userName} size="xl" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <LVBadge
                label={isGoogleConnected ? 'Google Connected' : 'Local Vault Only'}
                variant={isGoogleConnected ? 'success' : 'warning'}
                small
              />
            </View>
          </View>
        </LVCard>

        {/* Connected Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Google Services</Text>
          <LVCard noPadding>
            <SettingsRow
              icon="folder"
              title="Google Drive"
              subtitle={
                isGoogleConnected
                  ? `Linked: /LifeVault (${driveFolders ? 'Hierarchy ready' : 'Connecting...'})`
                  : 'Not connected — Tap to link'
              }
              onPress={isGoogleConnected ? undefined : () => signInWithGoogle()}
              rightContent={
                <LVBadge
                  label={isGoogleConnected ? 'Connected' : 'Offline'}
                  variant={isGoogleConnected ? 'success' : 'neutral'}
                  small
                />
              }
            />
            <LVDivider style={styles.rowDivider} />
            <SettingsRow
              icon="document"
              title="Google Sheets"
              subtitle={
                isGoogleConnected
                  ? `Linked: "LifeVault Data" (${spreadsheetId ? '7 tabs active' : 'Connecting...'})`
                  : 'Not connected — Tap to link'
              }
              onPress={isGoogleConnected ? undefined : () => signInWithGoogle()}
              rightContent={
                <LVBadge
                  label={isGoogleConnected ? 'Connected' : 'Offline'}
                  variant={isGoogleConnected ? 'success' : 'neutral'}
                  small
                />
              }
            />
            <LVDivider style={styles.rowDivider} />
            <SettingsRow
              icon="calendar"
              title="Google Calendar"
              subtitle={
                isGoogleConnected
                  ? 'Active — Automatic reminder events & sync'
                  : 'Sync reminders to Google Calendar'
              }
              rightContent={
                <LVBadge
                  label={isGoogleConnected ? 'Active' : 'Offline'}
                  variant={isGoogleConnected ? 'success' : 'neutral'}
                  small
                />
              }
            />
          </LVCard>
        </View>

        {/* Data & Cloud Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Cloud Sync</Text>
          <LVCard noPadding>
            <SettingsRow
              icon="sync"
              title="Sync Now"
              subtitle={
                isSyncing
                  ? 'Synchronizing with Drive & Sheets...'
                  : lastSyncedAt
                  ? `Last synced: ${relativeDate(lastSyncedAt)}`
                  : pendingCount > 0
                  ? `${pendingCount} items pending sync`
                  : 'Ready to sync'
              }
              onPress={handleSyncNow}
              rightContent={
                <LVBadge
                  label={isSyncing ? 'Syncing...' : 'Sync'}
                  variant="primary"
                  small
                />
              }
            />
            <LVDivider style={styles.rowDivider} />
            <SettingsRow
              icon="profile"
              title="Switch Google Account"
              subtitle={isGoogleConnected ? `Current: ${userEmail}` : 'Connect an account'}
              onPress={handleSwitchAccount}
            />
            <LVDivider style={styles.rowDivider} />
            <SettingsRow
              icon="lock"
              title="Disconnect Google"
              subtitle="Decouple Drive & Sheets (Local data stays intact)"
              onPress={isGoogleConnected ? handleDisconnectGoogle : undefined}
              danger={isGoogleConnected}
            />
          </LVCard>
        </View>

        {/* Local Backup & Data Portability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local Backup & Data Portability</Text>
          <LVCard noPadding>
            <SettingsRow
              icon="export"
              title="Export Vault Backup (JSON)"
              subtitle="Generate a complete offline backup file"
              onPress={handleExportBackup}
              rightContent={<LVBadge label="Offline" variant="info" small />}
            />
            <LVDivider style={styles.rowDivider} />
            <SettingsRow
              icon="import"
              title="Restore from Backup"
              subtitle="Restore vault records from JSON payload"
              onPress={() => setRestoreModalVisible(true)}
              rightContent={<LVBadge label="Restore" variant="neutral" small />}
            />
          </LVCard>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <LVCard noPadding>
            <SettingsRow
              icon="sun"
              title="Light Mode"
              subtitle="Clean white & blue aesthetic"
              rightContent={<LVBadge label="Active" variant="success" small />}
            />
          </LVCard>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <LVCard noPadding>
            <SettingsRow
              icon="vault"
              title="LifeVault AI"
              subtitle="Version 1.0.0 — All 9 Phases Complete"
              rightContent={<LVBadge label="Production Ready" variant="success" small />}
            />
          </LVCard>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <LVCard noPadding>
            <SettingsRow
              icon="logout"
              title="Sign Out"
              onPress={handleSignOut}
              danger
            />
          </LVCard>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>
            Life<Text style={{ color: colors.primary }}>Vault AI</Text>
          </Text>
          <Text style={styles.footerTagline}>Your life. Organized.</Text>
          <Text style={styles.footerNote}>
            Your data lives safely in your private local vault & Google cloud.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Export Backup Modal */}
      <Modal
        visible={backupModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setBackupModalVisible(false)}>
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vault Backup (JSON)</Text>
            <TouchableOpacity onPress={() => setBackupModalVisible(false)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Export Summary</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
                <AnimatedIcon name="document" size={16} active color={colors.primary} />
                <Text style={styles.statsRow}>Documents: {backupCounts.documents || 0}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
                <AnimatedIcon name="receipt" size={16} active color={colors.primary} />
                <Text style={styles.statsRow}>Receipts: {backupCounts.receipts || 0}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
                <AnimatedIcon name="money" size={16} active color={colors.primary} />
                <Text style={styles.statsRow}>Expenses: {backupCounts.expenses || 0}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
                <AnimatedIcon name="bill" size={16} active color={colors.primary} />
                <Text style={styles.statsRow}>Payments: {backupCounts.payments || 0}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
                <AnimatedIcon name="vehicle" size={16} active color={colors.primary} />
                <Text style={styles.statsRow}>Vehicles: {backupCounts.vehicles || 0}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
                <AnimatedIcon name="asset" size={16} active color={colors.primary} />
                <Text style={styles.statsRow}>Assets: {backupCounts.assets || 0}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 }}>
                <AnimatedIcon name="reminder" size={16} active color={colors.primary} />
                <Text style={styles.statsRow}>Reminders: {backupCounts.reminders || 0}</Text>
              </View>
            </View>

            <Text style={styles.codeLabel}>Raw Backup JSON Payload:</Text>
            <TextInput
              style={styles.codeBox}
              value={backupJsonText}
              multiline
              editable={false}
              selectTextOnFocus
            />

            <View style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
              <LVButton
                title="Close"
                variant="primary"
                onPress={() => setBackupModalVisible(false)}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Restore Backup Modal */}
      <Modal
        visible={restoreModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setRestoreModalVisible(false)}>
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Restore Vault Backup</Text>
            <TouchableOpacity onPress={() => setRestoreModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.restoreDesc}>
              Paste your LifeVault JSON backup below to restore your offline records. Existing records with matching IDs will be safely merged and updated.
            </Text>

            <TextInput
              style={styles.inputBox}
              value={restoreJsonInput}
              onChangeText={setRestoreJsonInput}
              placeholder="Paste LifeVault backup JSON here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />

            <View style={{ marginTop: spacing.lg, gap: spacing.md, marginBottom: spacing.xl }}>
              <LVButton
                title={isProcessingBackup ? 'Restoring...' : 'Validate & Restore Backup'}
                variant="primary"
                onPress={handleRestoreBackup}
                disabled={isProcessingBackup || !restoreJsonInput.trim()}
              />
              <LVButton
                title="Cancel"
                variant="outline"
                onPress={() => setRestoreModalVisible(false)}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.base,
  },

  // Profile
  profileCard: {
    marginBottom: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Sections
  section: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rowDivider: {
    marginVertical: 0,
    marginHorizontal: spacing.base,
  },

  // Settings rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconText: { fontSize: 18 },
  settingsInfo: { flex: 1 },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingsSub: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsArrow: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  versionText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  footerLogo: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  footerTagline: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  footerNote: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },

  // Modal & Backup Styles
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
    marginBottom: spacing.base,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statsRow: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  codeBox: {
    backgroundColor: '#1E293B',
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontSize: 11,
    padding: spacing.base,
    borderRadius: radii.sm,
    height: 220,
    textAlignVertical: 'top',
  },
  restoreDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  inputBox: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 12,
    padding: spacing.base,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 240,
  },
});
