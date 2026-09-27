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
import { colors, spacing, radii, shadows } from '../../theme';
import { LVCard, LVBadge, LVSectionHeader } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import type { Asset } from '../../types';
import { AssetDetailModal } from './AssetDetailModal';

const CATEGORIES = ['ALL', 'ELECTRONICS', 'APPLIANCE', 'PROPERTY', 'OTHER'];

export const AssetsScreen: React.FC = () => {
  const { state, loadAll } = useAppStore();
  const { assets, documents } = state;

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    if (activeCategory === 'ALL') return true;
    return a.category === activeCategory;
  });

  const totalAssetValue = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
  const activeWarrantiesCount = assets.filter(a => {
    if (!a.warrantyExpiryDate) return false;
    return new Date(a.warrantyExpiryDate).getTime() > Date.now();
  }).length;

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
          <Text style={styles.title}>Assets & Valuables</Text>
          <Text style={styles.headerSub}>Electronics, appliances, and warranties</Text>
        </View>

        {/* Portfolio Summary Card */}
        <LVCard style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>ESTIMATED PORTFOLIO VALUE</Text>
          <Text style={styles.portfolioValue}>{formatCurrency(totalAssetValue)}</Text>
          <View style={styles.portfolioStatsRow}>
            <View style={styles.portfolioStat}>
              <Text style={styles.statVal}>{assets.length}</Text>
              <Text style={styles.statLabel}>Tracked Items</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.portfolioStat}>
              <Text style={styles.statVal}>{activeWarrantiesCount}</Text>
              <Text style={styles.statLabel}>Under Warranty</Text>
            </View>
          </View>
        </LVCard>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catScrollContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                activeCategory === cat && styles.catChipActive,
              ]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.catChipText,
                  activeCategory === cat && styles.catChipTextActive,
                ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Assets List */}
        <View style={styles.sectionGap}>
          <LVSectionHeader title={`Items (${filteredAssets.length})`} />

          {filteredAssets.map(asset => {
            const relatedDocs = documents.filter(
              d => d.relatedEntityId === asset.id ||
                d.name.toLowerCase().includes(asset.name.toLowerCase()),
            );

            const isWarrantyExpiringSoon = asset.warrantyExpiryDate
              ? new Date(asset.warrantyExpiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
              : false;

            return (
              <TouchableOpacity
                key={asset.id}
                activeOpacity={0.8}
                onPress={() => setSelectedAsset(asset)}>
                <LVCard style={styles.assetCard}>
                  <View style={styles.assetHeader}>
                    <View style={styles.assetIconWrap}>
                      <AnimatedIcon name="asset" size={20} active color={colors.primary} />
                    </View>
                    <View style={styles.assetInfo}>
                      <Text style={styles.assetName}>{asset.name}</Text>
                      <Text style={styles.assetBrand}>
                        {asset.brand || 'Asset'} {asset.model ? `· ${asset.model}` : ''}
                      </Text>
                    </View>
                    {isWarrantyExpiringSoon && (
                      <LVBadge label="Expiring" variant="warning" small />
                    )}
                  </View>

                  <View style={styles.assetMeta}>
                    <View style={styles.assetMetaRow}>
                      <Text style={styles.assetMetaLabel}>Purchased</Text>
                      <Text style={styles.assetMetaValue}>
                        {asset.purchaseDate ? formatDate(asset.purchaseDate) : '—'}
                      </Text>
                    </View>
                    <View style={styles.assetMetaRow}>
                      <Text style={styles.assetMetaLabel}>Purchase Price</Text>
                      <Text style={styles.assetMetaValue}>
                        {formatCurrency(asset.purchasePrice ?? 0)}
                      </Text>
                    </View>
                    {asset.warrantyExpiryDate && (
                      <View style={styles.assetMetaRow}>
                        <Text style={styles.assetMetaLabel}>Warranty Until</Text>
                        <Text style={[
                          styles.assetMetaValue,
                          isWarrantyExpiringSoon && { color: colors.warning },
                        ]}>
                          {formatDate(asset.warrantyExpiryDate)}
                        </Text>
                      </View>
                    )}
                    {asset.serialNumber && (
                      <View style={styles.assetMetaRow}>
                        <Text style={styles.assetMetaLabel}>Serial No.</Text>
                        <Text style={styles.assetMetaValue}>{asset.serialNumber}</Text>
                      </View>
                    )}
                  </View>

                  {relatedDocs.length > 0 && (
                    <View style={styles.relatedDocs}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <AnimatedIcon name="document" size={14} active color={colors.primary} />
                        <Text style={styles.relatedDocsLabel}>
                          {relatedDocs.length} document{relatedDocs.length > 1 ? 's' : ''} linked
                        </Text>
                      </View>
                    </View>
                  )}
                </LVCard>
              </TouchableOpacity>
            );
          })}

          {filteredAssets.length === 0 && (
            <LVCard style={{ padding: spacing.lg, alignItems: 'center' }}>
              <AnimatedIcon name="asset" size={32} active color={colors.primary} />
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginTop: spacing.xs }}>
                No Assets Found
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                Add gadgets, appliances, or valuables to track warranties and receipts.
              </Text>
            </LVCard>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        visible={Boolean(selectedAsset)}
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
    gap: spacing.base,
  },
  header: { marginBottom: spacing.xs },
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
  portfolioCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  portfolioLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  portfolioStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  portfolioStat: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },
  catScroll: {
    marginHorizontal: -spacing.screenPadding,
  },
  catScrollContent: {
    paddingHorizontal: spacing.screenPadding,
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
  sectionGap: { gap: spacing.sm },
  assetCard: { padding: spacing.cardPadding, marginBottom: spacing.xs },
  assetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  assetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetEmoji: { fontSize: 22 },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  assetBrand: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  assetMeta: { gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.sm },
  assetMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetMetaLabel: { fontSize: 12, color: colors.textSecondary },
  assetMetaValue: { fontSize: 12, fontWeight: '500', color: colors.textPrimary },
  relatedDocs: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  relatedDocsLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});
