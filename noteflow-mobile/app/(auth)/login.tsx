import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { signIn, resetPassword } from '@/lib/firebase/auth';
import { useTheme } from '@/hooks/useTheme';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/(home)');
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error instanceof Error ? error.message : 'Erro ao fazer login.';
      Alert.alert('Erro', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu email para recuperar a senha.');
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert('Sucesso', 'Email de recuperação enviado!');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o email.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="document-text" size={32} color="#ffffff" />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 4,
            }}
          >
            Activity Notes
          </Text>
          <Text style={{ fontSize: 16, color: colors.textMuted }}>
            Faça login para continuar
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Email
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Senha
          </Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                paddingRight: 48,
                fontSize: 16,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 16,
                top: 16,
              }}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleForgotPassword} style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              color: colors.primary,
              textAlign: 'right',
              fontWeight: '500',
            }}
          >
            Esqueceu a senha?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 16,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              Entrar
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={{
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
            Criar conta
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
