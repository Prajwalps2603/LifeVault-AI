import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radii, shadows } from '../../theme';
import { LVCard, LVSectionHeader, LVBadge, LVAvatar, AnimatedIcon } from '../../components';
import type { IconType } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { formatCurrency, formatDate, relativeDate } from '../../utils/helpers';
import type { Document } from '../../types';
import { DocumentDetailModal } from '../Vault/DocumentDetailModal';

interface TodayScreenProps {
  onOpenAdd: () => void;
  onOpenAI: () => void;
  onOpenSearch?: () => void;
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

export const TodayScreen: React.FC<TodayScreenProps> = ({
  onOpenAdd,
  onOpenAI,
  onOpenSearch,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const { state, loadAll } = useAppStore();
  const { documents, expenses, payments, reminders, assets, vehicles } = state;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  // Dynamic calculations from store
  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const dueToday = payments.filter(p => p.status === 'DUE');
  const pendingReminders = reminders.filter(r => !r.isCompleted);
  const expiringDocs = documents.filter(d => Boolean(d.expiryDate));

  // Category breakdown calculation
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.category || 'OTHER';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
  });

  const expenseCategories = Object.entries(categoryTotals).map(([key, amount]) => {
    const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
    return {
      label: key.charAt(0) + key.slice(1).toLowerCase(),
      amount,
      percentage,
      color: CATEGORY_COLORS[key] || '#6B7280',
    };
  }).slice(0, 4);

