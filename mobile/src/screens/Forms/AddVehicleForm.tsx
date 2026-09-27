import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { useAppStore } from '../../store/AppContext';
import { LVButton } from '../../components/LVButton';
import { AnimatedIcon, IconType } from '../../components/AnimatedIcon';
import type { VehicleType } from '../../types';

interface AddVehicleFormProps {
  visible: boolean;
  onClose: () => void;
}

const VEHICLE_TYPES: { label: string; value: VehicleType; icon: IconType }[] = [
  { label: 'Car', value: 'CAR', icon: 'vehicle' },
  { label: 'Motorcycle', value: 'BIKE', icon: 'vehicle' },
  { label: 'Scooter', value: 'SCOOTER', icon: 'vehicle' },
  { label: 'Truck / Commercial', value: 'TRUCK', icon: 'vehicle' },
  { label: 'Other', value: 'OTHER', icon: 'vehicle' },
];

export const AddVehicleForm: React.FC<AddVehicleFormProps> = ({ visible, onClose }) => {
  const { addVehicle } = useAppStore();
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setVehicleType('CAR');
    setBrand('');
    setModel('');
    setRegistrationNumber('');
    setYear('');
    setFuelType('Petrol');
    setColor('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a vehicle name (e.g. "My Car" or "Honda City").');
      return;
    }

    if (!registrationNumber.trim()) {
      Alert.alert('Required', 'Please enter registration / number plate.');
      return;
    }

    const parsedYear = year.trim() ? parseInt(year.trim(), 10) : undefined;

    try {
      setLoading(true);
      await addVehicle({
        type: 'VEHICLE',
        name: name.trim(),
        vehicleType,
        brand: brand.trim() || 'General',
        model: model.trim() || undefined,
        registrationNumber: registrationNumber.trim().toUpperCase(),
        year: parsedYear,
        fuelType,
        color: color.trim() || undefined,
        notes: notes.trim() || undefined,
        userId: 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      resetForm();
      onClose();
      Alert.alert('Success', 'Vehicle added to your garage.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save vehicle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Vehicle</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Vehicle Type Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.chipsContainer}>
                {VEHICLE_TYPES.map(item => {
                  const selected = vehicleType === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setVehicleType(item.value)}
                      activeOpacity={0.7}>
                      <AnimatedIcon
                        name={item.icon}
                        size={15}
                        color={selected ? colors.primary : colors.textSecondary}
                        active={selected}
                      />
                      <Text style={[styles.chipText, selected && styles.chipTextSelected, { marginLeft: 6 }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Vehicle Nickname */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Vehicle Name / Nickname *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Honda City ZX, Royal Enfield Hunter"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Registration Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Registration Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. MH 02 CE 1234, DL 10 AB 5678"
                placeholderTextColor={colors.textTertiary}
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                autoCapitalize="characters"
              />
            </View>

            {/* Brand & Model in Row */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Brand</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Hyundai"
                  placeholderTextColor={colors.textTertiary}
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Model</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Creta SX"
                  placeholderTextColor={colors.textTertiary}
                  value={model}
                  onChangeText={setModel}
                />
              </View>
            </View>

            {/* Year & Fuel in Row */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2023"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={year}
                  onChangeText={setYear}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fuel Type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Petrol / Diesel / EV"
                  placeholderTextColor={colors.textTertiary}
                  value={fuelType}
                  onChangeText={setFuelType}
                />
              </View>
            </View>

            {/* Color */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Color (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Polar White, Phantom Black"
                placeholderTextColor={colors.textTertiary}
                value={color}
                onChangeText={setColor}
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Insurance agent contact, chassis number, etc."
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.actions}>
              <LVButton
                title={loading ? 'Saving...' : 'Save Vehicle'}
                onPress={handleSave}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  actions: {
    marginTop: spacing.md,
  },
});
