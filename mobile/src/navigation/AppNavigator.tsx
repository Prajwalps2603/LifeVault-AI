import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { LoginScreen } from '../screens/Login/LoginScreen';
import { TodayScreen } from '../screens/Today/TodayScreen';
import { VaultScreen } from '../screens/Vault/VaultScreen';
import { MoneyScreen } from '../screens/Money/MoneyScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
// Phase 2+: RemindersScreen, VehiclesScreen, AssetsScreen will be added to navigation
import { AIAssistantScreen } from '../screens/AI/AIAssistantScreen';
import { AddMenu } from '../screens/AddMenu/AddMenu';

// Phase 2 Forms
import {
  AddDocumentForm,
  AddExpenseForm,
  AddPaymentForm,
  AddVehicleForm,
  AddAssetForm,
  AddReminderForm,
} from '../screens/Forms';
import { ReceiptScanModal } from '../screens/Scan/ReceiptScanModal';
import { GlobalSearchModal } from '../screens/Search/GlobalSearchModal';

// Theme
import { colors, spacing, radii, shadows } from '../theme';

// ─── Navigation Types ─────────────────────────────────────────────────────────

type AppScreen =
  | 'Splash'
  | 'Login'
  | 'Today'
  | 'Vault'
  | 'Money'
  | 'Profile';

type BottomTab = 'Today' | 'Vault' | 'Money' | 'Profile';
type ActiveFormType =
  | 'document'
  | 'expense'
  | 'payment'
  | 'vehicle'
  | 'asset'
  | 'reminder'
  | 'receipt'
  | null;

import { AnimatedIcon, type IconType } from '../components/AnimatedIcon';
import { FirstTimePermissionsModal } from '../components/FirstTimePermissionsModal';
import { StorageService } from '../services/storage/StorageService';

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────

interface TabBarProps {
  activeTab: BottomTab;
  onTabPress: (tab: BottomTab) => void;
  onAddPress: () => void;
}

const TAB_CONFIG: Array<{ id: BottomTab; icon: IconType; label: string }> = [
  { id: 'Today', icon: 'today', label: 'Today' },
  { id: 'Vault', icon: 'vault', label: 'Vault' },
  { id: 'Money', icon: 'money', label: 'Money' },
  { id: 'Profile', icon: 'profile', label: 'Profile' },
];

const BottomTabBar: React.FC<TabBarProps> = ({ activeTab, onTabPress, onAddPress }) => {
  return (
    <View style={tabStyles.container}>
      {/* Left tabs: Today, Vault */}
      <View style={tabStyles.side}>
        {TAB_CONFIG.slice(0, 2).map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={tabStyles.tab}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.8}>
              <AnimatedIcon
                name={tab.icon}
                size={22}
                active={isActive}
                color={isActive ? colors.primary : colors.textTertiary}
              />
              <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={tabStyles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Center FAB */}
      <TouchableOpacity
        style={tabStyles.fab}
        onPress={onAddPress}
        activeOpacity={0.85}>
        <Text style={tabStyles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Right tabs: Money, Profile */}
      <View style={tabStyles.side}>
        {TAB_CONFIG.slice(2, 4).map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={tabStyles.tab}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.8}>
              <AnimatedIcon
                name={tab.icon}
                size={22}
                active={isActive}
                color={isActive ? colors.primary : colors.textTertiary}
              />
              <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={tabStyles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.md,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.4,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textTertiary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  // FAB
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...shadows.fab,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  fabText: {
    fontSize: 30,
    color: colors.white,
    fontWeight: '300',
    lineHeight: 36,
  },
});

// ─── Main App ─────────────────────────────────────────────────────────────────

export const AppNavigator: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('Splash');
  const [activeTab, setActiveTab] = useState<BottomTab>('Today');
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [activeForm, setActiveForm] = useState<ActiveFormType>(null);
  const [showPermissionsPrompt, setShowPermissionsPrompt] = useState(false);

  const isMainScreen = screen !== 'Splash' && screen !== 'Login';

  React.useEffect(() => {
    StorageService.getFlag('permissions_prompt_completed').then(done => {
      if (!done) {
        setShowPermissionsPrompt(true);
      }
    });
  }, []);

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'Today':
        return (
          <TodayScreen
            onOpenAdd={() => setShowAdd(true)}
            onOpenAI={() => setShowAI(true)}
            onOpenSearch={() => setShowSearch(true)}
          />
        );
      case 'Vault':
        return <VaultScreen onOpenAdd={() => setShowAdd(true)} />;
      case 'Money':
        return <MoneyScreen onOpenAdd={() => setShowAdd(true)} />;
      case 'Profile':
        return <ProfileScreen onSignOut={() => setScreen('Login')} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        {/* Splash */}
        {screen === 'Splash' && (
          <SplashScreen onFinish={() => setScreen('Login')} />
        )}

        {/* Login */}
        {screen === 'Login' && (
          <LoginScreen onLogin={() => setScreen('Today')} />
        )}

        {/* Main App with bottom navigation */}
        {isMainScreen && (
          <View style={{ flex: 1 }}>
            {renderCurrentTab()}
            <BottomTabBar
              activeTab={activeTab}
              onTabPress={setActiveTab}
              onAddPress={() => setShowAdd(true)}
            />
          </View>
        )}

        {/* Global Modals */}
        <AddMenu
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onSelectOption={type => setActiveForm(type as ActiveFormType)}
        />
        <AIAssistantScreen visible={showAI} onClose={() => setShowAI(false)} />

        {/* Phase 2 Forms */}
        <AddDocumentForm
          visible={activeForm === 'document'}
          onClose={() => setActiveForm(null)}
        />
        <AddExpenseForm
          visible={activeForm === 'expense'}
          onClose={() => setActiveForm(null)}
        />
        <AddPaymentForm
          visible={activeForm === 'payment'}
          onClose={() => setActiveForm(null)}
        />
        <AddVehicleForm
          visible={activeForm === 'vehicle'}
          onClose={() => setActiveForm(null)}
        />
        <AddAssetForm
          visible={activeForm === 'asset'}
          onClose={() => setActiveForm(null)}
        />
        <AddReminderForm
          visible={activeForm === 'reminder'}
          onClose={() => setActiveForm(null)}
        />
        <ReceiptScanModal
          visible={activeForm === 'receipt'}
          onClose={() => setActiveForm(null)}
        />
        <GlobalSearchModal
          visible={showSearch}
          onClose={() => setShowSearch(false)}
        />

        {/* First-Time Permissions Request (Drive, Sheets & Notifications) */}
        <FirstTimePermissionsModal
          visible={showPermissionsPrompt && isMainScreen}
          onComplete={() => setShowPermissionsPrompt(false)}
        />
      </View>
    </SafeAreaProvider>
  );
};