  // Recently added items
  const recentItems: Array<{ id: string; name: string; type: string; icon: IconType; date?: string; doc?: Document }> = [
    ...documents.map(d => ({ id: d.id, name: d.name, type: 'Document', icon: 'document' as IconType, date: d.createdAt, doc: d })),
    ...expenses.map(e => ({ id: e.id, name: e.title, type: 'Expense', icon: 'money' as IconType, date: e.createdAt, doc: undefined })),
    ...vehicles.map(v => ({ id: v.id, name: v.name, type: 'Vehicle', icon: 'vehicle' as IconType, date: v.createdAt, doc: undefined })),
    ...assets.map(a => ({ id: a.id, name: a.name, type: 'Asset', icon: 'asset' as IconType, date: a.createdAt, doc: undefined })),
  ]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 4);

  const attentionCount = dueToday.length + pendingReminders.length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}, Prajwal</Text>
            <Text style={styles.headerSub}>Your life. Organized.</Text>
          </View>
          <View style={styles.headerRight}>
            {onOpenSearch && (
              <TouchableOpacity
                style={styles.aiButton}
                onPress={onOpenSearch}
                activeOpacity={0.8}>
                <AnimatedIcon name="search" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.aiButton}
              onPress={onOpenAI}
              activeOpacity={0.8}>
              <AnimatedIcon name="sparkle" size={18} active color={colors.primary} />
            </TouchableOpacity>
            <LVAvatar name="Prajwal" size="md" />
          </View>
        </View>

        {/* Cloud Sync & Storage Banner */}
        <View style={styles.demoBanner}>
          <AnimatedIcon
            name={state.isGoogleConnected ? 'cloud' : 'lightning'}
            size={16}
            active
            color={state.isGoogleConnected ? colors.primary : colors.warning}
          />
          <Text style={styles.demoBannerText}>
            {state.isGoogleConnected
              ? `Google Drive & Sheets Connected • ${state.isSyncing ? 'Syncing...' : state.lastSyncedAt ? 'Synced' : 'Ready'}`
              : 'Local Vault Active — Changes Persisted Offline'}
          </Text>
        </View>

        {/* Today Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>TODAY</Text>
            <View style={styles.attentionBadge}>
              <Text style={styles.attentionText}>
                {attentionCount > 0 ? `${attentionCount} need attention` : 'All caught up!'}
              </Text>
            </View>
          </View>

          {/* Due today items */}
          {dueToday.map(payment => (
            <TouchableOpacity key={payment.id} style={styles.alertRow} activeOpacity={0.8}>
              <View style={[styles.alertDot, styles.alertDotRed]} />
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>{payment.title}</Text>
                <Text style={styles.alertSub}>Due today</Text>
              </View>
              <Text style={styles.alertAmount}>{formatCurrency(payment.amount)}</Text>
            </TouchableOpacity>
          ))}

          {/* Pending reminders */}
          {pendingReminders.slice(0, 2).map(reminder => (
            <TouchableOpacity key={reminder.id} style={styles.alertRow} activeOpacity={0.8}>
              <View style={[styles.alertDot, styles.alertDotOrange]} />
              <View style={styles.alertInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AnimatedIcon name="reminder" size={14} active color={colors.warning} />
                  <Text style={styles.alertTitle}>{reminder.title}</Text>
                </View>
                <Text style={styles.alertSub}>Due {reminder.dueDate} at {reminder.time}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {dueToday.length === 0 && pendingReminders.length === 0 && (
            <Text style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: spacing.sm }}>
              No urgent dues or reminders today.
            </Text>
          )}
        </View>

        {/* Monthly Snapshot */}
        <View style={styles.sectionGap}>
          <LVSectionHeader title="Your Month" actionLabel="View all" onAction={() => {}} />

          <View style={styles.monthRow}>
            <LVCard style={styles.monthStatCard} elevated>
              <AnimatedIcon name="money" size={24} active color={colors.primary} />
              <Text style={styles.monthStatValue}>{formatCurrency(totalSpent)}</Text>
              <Text style={styles.monthStatLabel}>Spent</Text>
            </LVCard>

            <LVCard style={styles.monthStatCard} elevated>
              <AnimatedIcon name="bill" size={24} active color={colors.secondary} />
              <Text style={styles.monthStatValue}>{payments.length}</Text>
              <Text style={styles.monthStatLabel}>Bills tracked</Text>
            </LVCard>

            <LVCard style={styles.monthStatCard} elevated>
              <AnimatedIcon name="document" size={24} active color={colors.warning} />
              <Text style={styles.monthStatValue}>{expiringDocs.length}</Text>
              <Text style={styles.monthStatLabel}>Expiring</Text>
            </LVCard>
          </View>
        </View>

        {/* Mini Spending Chart */}
        <View style={styles.sectionGap}>
          <LVSectionHeader title="Spending Breakdown" actionLabel="Details" onAction={() => {}} />
          <LVCard>
            <View style={styles.spendingTotal}>
              <Text style={styles.spendingAmount}>{formatCurrency(totalSpent)}</Text>
              <LVBadge label="Total Logged" variant="primary" />
            </View>
            <View style={styles.spendingBars}>
              {expenseCategories.map((cat, i) => (
                <View key={i} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {cat.label}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barAmount}>{formatCurrency(cat.amount)}</Text>
                </View>
              ))}
              {expenseCategories.length === 0 && (
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No expenses recorded yet.</Text>
              )}
            </View>
          </LVCard>
        </View>

        {/* Recently Added */}
        <View style={styles.sectionGap}>
          <LVSectionHeader title="Recently Added" actionLabel="View Vault" onAction={() => {}} />
          {recentItems.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => {
                if (item.doc) {
                  setSelectedDoc(item.doc);
                }
              }}>
              <LVCard style={styles.recentCard}>
                <View style={styles.recentRow}>
                  <View style={styles.recentIconWrap}>
                    <AnimatedIcon name={item.icon} size={20} active />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.recentType}>{item.type}</Text>
                  </View>
                  <Text style={styles.recentArrow}>›</Text>
                </View>
              </LVCard>
            </TouchableOpacity>
          ))}
          {recentItems.length === 0 && (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No items in vault yet.</Text>
          )}
        </View>

        {/* Needs Review / Quick Add */}
        <View style={styles.sectionGap}>
          <TouchableOpacity activeOpacity={0.8} onPress={onOpenAdd}>
            <View style={styles.reviewCard}>
              <View style={styles.reviewLeft}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.secondaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatedIcon name="sparkle" size={20} active color={colors.secondary} />
                </View>
                <View>
                  <Text style={styles.reviewTitle}>
                    Quick Add to Vault
                  </Text>
                  <Text style={styles.reviewSub}>
                    Tap to save documents, expenses, vehicles & bills
                  </Text>
                </View>
              </View>
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>+</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <DocumentDetailModal
        visible={Boolean(selectedDoc)}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: { flex: 1, gap: 2 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  aiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.secondaryMid,
  },
  aiButtonText: {
    fontSize: 20,
  },

  // Demo banner
  demoBanner: {
    backgroundColor: colors.warningLight,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  demoBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.cardLarge,
    padding: spacing.cardPaddingLarge,
    marginBottom: spacing.sectionGap,
    gap: spacing.md,
    ...shadows.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  attentionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radii.badge,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  attentionText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertDotRed: { backgroundColor: '#FCA5A5' },
  alertDotOrange: { backgroundColor: '#FCD34D' },
  alertDotBlue: { backgroundColor: '#93C5FD' },
  alertInfo: { flex: 1, gap: 2 },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  alertSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
  alertAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },

  // Month Stats
  sectionGap: {
    marginBottom: spacing.sectionGap,
  },
  monthRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  monthStatCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
  },
  monthStatEmoji: { fontSize: 22 },
  monthStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monthStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Spending
  spendingTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  spendingAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  spendingBars: { gap: spacing.sm },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    width: 70,
    fontSize: 12,
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barAmount: {
    width: 62,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },

  // Recent
  recentCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIcon: { fontSize: 20 },
  recentInfo: { flex: 1 },
  recentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recentType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recentArrow: {
    fontSize: 22,
    color: colors.textTertiary,
  },

  // Review
  reviewCard: {
    backgroundColor: colors.secondaryLight,
    borderRadius: radii.card,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.secondaryMid,
  },
  reviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  reviewEmoji: { fontSize: 28 },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
  reviewSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reviewBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});
