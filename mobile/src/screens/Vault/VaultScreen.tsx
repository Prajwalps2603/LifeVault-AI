/**
 * VaultScreen — Creative, Futuristic & Modular Personal Vault
 *
 * Upgraded Features:
 * - Dynamic Cybernetic Security Badge (AES-256 Vault Status)
 * - 2x2 Glassmorphic Category Matrix with Animated Vector Icons
 * - Animated filter chips (no emojis)
 * - Grid / List layout view toggle
 * - Visual document cards with security tags & status glow
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, shadows } from '../../theme';
import { LVCard, LVSectionHeader, LVSearchBar, LVBadge, AnimatedIcon } from '../../components';
import { useAppStore } from '../../store/AppContext';
import { documentTypeLabel } from '../../utils/helpers';
import type { Document, Vehicle, Asset } from '../../types';
import { DocumentDetailModal } from './DocumentDetailModal';
import { VehicleDetailModal } from '../Vehicles/VehicleDetailModal';
import { AssetDetailModal } from '../Assets/AssetDetailModal';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All Vault', icon: 'vault' as const },
  { id: 'documents', label: 'Documents', icon: 'document' as const },
  { id: 'receipts', label: 'Receipts', icon: 'receipt' as const },
  { id: 'vehicles', label: 'Vehicles', icon: 'vehicle' as const },
  { id: 'assets', label: 'Assets', icon: 'asset' as const },
];

interface VaultScreenProps {
  onOpenAdd: () => void;
}

export const VaultScreen: React.FC<VaultScreenProps> = ({ onOpenAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isGridView, setIsGridView] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const { state, loadAll } = useAppStore();
  const { documents, receipts, vehicles, assets } = state;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredReceipts = receipts.filter(rc =>
    rc.merchantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.brand && a.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalVaultItems = documents.length + receipts.length + vehicles.length + assets.length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>

        {/* Futuristic Cybernetic Vault Banner */}
        <View style={styles.cyberVaultBanner}>
          <View style={styles.bannerRow}>
            <View style={styles.vaultIconWrapper}>
              <AnimatedIcon name="lock" size={28} color="#38BDF8" active />
            </View>
            <View style={styles.bannerTextCol}>
              <View style={styles.bannerStatusRow}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.bannerStatusText}>SECURE VAULT ENGINE</Text>
              </View>
              <Text style={styles.bannerTitle}>
                {totalVaultItems} Protected Items
              </Text>
              <Text style={styles.bannerSub}>
                AES-256 Encrypted • Zero-Knowledge Offline
              </Text>
            </View>
          </View>

          <View style={styles.bannerDivider} />

          <View style={styles.bannerQuickStats}>
            <View style={styles.statMiniCol}>
              <Text style={styles.statMiniNum}>{documents.length}</Text>
              <Text style={styles.statMiniLabel}>DOCUMENTS</Text>
            </View>
            <View style={styles.statMiniDivider} />
            <View style={styles.statMiniCol}>
              <Text style={styles.statMiniNum}>{receipts.length}</Text>
              <Text style={styles.statMiniLabel}>RECEIPTS</Text>
            </View>
            <View style={styles.statMiniDivider} />
            <View style={styles.statMiniCol}>
              <Text style={styles.statMiniNum}>{vehicles.length}</Text>
              <Text style={styles.statMiniLabel}>VEHICLES</Text>
            </View>
            <View style={styles.statMiniDivider} />
            <View style={styles.statMiniCol}>
              <Text style={styles.statMiniNum}>{assets.length}</Text>
              <Text style={styles.statMiniLabel}>ASSETS</Text>
            </View>
          </View>
        </View>

        {/* Search & Layout Toggle Bar */}
        <View style={styles.searchBarRow}>
          <View style={{ flex: 1 }}>
            <LVSearchBar
              placeholder="Search vault files, assets & vehicles..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.viewToggleBtn}
            onPress={() => setIsGridView(!isGridView)}
            activeOpacity={0.8}>
            <Text style={styles.viewToggleText}>{isGridView ? 'List' : 'Grid'}</Text>
          </TouchableOpacity>
        </View>

        {/* Animated Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}>
          {CATEGORIES.map(cat => {
            const isCatActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[styles.filterChip, isCatActive && styles.filterChipActive]}
                activeOpacity={0.8}>
                <AnimatedIcon
                  name={cat.icon}
                  size={16}
                  active={isCatActive}
                  color={isCatActive ? colors.white : colors.primary}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isCatActive && styles.filterChipTextActive,
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Documents Section */}
        {(activeCategory === 'all' || activeCategory === 'documents') && (
          <View style={styles.sectionGap}>
            <LVSectionHeader
              title={`Documents (${filteredDocs.length})`}
              actionLabel="+ Add Doc"
              onAction={onOpenAdd}
            />
            {filteredDocs.length === 0 ? (
              <LVCard style={styles.emptyCard}>
                <AnimatedIcon name="document" size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No documents in this view</Text>
              </LVCard>
            ) : (
              <View style={isGridView ? styles.gridWrap : undefined}>
                {filteredDocs.map(doc => (
                  <TouchableOpacity
                    key={doc.id}
                    activeOpacity={0.85}
                    style={isGridView ? styles.gridItem : undefined}
                    onPress={() => setSelectedDoc(doc)}>
                    <LVCard style={[styles.creativeCard, { borderLeftColor: '#3B82F6' }]}>
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                          <AnimatedIcon name="document" size={20} color="#2563EB" active />
                        </View>
                        <LVBadge
                          label={doc.status === 'ORGANIZED' ? 'Verified' : 'Pending'}
                          variant={doc.status === 'ORGANIZED' ? 'success' : 'warning'}
                          small
                        />
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {documentTypeLabel(doc.documentType)}
                        {doc.expiryDate ? ` • Due: ${doc.expiryDate}` : ''}
                      </Text>
                    </LVCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Receipts Section */}
        {(activeCategory === 'all' || activeCategory === 'receipts') && (
          <View style={styles.sectionGap}>
            <LVSectionHeader
              title={`Receipts (${filteredReceipts.length})`}
              actionLabel="+ Scan"
              onAction={onOpenAdd}
            />
            {filteredReceipts.length === 0 ? (
              <LVCard style={styles.emptyCard}>
                <AnimatedIcon name="receipt" size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No receipts logged</Text>
              </LVCard>
            ) : (
              <View style={isGridView ? styles.gridWrap : undefined}>
                {filteredReceipts.map(rc => (
                  <TouchableOpacity
                    key={rc.id}
                    activeOpacity={0.85}
                    style={isGridView ? styles.gridItem : undefined}>
                    <LVCard style={[styles.creativeCard, { borderLeftColor: '#10B981' }]}>
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                          <AnimatedIcon name="receipt" size={20} color="#059669" active />
                        </View>
                        <Text style={styles.amountBadge}>₹{rc.amount}</Text>
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {rc.merchantName}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {rc.date} • {rc.items?.length || 1} items
                      </Text>
                    </LVCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Vehicles Section */}
        {(activeCategory === 'all' || activeCategory === 'vehicles') && (
          <View style={styles.sectionGap}>
            <LVSectionHeader
              title={`Vehicles (${filteredVehicles.length})`}
              actionLabel="+ Add Vehicle"
              onAction={onOpenAdd}
            />
            {filteredVehicles.length === 0 ? (
              <LVCard style={styles.emptyCard}>
                <AnimatedIcon name="vehicle" size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No vehicles registered</Text>
              </LVCard>
            ) : (
              <View style={isGridView ? styles.gridWrap : undefined}>
                {filteredVehicles.map(v => (
                  <TouchableOpacity
                    key={v.id}
                    activeOpacity={0.85}
                    style={isGridView ? styles.gridItem : undefined}
                    onPress={() => setSelectedVehicle(v)}>
                    <LVCard style={[styles.creativeCard, { borderLeftColor: '#F59E0B' }]}>
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
                          <AnimatedIcon name="vehicle" size={20} color="#D97706" active />
                        </View>
                        <LVBadge label={v.vehicleType} variant="neutral" small />
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {v.name}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {v.registrationNumber} • {v.fuelType || 'Petrol'}
                      </Text>
                    </LVCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Assets Section */}
        {(activeCategory === 'all' || activeCategory === 'assets') && (
          <View style={styles.sectionGap}>
            <LVSectionHeader
              title={`Valued Assets (${filteredAssets.length})`}
              actionLabel="+ Add Asset"
              onAction={onOpenAdd}
            />
            {filteredAssets.length === 0 ? (
              <LVCard style={styles.emptyCard}>
                <AnimatedIcon name="asset" size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No assets added</Text>
              </LVCard>
            ) : (
              <View style={isGridView ? styles.gridWrap : undefined}>
                {filteredAssets.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    activeOpacity={0.85}
                    style={isGridView ? styles.gridItem : undefined}
                    onPress={() => setSelectedAsset(a)}>
                    <LVCard style={[styles.creativeCard, { borderLeftColor: '#8B5CF6' }]}>
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}>
                          <AnimatedIcon name="asset" size={20} color="#7C3AED" active />
                        </View>
                        {a.purchasePrice ? (
                          <Text style={[styles.amountBadge, { color: '#7C3AED' }]}>
                            ₹{a.purchasePrice}
                          </Text>
                        ) : (
                          <LVBadge label={a.category} variant="neutral" small />
                        )}
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {a.name}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {a.brand ? `${a.brand} • ` : ''}
                        {a.warrantyExpiryDate ? `Warranty: ${a.warrantyExpiryDate}` : a.category}
                      </Text>
                    </LVCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Detail Modals */}
      <DocumentDetailModal
        visible={Boolean(selectedDoc)}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
      <VehicleDetailModal
        visible={Boolean(selectedVehicle)}
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
      />
      <AssetDetailModal
        visible={Boolean(selectedAsset)}
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
    gap: spacing.base,
  },

  // Cybernetic Vault Banner
  cyberVaultBanner: {
    backgroundColor: '#0F172A',
    borderRadius: radii.cardLarge,
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    ...shadows.md,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  vaultIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  bannerStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
  },
  bannerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  bannerDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: spacing.md,
  },
  bannerQuickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statMiniCol: {
    alignItems: 'center',
  },
  statMiniNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  statMiniLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statMiniDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1E293B',
  },

  // Search & View Toggle
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewToggleBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.input,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // Filter Chips
  filterScroll: {
    marginHorizontal: -spacing.screenPadding,
  },
  filterContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.white,
  },

  sectionGap: {
    gap: spacing.sm,
  },

  // Creative Cards
  creativeCard: {
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 3,
  },
  amountBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },

  // Grid Layout
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: (width - spacing.screenPadding * 2 - spacing.sm) / 2,
  },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '500',
  },
});
