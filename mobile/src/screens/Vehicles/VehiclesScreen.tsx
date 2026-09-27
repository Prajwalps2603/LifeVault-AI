import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, shadows } from '../../theme';
import { LVCard, LVBadge, LVSectionHeader } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import type { Vehicle, Document, Expense } from '../../types';
import { DocumentDetailModal } from '../Vault/DocumentDetailModal';
import { ExpenseDetailModal } from '../Money/ExpenseDetailModal';
import { VehicleDetailModal } from './VehicleDetailModal';

const TABS = ['Overview', 'Documents', 'Service', 'Expenses'];

export const VehiclesScreen: React.FC = () => {
  const { state } = useAppStore();
  const { vehicles, documents, expenses } = state;

  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <Text style={styles.title}>My Vehicles</Text>
        </View>
        <View style={styles.emptyContainer}>
          <AnimatedIcon name="vehicle" size={44} active color={colors.primary} />
          <Text style={styles.emptyTitle}>No Vehicles Added</Text>
          <Text style={styles.emptySub}>
            Add a vehicle from the + Add menu to track fuel, service, and insurance.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const vehicle = vehicles[selectedVehicleIndex] || vehicles[0];

  // Linked records
  const vehicleDocs = documents.filter(
    d => d.relatedEntityId === vehicle.id ||
      (d.extractedData?.vehicleNumber && d.extractedData.vehicleNumber === vehicle.registrationNumber) ||
      (d.name.toLowerCase().includes(vehicle.registrationNumber.toLowerCase())),
  );

  const vehicleExpenses = expenses.filter(
    e => e.vehicleId === vehicle.id ||
      (e.category === 'PETROL' && e.title.includes(vehicle.registrationNumber)) ||
      (e.description && e.description.includes(vehicle.registrationNumber)),
  );

  const totalSpent = vehicleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Compliance docs
  const insuranceDoc = vehicleDocs.find(d => d.documentType === 'INSURANCE');
  const pucDoc = vehicleDocs.find(d => d.documentType === 'PUC');
  const regDoc = vehicleDocs.find(d => d.documentType === 'REGISTRATION');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vehicles</Text>
        {vehicles.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehiclePicker}>
            {vehicles.map((v, idx) => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.vehicleChip,
                  selectedVehicleIndex === idx && styles.vehicleChipActive,
                ]}
                onPress={() => setSelectedVehicleIndex(idx)}>
                <Text style={[
                  styles.vehicleChipText,
                  selectedVehicleIndex === idx && styles.vehicleChipTextActive,
                ]}>
                  {v.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.vehicleIconBig}>
              <AnimatedIcon name="vehicle" size={32} active color={colors.primary} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{vehicle.name}</Text>
              <Text style={styles.heroReg}>{vehicle.registrationNumber}</Text>
              <Text style={styles.heroColor}>{vehicle.color || 'Color not set'}</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{vehicle.year || '—'}</Text>
              <Text style={styles.heroStatLabel}>Year</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{vehicle.fuelType || 'Petrol'}</Text>
              <Text style={styles.heroStatLabel}>Fuel</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{formatCurrency(totalSpent)}</Text>
              <Text style={styles.heroStatLabel}>Total Spent</Text>
            </View>
          </View>
        </View>

        {/* Status pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusScroll}
          contentContainerStyle={styles.statusPills}>
          <View style={styles.statusPill}>
            <AnimatedIcon name="shield" size={18} active color={insuranceDoc ? colors.success : colors.warning} />
            <View>
              <Text style={styles.statusPillTitle}>Insurance</Text>
              <Text style={[styles.statusPillValue, { color: insuranceDoc ? colors.success : colors.warning }]}>
                {insuranceDoc ? (insuranceDoc.expiryDate ? `Exp: ${insuranceDoc.expiryDate}` : 'Active') : 'Not linked'}
              </Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <AnimatedIcon name="document" size={18} active color={pucDoc ? colors.success : colors.warning} />
            <View>
              <Text style={styles.statusPillTitle}>PUC</Text>
              <Text style={[styles.statusPillValue, { color: pucDoc ? colors.success : colors.warning }]}>
                {pucDoc ? (pucDoc.expiryDate ? `Exp: ${pucDoc.expiryDate}` : 'Active') : 'Not linked'}
              </Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <AnimatedIcon name="document" size={18} active color={regDoc ? colors.success : colors.textSecondary} />
            <View>
              <Text style={styles.statusPillTitle}>Registration</Text>
              <Text style={[styles.statusPillValue, { color: regDoc ? colors.success : colors.textSecondary }]}>
                {regDoc ? 'Valid' : 'No RC linked'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(i)}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <LVCard style={styles.overviewCard}>
            {[
              { label: 'Brand', value: vehicle.brand || '—' },
              { label: 'Model', value: vehicle.model ?? '—' },
              { label: 'Year', value: vehicle.year?.toString() ?? '—' },
              { label: 'Reg Number', value: vehicle.registrationNumber },
              { label: 'Color', value: vehicle.color ?? '—' },
              { label: 'Fuel Type', value: vehicle.fuelType ?? 'Petrol' },
              { label: 'Chassis No.', value: vehicle.chassisNumber ?? '—' },
              { label: 'Engine No.', value: vehicle.engineNumber ?? '—' },
            ].map((row, i) => (
              <View key={i}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
                {i < 7 && <View style={styles.detailSep} />}
              </View>
            ))}
          </LVCard>
        )}

        {/* Documents Tab */}
        {activeTab === 1 && (
          <View style={styles.tabContent}>
            {vehicleDocs.map(doc => (
              <TouchableOpacity
                key={doc.id}
                activeOpacity={0.8}
                onPress={() => setSelectedDoc(doc)}>
                <LVCard style={styles.docCard}>
                  <View style={styles.docRow}>
                    <View style={styles.docIconWrap}>
                      <AnimatedIcon
                        name={doc.documentType === 'INSURANCE' ? 'shield' : 'document'}
                        size={18}
                        active
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>{doc.name}</Text>
                      {doc.expiryDate && (
                        <Text style={styles.docExpiry}>Expires {formatDate(doc.expiryDate)}</Text>
                      )}
                    </View>
                    <LVBadge label="Organized" variant="success" small />
                  </View>
                </LVCard>
              </TouchableOpacity>
            ))}

            {vehicleDocs.length === 0 && (
              <LVCard style={{ padding: spacing.md, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  No documents linked to this vehicle.
                </Text>
              </LVCard>
            )}
          </View>
        )}

        {/* Service Tab */}
        {activeTab === 2 && (
          <LVCard style={styles.serviceCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs }}>
              <AnimatedIcon name="wrench" size={18} active color={colors.primary} />
              <Text style={styles.serviceTitle}>Routine Maintenance Schedule</Text>
            </View>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>Vehicle</Text>
              <Text style={styles.serviceValue}>{vehicle.name} ({vehicle.registrationNumber})</Text>
            </View>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>Next Scheduled Service</Text>
              <Text style={[styles.serviceValue, { color: colors.primary }]}>6 Months / 5,000 km</Text>
            </View>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>Engine Health</Text>
              <Text style={[styles.serviceValue, { color: colors.success }]}>Good Condition</Text>
            </View>
          </LVCard>
        )}

        {/* Expenses Tab */}
        {activeTab === 3 && (
          <View style={styles.tabContent}>
            <LVCard style={{ marginBottom: spacing.sm }}>
              <Text style={styles.expSummaryLabel}>Total Operating Cost</Text>
              <Text style={styles.expSummaryValue}>{formatCurrency(totalSpent)}</Text>
            </LVCard>

            {vehicleExpenses.map(exp => (
              <TouchableOpacity
                key={exp.id}
                activeOpacity={0.8}
                onPress={() => setSelectedExpense(exp)}>
                <LVCard style={styles.expCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expTitle}>{exp.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{exp.date}</Text>
                  </View>
                  <Text style={styles.expAmount}>{formatCurrency(exp.amount)}</Text>
                </LVCard>
              </TouchableOpacity>
            ))}

            {vehicleExpenses.length === 0 && (
              <LVCard style={{ padding: spacing.md, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  No fuel or service expenses recorded for this vehicle.
                </Text>
              </LVCard>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sub-modals */}
      <DocumentDetailModal
        visible={Boolean(selectedDoc)}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      <ExpenseDetailModal
        visible={Boolean(selectedExpense)}
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
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
  vehiclePicker: {
    marginTop: spacing.sm,
    flexDirection: 'row',
  },
  vehicleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  vehicleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vehicleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vehicleChipTextActive: {
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.base, gap: spacing.base },
  heroCard: {
    backgroundColor: colors.secondary,
    borderRadius: radii.cardLarge,
    padding: spacing.cardPaddingLarge,
    gap: spacing.base,
    ...shadows.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  vehicleIconBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleEmoji: { fontSize: 32 },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 22, fontWeight: '700', color: colors.white },
  heroReg: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '600' },
  heroColor: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 16, fontWeight: '700', color: colors.white },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  statusScroll: { marginHorizontal: -spacing.screenPadding },
  statusPills: { paddingHorizontal: spacing.screenPadding, gap: spacing.sm },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  statusPillIcon: { fontSize: 20 },
  statusPillTitle: { fontSize: 11, color: colors.textSecondary },
  statusPillValue: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  overviewCard: { padding: spacing.cardPadding },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  detailLabel: { fontSize: 13, color: colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  detailSep: { height: 1, backgroundColor: colors.borderLight },
  tabContent: { gap: spacing.sm },
  docCard: { padding: spacing.cardPadding },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  docIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  docExpiry: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  serviceCard: { padding: spacing.cardPadding, gap: spacing.md },
  serviceTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceLabel: { fontSize: 13, color: colors.textSecondary },
  serviceValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  expSummaryLabel: { fontSize: 12, color: colors.textSecondary },
  expSummaryValue: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  expCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.cardPadding,
    marginBottom: spacing.xs,
  },
  expTitle: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  expAmount: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
