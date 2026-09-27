/**
 * GlobalSearchModal — Fast multi-category search overlay for LifeVault.
 *
 * Implements Section 83 (Phase 8):
 * - Live real-time search across all 7 local entity stores
 * - Deep linking to item detail inspectors
 * - Entity-type filtering
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { LVCard, LVBadge } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { GlobalSearchService, GlobalSearchResult } from '../../services/search/GlobalSearchService';
import { DocumentDetailModal } from '../Vault/DocumentDetailModal';
import { ExpenseDetailModal } from '../Money/ExpenseDetailModal';
import { PaymentDetailModal } from '../Money/PaymentDetailModal';
import { VehicleDetailModal } from '../Vehicles/VehicleDetailModal';
import { AssetDetailModal } from '../Assets/AssetDetailModal';
import { ReminderDetailModal } from '../Reminders/ReminderDetailModal';
import type { Document, Expense, Payment, Vehicle, Asset, Reminder } from '../../types';

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const FILTERS = ['ALL', 'DOCS', 'EXPENSES', 'BILLS', 'VEHICLES', 'ASSETS', 'REMINDERS'];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  visible,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Inspector targets
  const [targetDoc, setTargetDoc] = useState<Document | null>(null);
  const [targetExpense, setTargetExpense] = useState<Expense | null>(null);
  const [targetPayment, setTargetPayment] = useState<Payment | null>(null);
  const [targetVehicle, setTargetVehicle] = useState<Vehicle | null>(null);
  const [targetAsset, setTargetAsset] = useState<Asset | null>(null);
  const [targetReminder, setTargetReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await GlobalSearchService.search(query);
        setResults(res);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = results.filter(item => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'DOCS') return item.type === 'DOCUMENT';
    if (activeFilter === 'EXPENSES') return item.type === 'EXPENSE';
    if (activeFilter === 'BILLS') return item.type === 'PAYMENT';
    if (activeFilter === 'VEHICLES') return item.type === 'VEHICLE';
    if (activeFilter === 'ASSETS') return item.type === 'ASSET';
    if (activeFilter === 'REMINDERS') return item.type === 'REMINDER';
    return true;
  });

  const handleSelectResult = (item: GlobalSearchResult) => {
    switch (item.type) {
      case 'DOCUMENT':
        setTargetDoc(item.rawItem as Document);
        break;
      case 'EXPENSE':
        setTargetExpense(item.rawItem as Expense);
        break;
      case 'PAYMENT':
        setTargetPayment(item.rawItem as Payment);
        break;
      case 'VEHICLE':
        setTargetVehicle(item.rawItem as Vehicle);
        break;
      case 'ASSET':
        setTargetAsset(item.rawItem as Asset);
        break;
      case 'REMINDER':
        setTargetReminder(item.rawItem as Reminder);
        break;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Search Bar Header */}
        <View style={styles.searchHeader}>
          <View style={styles.inputWrap}>
            <AnimatedIcon name="search" size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="Search across your entire LifeVault..."
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.7}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results List */}
        <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsContent}>
          {loading && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}

          {!loading && filteredResults.map(item => (
            <TouchableOpacity
              key={`${item.type}_${item.id}`}
              activeOpacity={0.8}
              onPress={() => handleSelectResult(item)}>
              <LVCard style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <View style={styles.emojiWrap}>
                    <AnimatedIcon name={item.icon || 'file'} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultSub}>{item.subtitle}</Text>
                    {item.snippet ? (
                      <Text style={styles.resultSnippet} numberOfLines={1}>
                        {item.snippet}
                      </Text>
                    ) : null}
                  </View>
                  <LVBadge label={item.type} variant="neutral" small />
                </View>
              </LVCard>
            </TouchableOpacity>
          ))}

          {!loading && query.length > 0 && filteredResults.length === 0 && (
            <View style={styles.emptyState}>
              <AnimatedIcon name="search" size={36} active color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { marginTop: spacing.sm }]}>No matching items found</Text>
              <Text style={styles.emptySub}>
                Try searching for a document title, expense merchant, vehicle name, or bill.
              </Text>
            </View>
          )}

          {!loading && query.length === 0 && (
            <View style={styles.emptyState}>
              <AnimatedIcon name="sparkle" size={36} active color={colors.primary} />
              <Text style={[styles.emptyTitle, { marginTop: spacing.sm }]}>Search LifeVault</Text>
              <Text style={styles.emptySub}>
                Instant access to receipts, policies, bills, expenses, and vehicle records.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Target Modals */}
      <DocumentDetailModal
        visible={Boolean(targetDoc)}
        document={targetDoc}
        onClose={() => setTargetDoc(null)}
      />
      <ExpenseDetailModal
        visible={Boolean(targetExpense)}
        expense={targetExpense}
        onClose={() => setTargetExpense(null)}
      />
      <PaymentDetailModal
        visible={Boolean(targetPayment)}
        payment={targetPayment}
        onClose={() => setTargetPayment(null)}
      />
      <VehicleDetailModal
        visible={Boolean(targetVehicle)}
        vehicle={targetVehicle}
        onClose={() => setTargetVehicle(null)}
      />
      <AssetDetailModal
        visible={Boolean(targetAsset)}
        asset={targetAsset}
        onClose={() => setTargetAsset(null)}
      />
      <ReminderDetailModal
        visible={Boolean(targetReminder)}
        reminder={targetReminder}
        onClose={() => setTargetReminder(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.xs,
    ...shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearBtn: {
    fontSize: 14,
    color: colors.textTertiary,
    paddingHorizontal: 4,
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  filterScroll: {
    maxHeight: 40,
  },
  filterContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  resultsScroll: {
    flex: 1,
    marginTop: spacing.sm,
  },
  resultsContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
    paddingBottom: spacing['4xl'],
  },
  resultCard: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resultSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  resultSnippet: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  emptyState: {
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
