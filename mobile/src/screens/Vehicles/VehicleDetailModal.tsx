/**
 * VehicleDetailModal — Complete vehicle management with record relationships.
 *
 * Implements Section 82 (Phase 7):
 * - Vehicle specs & identity (Reg number, fuel, color, model)
 * - Insurance & PUC validity tracking
 * - Related documents (Insurance policy, RC, PUC, Service records)
 * - Related expenses (Fuel, maintenance, repairs)
 * - Quick actions: Log fuel, link document, schedule service reminder, delete
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { LVButton, LVBadge, LVCard, LVDivider, LVSectionHeader } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import type { Vehicle, Document, Expense } from '../../types';
import { DocumentDetailModal } from '../Vault/DocumentDetailModal';
import { ExpenseDetailModal } from '../Money/ExpenseDetailModal';
import { SetReminderTimingModal } from '../Vault/SetReminderTimingModal';

interface VehicleDetailModalProps {
  visible: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}

const TABS = ['Overview', 'Documents', 'Expenses'];

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  visible,
  vehicle,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [reminderTimingOpen, setReminderTimingOpen] = useState(false);

  const { state, deleteVehicle, addReminder, addExpense } = useAppStore();
  const { documents, expenses } = state;

  if (!vehicle) return null;

  // Filter linked documents & expenses
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

  // Detect Insurance & PUC documents
  const insuranceDoc = vehicleDocs.find(d => d.documentType === 'INSURANCE');
  const pucDoc = vehicleDocs.find(d => d.documentType === 'PUC');

  const handleDelete = () => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to remove "${vehicle.name}" from your vault?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete vehicle');
            }
          },
        },
      ],
    );
  };

  const handleQuickAddFuel = async () => {
    Alert.prompt
      ? Alert.prompt(
          'Log Fuel Refill',
          `Enter fuel amount spent for ${vehicle.name}:`,
          async text => {
            const amount = parseFloat(text);
            if (!isNaN(amount) && amount > 0) {
              await addExpense({
                type: 'EXPENSE',
                title: `Fuel Refill (${vehicle.name})`,
                amount,
                currency: '₹',
                date: new Date().toISOString().split('T')[0],
                category: 'PETROL',
                vehicleId: vehicle.id,
                description: `Fuel refill for registration ${vehicle.registrationNumber}`,
                userId: 'current-user',
                syncStatus: 'LOCAL_ONLY',
                version: 1,
              });
              Alert.alert('Logged', 'Fuel expense recorded.');
            }
          },
          'plain-text',
          '2000',
          'numeric',
        )
      : (async () => {
          await addExpense({
            type: 'EXPENSE',
            title: `Fuel Refill (${vehicle.name})`,
            amount: 2500,
            currency: '₹',
            date: new Date().toISOString().split('T')[0],
            category: 'PETROL',
            vehicleId: vehicle.id,
            description: `Fuel refill for registration ${vehicle.registrationNumber}`,
            userId: 'current-user',
            syncStatus: 'LOCAL_ONLY',
            version: 1,
          });
          Alert.alert('Logged', `Logged ₹2,500 fuel refill for ${vehicle.name}.`);
        })();
  };

  const handleScheduleServiceReminder = async () => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 6);
    const dueDateStr = nextDate.toISOString().split('T')[0];

    try {
      await addReminder({
        type: 'REMINDER',
        title: `Service Due: ${vehicle.name}`,
        dueDate: dueDateStr,
        reminderDates: [dueDateStr],
        time: '09:00',
        frequency: 'MONTHLY',
        isCompleted: false,
        description: `Routine scheduled servicing for ${vehicle.registrationNumber}`,
        relatedEntityId: vehicle.id,
        relatedEntityType: 'VEHICLE',
        userId: 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      Alert.alert('Reminder Set', `Periodic servicing alert scheduled for ${dueDateStr}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create reminder');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Details</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabBar}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(idx)}
              style={[styles.tab, activeTab === idx && styles.tabActive]}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Vehicle Hero Card */}
          <LVCard style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.vehicleIcon}>
                <AnimatedIcon name="vehicle" size={32} active color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{vehicle.name}</Text>
                <Text style={styles.heroReg}>{vehicle.registrationNumber}</Text>
                <Text style={styles.heroSub}>
                  {vehicle.brand || 'Vehicle'} {vehicle.model ? `• ${vehicle.model}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Fuel Type</Text>
                <Text style={styles.statVal}>{vehicle.fuelType || 'Petrol'}</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Year</Text>
                <Text style={styles.statVal}>{vehicle.year || '—'}</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={styles.statVal}>{formatCurrency(totalSpent)}</Text>
              </View>
            </View>
          </LVCard>

          {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
          {activeTab === 0 && (
            <View style={{ gap: spacing.base }}>
              {/* Compliance Pills (Insurance & PUC) */}
              <View style={styles.complianceRow}>
                <View style={styles.complianceCard}>
                  <AnimatedIcon name="shield" size={18} active color={insuranceDoc ? colors.success : colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.complianceTitle}>Insurance</Text>
                    <Text style={[styles.complianceSub, { color: insuranceDoc ? colors.success : colors.warning }]}>
                      {insuranceDoc ? (insuranceDoc.expiryDate ? `Exp: ${insuranceDoc.expiryDate}` : 'Active') : 'Not linked'}
                    </Text>
                  </View>
                </View>

                <View style={styles.complianceCard}>
                  <AnimatedIcon name="document" size={18} active color={pucDoc ? colors.success : colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.complianceTitle}>PUC</Text>
                    <Text style={[styles.complianceSub, { color: pucDoc ? colors.success : colors.warning }]}>
                      {pucDoc ? (pucDoc.expiryDate ? `Exp: ${pucDoc.expiryDate}` : 'Active') : 'Not linked'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Specifications Card */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>VEHICLE SPECIFICATIONS</Text>
                <LVCard style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Registration No.</Text>
                    <Text style={styles.infoValue}>{vehicle.registrationNumber}</Text>
                  </View>
                  <LVDivider style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>{vehicle.vehicleType}</Text>
                  </View>
                  <LVDivider style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Color</Text>
                    <Text style={styles.infoValue}>{vehicle.color || '—'}</Text>
                  </View>
                  <LVDivider style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Chassis / VIN</Text>
                    <Text style={styles.infoValue}>{vehicle.chassisNumber || '—'}</Text>
                  </View>
                  <LVDivider style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Engine Number</Text>
                    <Text style={styles.infoValue}>{vehicle.engineNumber || '—'}</Text>
                  </View>
                </LVCard>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActionsStack}>
                <TouchableOpacity
                  style={styles.fuelBtn}
                  onPress={handleQuickAddFuel}
                  activeOpacity={0.8}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <AnimatedIcon name="fuel" size={16} active color={colors.warning} />
                    <Text style={styles.fuelBtnText}>+ Quick Log Fuel Refill</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serviceBtn}
                  onPress={() => setReminderTimingOpen(true)}
                  activeOpacity={0.8}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <AnimatedIcon name="calendar" size={16} active color={colors.primary} />
                    <Text style={styles.serviceBtnText}>Set Service Reminder</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── DOCUMENTS TAB ───────────────────────────────────────── */}
          {activeTab === 1 && (
            <View style={styles.section}>
              <LVSectionHeader title={`Related Documents (${vehicleDocs.length})`} />
              {vehicleDocs.map(doc => (
                <TouchableOpacity
                  key={doc.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDoc(doc)}>
                  <LVCard style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <View style={[styles.itemIcon, { backgroundColor: colors.primaryLight }]}>
                        <AnimatedIcon
                          name={doc.documentType === 'INSURANCE' ? 'shield' : 'document'}
                          size={16}
                          active
                          color={colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{doc.name}</Text>
                        <Text style={styles.itemSub}>
                          {doc.documentType} {doc.expiryDate ? `• Exp: ${doc.expiryDate}` : ''}
                        </Text>
                      </View>
                      <LVBadge label="View" variant="primary" small />
                    </View>
                  </LVCard>
                </TouchableOpacity>
              ))}

              {vehicleDocs.length === 0 && (
                <LVCard style={{ padding: spacing.lg, alignItems: 'center' }}>
                  <AnimatedIcon name="document" size={28} active color={colors.primary} />
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14, marginTop: 4 }}>
                    No Documents Linked
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: 'center' }}>
                    Upload Insurance, PUC, or RC via the + Add menu to link with this vehicle.
                  </Text>
                </LVCard>
              )}
            </View>
          )}

          {/* ── EXPENSES TAB ────────────────────────────────────────── */}
          {activeTab === 2 && (
            <View style={styles.section}>
              <View style={styles.expenseSummaryRow}>
                <Text style={styles.sectionTitle}>MAINTENANCE & FUEL ({vehicleExpenses.length})</Text>
                <Text style={styles.totalSpentText}>Total: {formatCurrency(totalSpent)}</Text>
              </View>

              {vehicleExpenses.map(expense => (
                <TouchableOpacity
                  key={expense.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedExpense(expense)}>
                  <LVCard style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <View style={[styles.itemIcon, { backgroundColor: colors.warningLight }]}>
                        <AnimatedIcon name="fuel" size={16} active color={colors.warning} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{expense.title}</Text>
                        <Text style={styles.itemSub}>{expense.date}</Text>
                      </View>
                      <Text style={styles.itemAmount}>{formatCurrency(expense.amount)}</Text>
                    </View>
                  </LVCard>
                </TouchableOpacity>
              ))}

              {vehicleExpenses.length === 0 && (
                <LVCard style={{ padding: spacing.lg, alignItems: 'center' }}>
                  <AnimatedIcon name="money" size={28} active color={colors.primary} />
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14, marginTop: 4 }}>
                    No Expenses Recorded
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    Log fuel or servicing to monitor vehicle operating costs.
                  </Text>
                </LVCard>
              )}
            </View>
          )}

          {/* Delete Action */}
          <View style={{ marginTop: spacing.lg }}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <Text style={styles.deleteBtnText}>Delete Vehicle</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Sub-modals for linked records */}
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

      <SetReminderTimingModal
        visible={reminderTimingOpen}
        reminderData={{
          title: `Service: ${vehicle.name}`,
          dueDate: (() => {
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 6);
            return nextDate.toISOString().split('T')[0];
          })(),
          description: `Routine scheduled servicing for ${vehicle.name} (${vehicle.registrationNumber}).`,
        }}
        onClose={() => setReminderTimingOpen(false)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
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
  scrollContent: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  heroCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  vehicleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleEmoji: {
    fontSize: 26,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  heroReg: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  heroSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  statDiv: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },
  complianceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  complianceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  complianceEmoji: {
    fontSize: 20,
  },
  complianceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  complianceSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  infoCard: {
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.xs,
  },
  quickActionsStack: {
    gap: spacing.sm,
  },
  fuelBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  fuelBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  serviceBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  serviceBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expenseSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  totalSpentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
