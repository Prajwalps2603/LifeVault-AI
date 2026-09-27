import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { LVCard, LVSectionHeader, LVBadge, LVSearchBar } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { formatDate } from '../../utils/helpers';
import { ReminderEngine } from '../../services/reminders/ReminderEngine';
import { NotificationService } from '../../services/notifications/NotificationService';
import { CalendarSyncService } from '../../services/calendar/CalendarSyncService';
import { ReminderDetailModal } from './ReminderDetailModal';
import type { Reminder } from '../../types';

const TABS = ['All', 'Due Soon', 'Recurring', 'Expiries', 'Completed'];

interface RemindersScreenProps {
  onOpenAdd?: () => void;
}

export const RemindersScreen: React.FC<RemindersScreenProps> = ({ onOpenAdd }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [calSyncing, setCalSyncing] = useState(false);

  const { state, loadAll } = useAppStore();
  const { reminders, documents } = state;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
      await NotificationService.recoverNotifications(reminders);
    } finally {
      setRefreshing(false);
    }
  };

  // Recover notifications on mount
  useEffect(() => {
    NotificationService.recoverNotifications(reminders);
  }, []);

  const expiringDocs = ReminderEngine.detectExpiringDocuments(documents, 45);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filteredReminders = reminders.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 1) {
      // Due Soon (next 14 days, not completed)
      if (r.isCompleted) return false;
      const due = new Date(r.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400_000);
      return diffDays >= 0 && diffDays <= 14;
    }
    if (activeTab === 2) {
      // Recurring
      return r.frequency && r.frequency !== 'ONCE';
    }
    if (activeTab === 3) {
      // Expiries handled in separate block
      return false;
    }
    if (activeTab === 4) {
      // Completed
      return r.isCompleted;
    }

    // Tab 0: All
    return true;
  });

  const handleSyncAllCalendar = async () => {
    try {
      setCalSyncing(true);
      const result = await CalendarSyncService.syncAllToCalendar(reminders, documents);
      Alert.alert(
        'Calendar Sync Complete',
        `Synced ${result.syncedReminders} reminders and ${result.syncedExpiries} document expiries to your Google Calendar. Duplicate event prevention enforced (Rule 10).`,
      );
    } catch (err: any) {
      Alert.alert('Sync Error', err?.message || 'Failed to sync calendar');
    } finally {
      setCalSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.headerSub}>Alerts, renewals & scheduled dues</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.calSyncBtn}
            onPress={handleSyncAllCalendar}
            disabled={calSyncing}
            activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <AnimatedIcon name="calendar" size={14} active color={colors.white} />
              <Text style={styles.calSyncBtnText}>{calSyncing ? 'Syncing...' : 'Sync Cal'}</Text>
            </View>
          </TouchableOpacity>
          {onOpenAdd && (
            <TouchableOpacity style={styles.addBtn} onPress={onOpenAdd} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.screenPadding, marginBottom: spacing.xs }}>
        <LVSearchBar
          placeholder="Search reminders & alerts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(i)}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>

        {/* Expiries Tab or Banner */}
        {activeTab === 3 ? (
          <View style={styles.sectionGap}>
            <LVSectionHeader
              title={`Expiring Documents & Policies (${expiringDocs.length})`}
            />
            {expiringDocs.map(({ document: doc, daysLeft }) => (
              <LVCard key={doc.id} style={styles.expiryCard}>
                <View style={styles.expiryRow}>
                  <View style={styles.expiryIcon}>
                    <AnimatedIcon
                      name={doc.documentType === 'INSURANCE' ? 'shield' : doc.documentType === 'PUC' ? 'vehicle' : 'document'}
                      size={20}
                      active
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expiryTitle}>{doc.name}</Text>
                    <Text style={styles.expirySub}>
                      Expires: {doc.expiryDate}
                    </Text>
                  </View>
                  <LVBadge
                    label={daysLeft === 0 ? 'Expires Today' : `${daysLeft}d left`}
                    variant={daysLeft <= 7 ? 'error' : 'warning'}
                  />
                </View>
              </LVCard>
            ))}

            {expiringDocs.length === 0 && (
              <LVCard style={{ padding: spacing.lg, alignItems: 'center' }}>
                <AnimatedIcon name="shield" size={32} active color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginTop: spacing.xs }}>
                  No Upcoming Expiries
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  All insurance policies, PUCs, and warranties are valid.
                </Text>
              </LVCard>
            )}
          </View>
        ) : (
          <View>
            {/* Reminder items */}
            {filteredReminders.map(reminder => (
              <TouchableOpacity
                key={reminder.id}
                activeOpacity={0.8}
                onPress={() => setSelectedReminder(reminder)}>
                <LVCard style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <View style={[
                      styles.reminderIconWrap,
                      reminder.isCompleted && styles.reminderIconWrapDone,
                    ]}>
                      <AnimatedIcon
                        name={reminder.isCompleted ? 'check' : 'clock'}
                        size={16}
                        active={!reminder.isCompleted}
                        color={reminder.isCompleted ? colors.success : colors.warning}
                      />
                    </View>
                    <View style={styles.reminderInfo}>
                      <Text style={[
                        styles.reminderTitle,
                        reminder.isCompleted && styles.reminderTitleDone,
                      ]}>
                        {reminder.title}
                      </Text>
                      <Text style={styles.reminderDue}>
                        Due {formatDate(reminder.dueDate)} at {reminder.time || '09:00 AM'}
                      </Text>
                    </View>
                    <LVBadge
                      label={reminder.isCompleted ? 'Done' : 'Pending'}
                      variant={reminder.isCompleted ? 'success' : 'warning'}
                      small
                    />
                  </View>

                  {reminder.description ? (
                    <Text style={styles.reminderDesc} numberOfLines={2}>
                      {reminder.description}
                    </Text>
                  ) : null}

                  {reminder.frequency && reminder.frequency !== 'ONCE' ? (
                    <View style={styles.recurringBadge}>
                      <Text style={styles.recurringText}>
                        Repeats {reminder.frequency.toLowerCase()}
                      </Text>
                    </View>
                  ) : null}
                </LVCard>
              </TouchableOpacity>
            ))}

            {filteredReminders.length === 0 && (
              <LVCard style={{ padding: spacing.lg, alignItems: 'center' }}>
                <AnimatedIcon name="clock" size={32} active color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginTop: spacing.xs }}>
                  No Reminders Found
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  Tap + Add to schedule a renewal, bill, or task alert.
                </Text>
              </LVCard>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reminder Detail Modal */}
      <ReminderDetailModal
        visible={Boolean(selectedReminder)}
        reminder={selectedReminder}
        onClose={() => setSelectedReminder(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  calSyncBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
  },
  calSyncBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  addBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },

  sectionGap: { gap: spacing.sm },

  reminderCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reminderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderIconWrapDone: {
    backgroundColor: colors.successLight,
  },
  reminderIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  reminderInfo: { flex: 1 },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reminderTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  reminderDue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reminderDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginLeft: 52,
  },
  recurringBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginLeft: 52,
    marginTop: 2,
  },
  recurringText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
  },

  expiryCard: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  expiryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  expirySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
