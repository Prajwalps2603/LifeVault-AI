import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radii, shadows } from '../../theme';
import { LVCard, LVSectionHeader, LVBadge, LVButton, LVSearchBar } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { formatCurrency, formatDate, relativeDate } from '../../utils/helpers';
import type { Expense, Payment, ExpenseCategory } from '../../types';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { PaymentDetailModal } from './PaymentDetailModal';

const TABS = ['Expenses', 'Payments', 'Analytics', 'Calendar'];

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

const FILTER_CATEGORIES = [
  'ALL',
  'GROCERIES',
  'PETROL',
  'FOOD',
  'SHOPPING',
  'BILLS',
  'TRANSPORT',
  'MEDICAL',
];

interface MoneyScreenProps {
  onOpenAdd: () => void;
}

export const MoneyScreen: React.FC<MoneyScreenProps> = ({ onOpenAdd }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { state, loadAll, markPaymentPaid, deleteExpense } = useAppStore();
  const { expenses, payments, receipts } = state;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const duePayments = payments.filter(p => p.status !== 'PAID');
  const paidPayments = payments.filter(p => p.status === 'PAID');
  const totalDueAmount = duePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Dynamic Category Stats
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.category || 'OTHER';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
  });

  const categoryStats = Object.entries(categoryTotals).map(([key, amount]) => {
    const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
    return {
      category: key,
      label: key.charAt(0) + key.slice(1).toLowerCase(),
      amount,
      percentage,
      color: CATEGORY_COLORS[key] || '#6B7280',
    };
  }).sort((a, b) => b.amount - a.amount);

  // Top Merchants Calculation
  const merchantTotals: Record<string, number> = {};
  expenses.forEach(e => {
    if (e.merchantName) {
      merchantTotals[e.merchantName] = (merchantTotals[e.merchantName] || 0) + e.amount;
    }
  });
  const topMerchants = Object.entries(merchantTotals)
    .map(([merchant, amount]) => ({ merchant, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  // Filtered Expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.merchantName && e.merchantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Filtered Payments
  const filteredPayments = payments.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Money</Text>
          <Text style={styles.headerSub}>Personal expenses, bills & finances</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onOpenAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
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

        {/* ── EXPENSES TAB ────────────────────────────────────────── */}
        {activeTab === 0 && (
          <View>
            {/* Quick Hero Summary */}
            <LVCard style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <Text style={styles.summaryTitle}>TOTAL RECORDED SPEND</Text>
                <LVBadge label="Live Vault Data" variant="primary" small />
              </View>
              <Text style={styles.summaryAmount}>{formatCurrency(totalSpent)}</Text>
              <View style={styles.summaryStatsRow}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>{expenses.length}</Text>
                  <Text style={styles.summaryStatLabel}>Transactions</Text>
                </View>
                <View style={styles.summaryStatDivider} />
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>
                    {expenses.filter(e => Boolean(e.receiptId)).length}
                  </Text>
                  <Text style={styles.summaryStatLabel}>With Receipts</Text>
                </View>
                <View style={styles.summaryStatDivider} />
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>{categoryStats.length}</Text>
                  <Text style={styles.summaryStatLabel}>Categories</Text>
                </View>
              </View>
            </LVCard>

            {/* Search */}
            <View style={{ marginTop: spacing.md }}>
              <LVSearchBar
                placeholder="Search expense or merchant..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
              contentContainerStyle={styles.catScrollContent}>
              {FILTER_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    selectedCategory === cat && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory === cat && styles.catChipTextActive,
                    ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Transaction List */}
            <View style={styles.sectionGap}>
              <LVSectionHeader
                title={`Transactions (${filteredExpenses.length})`}
                actionLabel="+ Log"
                onAction={onOpenAdd}
              />

              {filteredExpenses.map(expense => {
                const hasReceipt = Boolean(expense.receiptId);
                const catColor = CATEGORY_COLORS[expense.category] || colors.primary;

                return (
                  <TouchableOpacity
                    key={expense.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedExpense(expense)}>
                    <LVCard style={styles.expenseCard}>
                      <View style={styles.payRow}>
                        <View style={[styles.payStatus, { backgroundColor: `${catColor}20` }]}>
                          <AnimatedIcon
                            name={
                              expense.category === 'GROCERIES' ? 'cart' :
                              expense.category === 'PETROL' ? 'fuel' :
                              expense.category === 'BILLS' ? 'bill' : 'money'
                            }
                            size={18}
                            active
                            color={catColor}
                          />
                        </View>
                        <View style={styles.payInfo}>
                          <Text style={styles.payTitle} numberOfLines={1}>{expense.title}</Text>
                          <View style={styles.expenseMetaRow}>
                            <Text style={styles.payDue}>{expense.date}</Text>
                            {expense.merchantName ? (
                              <Text style={styles.payDue}> • {expense.merchantName}</Text>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.payRight}>
                          <Text style={styles.payAmount}>
                            {formatCurrency(expense.amount)}
                          </Text>
                          <View style={styles.badgesRow}>
                            {hasReceipt && (
                              <LVBadge label="Receipt" variant="success" small />
                            )}
                            <LVBadge label={expense.category} variant="primary" small />
                          </View>
                        </View>
                      </View>
                    </LVCard>
                  </TouchableOpacity>
                );
              })}

              {filteredExpenses.length === 0 && (
                <LVCard style={{ padding: spacing.lg, alignItems: 'center' }}>
                  <AnimatedIcon name="search" size={32} active color={colors.primary} />
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
                    No matching expenses
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    Try changing your category filter or search query.
                  </Text>
                </LVCard>
              )}
            </View>
          </View>
        )}

        {/* ── PAYMENTS & BILLS TAB ──────────────────────────────────── */}
        {activeTab === 1 && (
          <View>
            {/* Bills Summary Card */}
            <LVCard style={styles.billsSummaryCard}>
              <View style={styles.billsSummaryTop}>
                <View>
                  <Text style={styles.billsSummaryLabel}>UPCOMING BILL COMMITMENTS</Text>
                  <Text style={styles.billsSummaryAmount}>{formatCurrency(totalDueAmount)}</Text>
                </View>
                <LVBadge
                  label={`${duePayments.length} Due`}
                  variant={duePayments.length > 0 ? 'error' : 'success'}
                />
              </View>
              <Text style={styles.billsSummarySub}>
                {paidPayments.length} bills settled this cycle
              </Text>
            </LVCard>

            {/* Due Bills Section */}
            <View style={styles.sectionGap}>
              <LVSectionHeader
                title={`Due & Upcoming (${duePayments.length})`}
                actionLabel="+ Track Bill"
                onAction={onOpenAdd}
              />
              {duePayments.map(payment => (
                <TouchableOpacity
                  key={payment.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPayment(payment)}>
                  <LVCard style={styles.payCard}>
                    <View style={styles.payRow}>
                      <View style={[
                        styles.payStatus,
                        payment.status === 'DUE' ? styles.payStatusRed :
                        payment.status === 'OVERDUE' ? styles.payStatusDarkRed :
                        styles.payStatusOrange,
                      ]}>
                        <AnimatedIcon
                          name="calendar"
                          size={16}
                          active
                          color={payment.status === 'OVERDUE' || payment.status === 'DUE' ? colors.error : colors.warning}
                        />
                      </View>
                      <View style={styles.payInfo}>
                        <Text style={styles.payTitle}>{payment.title}</Text>
                        <Text style={styles.payDue}>
                          {payment.status === 'DUE'
                            ? 'Due today'
                            : `Due on ${payment.dueDate}`}
                          {payment.isRecurring ? ' • Recurring' : ''}
                        </Text>
                      </View>
                      <View style={styles.payRight}>
                        <Text style={styles.payAmount}>
                          {formatCurrency(payment.amount)}
                        </Text>
                        <LVBadge
                          label={payment.status === 'DUE' ? 'DUE TODAY' : payment.status}
                          variant={payment.status === 'DUE' ? 'error' : 'warning'}
                          small
                        />
                      </View>
                    </View>
                  </LVCard>
                </TouchableOpacity>
              ))}

              {duePayments.length === 0 && (
                <LVCard style={{ padding: spacing.md, alignItems: 'center' }}>
                  <Text style={{ color: colors.success, fontWeight: '600', fontSize: 13 }}>
                    All scheduled bills are settled!
                  </Text>
                </LVCard>
              )}
            </View>

            {/* Paid Bills Section */}
            {paidPayments.length > 0 && (
              <View style={styles.sectionGap}>
                <LVSectionHeader title={`Settled Bills (${paidPayments.length})`} />
                {paidPayments.map(payment => (
                  <TouchableOpacity
                    key={payment.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPayment(payment)}>
                    <LVCard style={[styles.payCard, { opacity: 0.85 }]}>
                      <View style={styles.payRow}>
                        <View style={[styles.payStatus, styles.payStatusGreen]}>
                          <AnimatedIcon name="check" size={12} color={colors.white} active />
                        </View>
                        <View style={styles.payInfo}>
                          <Text style={styles.payTitle}>{payment.title}</Text>
                          <Text style={styles.payDue}>
                            Paid on {payment.paidDate ? payment.paidDate.split('T')[0] : payment.dueDate}
                          </Text>
                        </View>
                        <View style={styles.payRight}>
                          <Text style={styles.payAmount}>
                            {formatCurrency(payment.amount)}
                          </Text>
                          <LVBadge label="PAID" variant="success" small />
                        </View>
                      </View>
                    </LVCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── ANALYTICS TAB ────────────────────────────────────────── */}
        {activeTab === 2 && (
          <View>
            {/* Donut & Category Breakdown Card */}
            <LVCard style={styles.analyticsCard}>
              <View style={styles.donutPlaceholder}>
                <View style={styles.donutOuter}>
                  <View style={styles.donutInner}>
                    <Text style={styles.donutLabel}>Total Spend</Text>
                    <Text style={styles.donutValue}>{formatCurrency(totalSpent)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.legendGrid}>
                {categoryStats.map((cat, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.legendText}>{cat.label}</Text>
                    <Text style={styles.legendAmount}>{formatCurrency(cat.amount)}</Text>
                    <Text style={styles.legendPct}>{cat.percentage}%</Text>
                  </View>
                ))}
                {categoryStats.length === 0 && (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                    Record expenses to visualize spending analytics.
                  </Text>
                )}
              </View>
            </LVCard>

            {/* Top Merchants */}
            {topMerchants.length > 0 && (
              <View style={styles.sectionGap}>
                <LVSectionHeader title="Top Stores & Merchants" />
                <LVCard style={{ padding: spacing.md, gap: spacing.sm }}>
                  {topMerchants.map((m, idx) => (
                    <View key={m.merchant} style={styles.merchantRow}>
                      <Text style={styles.merchantRank}>#{idx + 1}</Text>
                      <Text style={styles.merchantName}>{m.merchant}</Text>
                      <Text style={styles.merchantAmount}>{formatCurrency(m.amount)}</Text>
                    </View>
                  ))}
                </LVCard>
              </View>
            )}

            {/* Insights */}
            <View style={styles.sectionGap}>
              <Text style={styles.sectionLabel}>Financial Insights</Text>
              <LVCard style={styles.insightCard}>
                <AnimatedIcon name="sparkle" size={20} active color={colors.warning} />
                <Text style={styles.insightText}>
                  {categoryStats.length > 0
                    ? `${categoryStats[0].label} is your top expense category representing ${categoryStats[0].percentage}% of total logged spending (${formatCurrency(categoryStats[0].amount)}).`
                    : 'Add expenses to see detailed category insights.'}
                </Text>
              </LVCard>

              <LVCard style={styles.insightCard}>
                <AnimatedIcon name="receipt" size={20} active color={colors.primary} />
                <Text style={styles.insightText}>
                  {receipts.length} total receipts archived in your Google Drive storage.
                </Text>
              </LVCard>

              <LVCard style={styles.insightCard}>
                <AnimatedIcon name="bill" size={20} active color={colors.secondary} />
                <Text style={styles.insightText}>
                  {duePayments.length} upcoming bill payments scheduled ({formatCurrency(totalDueAmount)} total commitment).
                </Text>
              </LVCard>
            </View>
          </View>
        )}

        {/* ── CALENDAR TAB ─────────────────────────────────────────── */}
        {activeTab === 3 && (
          <View>
            <LVCard style={styles.calendarCard}>
              <Text style={styles.calendarTitle}>Upcoming Dues Calendar</Text>
              <Text style={styles.calendarSub}>Bills and scheduled renewals across the month</Text>
              <View style={styles.calendarEvents}>
                {payments.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.calendarEvent}
                    onPress={() => setSelectedPayment(p)}
                    activeOpacity={0.7}>
                    <View style={[styles.calendarDot, {
                      backgroundColor:
                        p.status === 'PAID' ? colors.success :
                        p.status === 'DUE' ? colors.error : colors.warning,
                    }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.calendarEventTitle}>{p.title}</Text>
                      <Text style={styles.calendarEventDate}>
                        {formatDate(p.dueDate)} • {p.status}
                      </Text>
                    </View>
                    <Text style={styles.calendarEventAmount}>
                      {formatCurrency(p.amount)}
                    </Text>
                  </TouchableOpacity>
                ))}
                {payments.length === 0 && (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, padding: spacing.sm }}>
                    No events scheduled.
                  </Text>
                )}
              </View>
            </LVCard>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        visible={Boolean(selectedExpense)}
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        visible={Boolean(selectedPayment)}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
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
    marginBottom: spacing.base,
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
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  addBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.base,
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
    fontSize: 13,
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

  // Summary
  summaryCard: {
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
  },
  summaryAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    width: '100%',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },

  catScroll: {
    marginTop: spacing.md,
  },
  catScrollContent: {
    gap: spacing.xs,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },

  sectionGap: { marginTop: spacing.xl },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Bills Summary
  billsSummaryCard: {
    padding: spacing.lg,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: spacing.xs,
  },
  billsSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  billsSummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    letterSpacing: 1.2,
  },
  billsSummaryAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7F1D1D',
  },
  billsSummarySub: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 4,
  },

  // Expenses & Payments Cards
  expenseCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  payCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  payStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payStatusRed: { backgroundColor: colors.errorLight },
  payStatusDarkRed: { backgroundColor: '#FEE2E2' },
  payStatusGreen: { backgroundColor: colors.successLight },
  payStatusOrange: { backgroundColor: colors.warningLight },
  payStatusText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  payInfo: { flex: 1 },
  payTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  payDue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  payRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  payAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
  },

  // Analytics
  analyticsCard: {
    alignItems: 'center',
    gap: spacing.xl,
    padding: spacing.lg,
  },
  donutPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 22,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    alignItems: 'center',
  },
  donutLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  donutValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  legendGrid: {
    width: '100%',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legendPct: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textTertiary,
    width: 38,
    textAlign: 'right',
  },

  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  merchantRank: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    width: 28,
  },
  merchantName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  merchantAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Insights
  insightCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  insightEmoji: { fontSize: 22, marginTop: 2 },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Calendar
  calendarCard: {
    gap: spacing.base,
    padding: spacing.lg,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calendarSub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  calendarEvents: { gap: spacing.sm, marginTop: spacing.xs },
  calendarEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  calendarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  calendarEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  calendarEventDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  calendarEventAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
