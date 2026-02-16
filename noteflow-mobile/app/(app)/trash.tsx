import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuthStore } from '@/stores/auth-store';
import { getArchivedDocuments } from '@/lib/firebase/firestore';
import { Document } from '@/types/document';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TrashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { restore, permanentDelete } = useDocuments();
  const [archivedDocs, setArchivedDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadArchived = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const docs = await getArchivedDocuments(user.uid);
      setArchivedDocs(docs);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadArchived();
  }, [loadArchived]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadArchived();
  }, [loadArchived]);

  const handleRestore = (doc: Document) => {
    Alert.alert('Restaurar documento?', `"${doc.title || 'Sem título'}" voltará para seus documentos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        onPress: async () => {
          await restore(doc.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setArchivedDocs((prev) => prev.filter((d) => d.id !== doc.id));
        },
      },
    ]);
  };

  const handlePermanentDelete = (doc: Document) => {
    Alert.alert(
      'Excluir permanentemente?',
      'Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await permanentDelete(doc.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setArchivedDocs((prev) => prev.filter((d) => d.id !== doc.id));
          },
        },
      ]
    );
  };

  const handleEmptyTrash = () => {
    if (archivedDocs.length === 0) return;
    Alert.alert(
      'Esvaziar lixeira?',
      `${archivedDocs.length} documento(s) serão excluídos permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Esvaziar',
          style: 'destructive',
          onPress: async () => {
            for (const doc of archivedDocs) {
              await permanentDelete(doc.id);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setArchivedDocs([]);
          },
        },
      ]
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: Document }) => (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <Text style={{ fontSize: 24, marginRight: 12 }}>{item.icon || '📝'}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 2 }}
            numberOfLines={1}
          >
            {item.title || 'Sem título'}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            Arquivado {formatDistanceToNow(item.updatedAt, { addSuffix: true, locale: ptBR })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleRestore(item)}
          style={{ padding: 8, marginRight: 4 }}
        >
          <Ionicons name="arrow-undo-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handlePermanentDelete(item)}
          style={{ padding: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    ),
    [colors]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
          Lixeira
        </Text>
        {archivedDocs.length > 0 ? (
          <TouchableOpacity onPress={handleEmptyTrash} style={{ padding: 4 }}>
            <Text style={{ fontSize: 14, color: colors.error, fontWeight: '500' }}>
              Esvaziar
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : archivedDocs.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Ionicons name="trash-outline" size={48} color={colors.textMuted} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            Lixeira vazia
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textMuted,
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            Documentos arquivados aparecerão aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={archivedDocs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}
