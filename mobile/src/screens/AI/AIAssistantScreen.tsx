/**
 * AIAssistantScreen — Conversational assistant with full LifeVault context and natural language actions.
 *
 * Implements Section 83 (Phase 8):
 * - Live reasoning over actual stored documents, expenses, payments, vehicles, assets, reminders
 * - Natural Language Action execution (auto-logging expenses, scheduling reminders)
 * - Dynamic suggested queries based on user data
 * - Instant follow-up buttons
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radii, shadows } from '../../theme';
import { LVCard, LVBadge } from '../../components';
import { AnimatedIcon } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';
import {
  AIAssistantService,
  AIResponse,
  AIActionPayload,
} from '../../services/ai/AIAssistantService';
import { formatCurrency } from '../../utils/helpers';
import { PhoneCalendarService } from '../../services/calendar/PhoneCalendarService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: AIActionPayload;
  actionExecuted?: boolean;
  suggestedFollowUps?: string[];
  timestamp: Date;
}

interface AIAssistantScreenProps {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_SUGGESTIONS = [
  'When does my car insurance expire?',
  'How much did I spend on groceries?',
  'What bills are due soon?',
  'Log fuel 2500 for car',
  'What is my vehicle registration number?',
];

export const AIAssistantScreen: React.FC<AIAssistantScreenProps> = ({
  visible,
  onClose,
}) => {
  const { state, addExpense, addReminder } = useAppStore();
  const { documents, expenses, payments, vehicles, assets, reminders } = state;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: `Hi! I'm your LifeVault Assistant.\n\nI have indexed your ${documents.length} documents, ${expenses.length} expenses, ${payments.length} bills, and ${vehicles.length} vehicles.\n\nAsk me anything or tell me to log an expense or set a reminder.`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    Keyboard.dismiss();

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Run AI Query against live vault context
    try {
      const response: AIResponse = await AIAssistantService.processQuery(text, {
        documents,
        expenses,
        payments,
        vehicles,
        assets,
        reminders,
      });

      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.text,
        action: response.action,
        suggestedFollowUps: response.suggestedFollowUps,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue querying your vault. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleExecuteAction = async (msgId: string, action: AIActionPayload) => {
    try {
      if (action.type === 'ADD_EXPENSE') {
        await addExpense({
          type: 'EXPENSE',
          title: action.title,
          amount: action.amount || 0,
          currency: '₹',
          date: action.date || new Date().toISOString().split('T')[0],
          category: (action.category as any) || 'OTHER',
          description: action.description,
          userId: 'current-user',
          syncStatus: 'LOCAL_ONLY',
          version: 1,
        });

        Alert.alert('Success', `Expense of ${formatCurrency(action.amount || 0)} recorded.`);
      } else if (action.type === 'ADD_REMINDER') {
        await addReminder({
          type: 'REMINDER',
          title: action.title,
          dueDate: action.date || new Date().toISOString().split('T')[0],
          reminderDates: [action.date || new Date().toISOString().split('T')[0]],
          time: '09:00',
          frequency: 'ONCE',
          isCompleted: false,
          description: action.description,
          userId: 'current-user',
          syncStatus: 'LOCAL_ONLY',
          version: 1,
        });

        await PhoneCalendarService.addToPhoneCalendar({
          title: action.title,
          description: action.description || `LifeVault reminder for ${action.title}`,
          date: action.date || new Date().toISOString().split('T')[0],
          time: '09:00',
        });

        Alert.alert('Success', `Reminder "${action.title}" scheduled and saved to your Phone Calendar.`);
      }

      // Mark action executed
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, actionExecuted: true } : m)),
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to execute action');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIconBg}>
              <AnimatedIcon name="sparkle" size={20} active color={colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>LifeVault AI</Text>
              <Text style={styles.headerSub}>Active Context: Full Vault</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Suggestion Chips */}
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {DEFAULT_SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => sendMessage(s)}
                activeOpacity={0.7}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}>
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}>
              {msg.role === 'assistant' && (
                <View style={styles.aiAvatar}>
                  <AnimatedIcon name="sparkle" size={14} active color={colors.primary} />
                </View>
              )}
              <View style={styles.messageContentWrap}>
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userText : styles.aiText,
                  ]}>
                  {msg.content}
                </Text>

                {/* Natural Language Action Card */}
                {msg.action && (
                  <View style={styles.actionCard}>
                    <View style={styles.actionHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <AnimatedIcon name="lightning" size={14} active color={colors.warning} />
                        <Text style={styles.actionTitle}>Action Suggested</Text>
                      </View>
                      <LVBadge
                        label={msg.actionExecuted ? 'Done' : 'Action Ready'}
                        variant={msg.actionExecuted ? 'success' : 'primary'}
                        small
                      />
                    </View>
                    <Text style={styles.actionSub}>
                      {msg.action.type === 'ADD_EXPENSE'
                        ? `Add Expense: ${msg.action.title} (${formatCurrency(msg.action.amount || 0)})`
                        : `Set Reminder: ${msg.action.title} on ${msg.action.date}`}
                    </Text>
                    {!msg.actionExecuted && (
                      <TouchableOpacity
                        style={styles.executeBtn}
                        onPress={() => handleExecuteAction(msg.id, msg.action!)}
                        activeOpacity={0.8}>
                        <Text style={styles.executeBtnText}>Execute Action</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Follow up suggestions */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <View style={styles.followUpsWrap}>
                    {msg.suggestedFollowUps.map(f => (
                      <TouchableOpacity
                        key={f}
                        style={styles.followUpChip}
                        onPress={() => sendMessage(f)}
                        activeOpacity={0.7}>
                        <Text style={styles.followUpText}>↳ {f}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.aiAvatar}>
                <AnimatedIcon name="sparkle" size={14} active color={colors.primary} />
              </View>
              <View style={styles.typingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>Searching your vault...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything or record an expense..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => sendMessage(inputText)}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              activeOpacity={0.8}>
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIcon: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  suggestionsContainer: {
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  suggestionsScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  suggestionChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: '90%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    borderBottomRightRadius: 4,
    padding: spacing.md,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderBottomLeftRadius: 4,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiAvatarText: {
    fontSize: 12,
  },
  messageContentWrap: {
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: colors.white,
    fontWeight: '500',
  },
  aiText: {
    color: colors.textPrimary,
  },

  actionCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#EFF6FF',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: spacing.xs,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  actionSub: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  executeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    marginTop: 4,
  },
  executeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  followUpsWrap: {
    marginTop: spacing.sm,
    gap: 4,
  },
  followUpChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  followUpText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },

  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.full,
    paddingHorizontal: spacing.base,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
  },
  sendBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
