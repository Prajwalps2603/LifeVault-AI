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
import type { DocumentType } from '../../types';
import { SAMPLE_PRESETS } from '../../services/ai/DocumentProcessingService';
import { AnimatedIcon, IconType } from '../../components/AnimatedIcon';

interface AddDocumentFormProps {
  visible: boolean;
  onClose: () => void;
}

const DOCUMENT_TYPES: { label: string; value: DocumentType; icon: IconType }[] = [
  { label: 'Insurance', value: 'INSURANCE', icon: 'shield' },
  { label: 'Invoice', value: 'INVOICE', icon: 'receipt' },
  { label: 'Warranty', value: 'WARRANTY', icon: 'shield' },
  { label: 'Registration', value: 'REGISTRATION', icon: 'file' },
  { label: 'PUC', value: 'PUC', icon: 'car' },
  { label: 'Service Record', value: 'SERVICE_RECORD', icon: 'wrench' },
  { label: 'Identity', value: 'IDENTITY', icon: 'shield' },
  { label: 'Medical', value: 'MEDICAL', icon: 'file' },
  { label: 'Contract', value: 'CONTRACT', icon: 'file' },
  { label: 'Other', value: 'OTHER', icon: 'folder' },
];

export const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ visible, onClose }) => {
  const { addDocument } = useAppStore();
  const [name, setName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('INSURANCE');
  const [expiryDate, setExpiryDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setDocType('INSURANCE');
    setExpiryDate('');
    setIssueDate('');
    setNotes('');
  };

  const applyPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const { presetData } = preset;
    setName(presetData.title);
    setDocType(presetData.detectedType);
    if (presetData.expiryDate) setExpiryDate(presetData.expiryDate);
    if (presetData.date) setIssueDate(presetData.date);
    const metaNote = [
      presetData.policyOrInvoiceNumber ? `Ref: ${presetData.policyOrInvoiceNumber}` : null,
      presetData.merchantOrProvider ? `Provider: ${presetData.merchantOrProvider}` : null,
      presetData.relatedVehicleNumber ? `Vehicle: ${presetData.relatedVehicleNumber}` : null,
    ].filter(Boolean).join(' • ');
    setNotes(metaNote || 'Imported via LifeVault AI Recognition');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a document title.');
      return;
    }

    try {
      setLoading(true);
      await addDocument({
        type: 'DOCUMENT',
        name: name.trim(),
        fileName: `${name.trim().toLowerCase().replace(/\s+/g, '_')}.pdf`,
        mimeType: 'application/pdf',
        documentType: docType,
        status: 'ORGANIZED',
        expiryDate: expiryDate.trim() || undefined,
        issueDate: issueDate.trim() || undefined,
        notes: notes.trim() || undefined,
        userId: 'current-user',
        syncStatus: 'LOCAL_ONLY',
        version: 1,
      });

      resetForm();
      onClose();
      Alert.alert('Success', 'Document has been safely added to your vault.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save document.');
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
            <Text style={styles.headerTitle}>Add Document</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Quick AI Fill Banner */}
            <View style={styles.aiBanner}>
              <View style={styles.aiBannerHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AnimatedIcon name="lightning" size={16} color={colors.warning} active />
                  <Text style={[styles.aiBannerTitle, { marginLeft: 6 }]}>AI Extraction Presets</Text>
                </View>
                <Text style={styles.aiBannerDesc}>Simulate scanning & instant OCR auto-fill</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiPresetsScroll}>
                <TouchableOpacity
                  style={styles.aiPresetChip}
                  onPress={() => applyPreset('insurance')}
                  activeOpacity={0.7}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AnimatedIcon name="shield" size={13} color={colors.primary} />
                    <Text style={[styles.aiPresetText, { marginLeft: 5 }]}>Car Insurance</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aiPresetChip}
                  onPress={() => applyPreset('puc_certificate')}
                  activeOpacity={0.7}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AnimatedIcon name="car" size={13} color={colors.primary} />
                    <Text style={[styles.aiPresetText, { marginLeft: 5 }]}>PUC Certificate</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aiPresetChip}
                  onPress={() => applyPreset('electronics_invoice')}
                  activeOpacity={0.7}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AnimatedIcon name="file" size={13} color={colors.primary} />
                    <Text style={[styles.aiPresetText, { marginLeft: 5 }]}>Tech Invoice</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Document Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Car Insurance Policy 2026"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Type selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Document Type</Text>
              <View style={styles.chipsContainer}>
                {DOCUMENT_TYPES.map(item => {
                  const selected = docType === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setDocType(item.value)}
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

            {/* Expiry Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Expiry Date (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (e.g. 2027-03-31)"
                placeholderTextColor={colors.textTertiary}
                value={expiryDate}
                onChangeText={setExpiryDate}
              />
            </View>

            {/* Issue Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Issue Date (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (e.g. 2026-03-01)"
                placeholderTextColor={colors.textTertiary}
                value={issueDate}
                onChangeText={setIssueDate}
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes / Policy Number (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Policy #POL-89021, Insurer: HDFC ERGO"
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.actions}>
              <LVButton
                title={loading ? 'Saving...' : 'Save Document'}
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
    height: 80,
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
  aiBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: spacing.sm,
  },
  aiBannerHeader: {
    gap: 2,
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  aiBannerDesc: {
    fontSize: 11,
    color: '#3B82F6',
  },
  aiPresetsScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  aiPresetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  aiPresetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
});
