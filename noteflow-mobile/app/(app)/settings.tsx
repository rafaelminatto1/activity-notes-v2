import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/hooks/useTheme';
import { signOutUser } from '@/lib/firebase/auth';
import { updateUserProfile } from '@/lib/firebase/firestore';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { profile, user, setProfile } = useAuthStore();
  const [aiEnabled, setAiEnabled] = useState(profile?.settings?.aiEnabled ?? true);

  const currentTheme = profile?.settings?.theme || 'system';

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    if (!user?.uid || !profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = { ...profile.settings, theme };
    setProfile({ ...profile, settings: newSettings });
    await updateUserProfile(user.uid, { settings: newSettings } as any);
  };

  const handleToggleAI = async (value: boolean) => {
    if (!user?.uid || !profile) return;
    setAiEnabled(value);
    const newSettings = { ...profile.settings, aiEnabled: value };
    setProfile({ ...profile, settings: newSettings });
    await updateUserProfile(user.uid, { settings: newSettings } as any);
  };

  const handleSignOut = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOutUser();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    right,
    color,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    right?: React.ReactNode;
    color?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !right}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: (color || colors.primary) + '15',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon as any} size={20} color={color || colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right || (onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />)}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>
          Configurações
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: 20,
            marginBottom: 24,
            padding: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 22 }}>
              {(profile?.displayName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
              {profile?.displayName || 'Usuário'}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>
              {profile?.email || user?.email || ''}
            </Text>
          </View>
        </View>

        {/* Theme */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            Aparência
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <TouchableOpacity
                key={theme}
                onPress={() => handleThemeChange(theme)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: theme !== 'system' ? 1 : 0,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <Ionicons
                  name={
                    theme === 'light'
                      ? 'sunny-outline'
                      : theme === 'dark'
                      ? 'moon-outline'
                      : 'phone-portrait-outline'
                  }
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ flex: 1, fontSize: 16, color: colors.text }}>
                  {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
                </Text>
                {currentTheme === theme && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Settings */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            Inteligência Artificial
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <SettingRow
              icon="sparkles-outline"
              title="IA Habilitada"
              subtitle="Gemini Flash Lite"
              right={
                <Switch
                  value={aiEnabled}
                  onValueChange={handleToggleAI}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                  thumbColor={aiEnabled ? colors.primary : colors.textMuted}
                />
              }
            />
          </View>
        </View>

        {/* Account */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            Conta
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <SettingRow
              icon="trash-outline"
              title="Lixeira"
              subtitle="Documentos arquivados"
              onPress={() => router.push('/(app)/trash')}
            />
            <SettingRow
              icon="log-out-outline"
              title="Sair"
              subtitle="Encerrar sessão"
              onPress={handleSignOut}
              color={colors.error}
            />
          </View>
        </View>

        {/* About */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            Activity Notes V2 • v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
