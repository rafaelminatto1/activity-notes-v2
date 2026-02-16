import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDocument } from '@/lib/firebase/firestore';
import { Document } from '@/types/document';
import { useTheme } from '@/hooks/useTheme';

export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const doc = await getDocument(id);
      if (doc?.isPublished) {
        setDocument(doc);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!document) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 16, color: colors.textMuted }}>
          Documento não encontrado ou não publicado.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 40,
      }}
    >
      <Text style={{ fontSize: 40, marginBottom: 8 }}>{document.icon || '📝'}</Text>
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 16,
        }}
      >
        {document.title || 'Sem título'}
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: colors.text,
          lineHeight: 24,
        }}
      >
        {document.plainText}
      </Text>
    </ScrollView>
  );
}
