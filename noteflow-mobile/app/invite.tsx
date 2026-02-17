import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/hooks/useTheme';
import { useSpaces } from '@/hooks/useSpaces';

export default function InviteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { invitationId } = useLocalSearchParams<{ invitationId?: string }>();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { acceptInvitationById } = useSpaces();

  const [state, setState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    if (isLoading) return;
    if (!invitationId) {
      setState('error');
      setMessage('Convite invalido.');
      return;
    }
    if (!isAuthenticated) return;

    startedRef.current = true;
    setState('processing');
    void (async () => {
      try {
        await acceptInvitationById(invitationId);
        setState('success');
        setMessage('Convite aceito com sucesso.');
      } catch {
        setState('error');
        setMessage('Nao foi possivel aceitar o convite.');
      }
    })();
  }, [acceptInvitationById, invitationId, isAuthenticated, isLoading]);

  const openLogin = () => {
    router.replace('/(auth)/login');
  };

  const openHome = () => {
    router.replace('/(app)/(home)');
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          paddingHorizontal: 28,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 10 }}>
          Convite para workspace
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 18 }}>
          Faca login no app para aceitar este convite.
        </Text>
        <TouchableOpacity
          onPress={openLogin}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Ir para login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 28,
      }}
    >
      {state === 'processing' || isLoading ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textMuted }}>Processando convite...</Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
            {state === 'success' ? 'Convite aceito' : 'Convite'}
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 16 }}>
            {message || 'Abrindo convite...'}
          </Text>
          <TouchableOpacity
            onPress={openHome}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Abrir Activity Notes</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
