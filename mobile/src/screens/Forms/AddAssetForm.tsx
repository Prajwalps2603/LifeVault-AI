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
import type { AssetCategory } from '../../types';

interface AddAssetFormProps {
  visible: boolean;
  onClose: () => void;
}

const ASSET_CATEGORIES: { label: string; value: AssetCategory; icon: IconType }[] = [
  { label: 'Electronics', value: 'ELECTRONICS', icon: 'file' },
  { label: 'Appliance', value: 'APPLIANCE', icon: 'wrench' },
  { label: 'Furniture', value: 'FURNITURE', icon: 'folder' },
  { label: 'Jewellery', value: 'JEWELLERY', icon: 'shield' },
  { label: 'Property', value: 'PROPERTY', icon: 'folder' },
  { label: 'Other', value: 'OTHER', icon: 'file' },
];

export const AddAssetForm: React.FC<AddAssetFormProps> = ({ visible, onClose }) => {
  const { addAsset } = useAppStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('ELECTRONICS');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setCategory('ELECTRONICS');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setPurchaseDate('');
    setPurchasePrice('');
    setWarrantyExpiryDate('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an asset name (e.g. "MacBook Pro", "Sony TV").');
      return;
    }

    const price = purchasePrice.trim() ? parseFloat(purchasePrice.trim()) : undefined;

    try {
      setLoading(true);
      await addAsset({
        type: 'ASSET',
        name: name.trim(),
        category,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        purchaseDate: purchaseDate.trim() || undefined,
        purchasePrice: price,
        currency: '₹',
        warrantyExpiryDate: warrantyExpiryDate.trim() || undefined,
        notes: notes.trim() || undefined,
        userId: 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      resetForm();
      onClose();
      Alert.alert('Success', 'Asset saved to your vault.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save asset.');
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
            <Text style={styles.headerTitle}>Add Asset / Item</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Category selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipsContainer}>
                {ASSET_CATEGORIES.map(item => {
                  const selected = category === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setCategory(item.value)}
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

            {/* Asset Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Asset / Product Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. MacBook Pro 16, Samsung OLED TV"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Brand & Model in Row */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Brand</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Apple, Sony"
                  placeholderTextColor={colors.textTertiary}
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Model</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. A2485, Bravia XR"
                  placeholderTextColor={colors.textTertiary}
                  value={model}
                  onChangeText={setModel}
                />
              </View>
            </View>

            {/* Price & Serial in Row */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Purchase Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 149999"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Serial Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="SN / IMEI"
                  placeholderTextColor={colors.textTertiary}
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                />
              </View>
            </View>

            {/* Purchase Date & Warranty Expiry in Row */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Purchase Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  value={purchaseDate}
                  onChangeText={setPurchaseDate}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Warranty Expiry</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  value={warrantyExpiryDate}
                  onChangeText={setWarrantyExpiryDate}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Purchased from Croma, Invoice in email, AppleCare status..."
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.actions}>
              <LVButton
                title={loading ? 'Saving...' : 'Save Asset'}
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
