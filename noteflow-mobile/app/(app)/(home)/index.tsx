import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/hooks/useTheme';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profile } = useAuthStore();
  const { documents, isLoading, create, getFavorites } = useDocuments();
  const [refreshing, setRefreshing] = useState(false);

  const favorites = getFavorites();
  const recentDocs = documents.slice(0, 10);

  const handleCreateDocument = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const id = await create({ title: '' });
      router.push(`/(app)/(home)/${id}`);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o documento.');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // The subscription will automatically update
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const firstName = profile?.displayName?.split(' ')[0] || 'Usuário';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>
            Activity Notes
          </Text>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 16, color: colors.textMuted, marginTop: 4 }}>
          Olá, {firstName} 👋
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Quick Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 24, marginTop: 8 }}
        >
          <TouchableOpacity
            onPress={handleCreateDocument}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 24,
              marginRight: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, marginRight: 4 }}>📝</Text>
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>
              Nova página
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(app)/ai')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 24,
              marginRight: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, marginRight: 4 }}>🤖</Text>
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>IA</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Favorites */}
        {favorites.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              ⭐ Favoritos
            </Text>
            {favorites.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onPress={() => router.push(`/(app)/(home)/${doc.id}`)}
              />
            ))}
          </View>
        )}

        {/* Recent */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            Recentes
          </Text>
          {recentDocs.length === 0 && !isLoading ? (
            <EmptyState
              icon="document-text-outline"
              title="Nenhum documento"
              subtitle="Crie seu primeiro documento tocando no botão +"
            />
          ) : (
            recentDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onPress={() => router.push(`/(app)/(home)/${doc.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={handleCreateDocument}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
