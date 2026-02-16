import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDocumentsStore } from '@/stores/documents-store';
import { useTheme } from '@/hooks/useTheme';
import { Document } from '@/types/document';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { searchDocuments, documents } = useDocumentsStore();
  const [query, setQuery] = useState('');

  const results = query.trim() ? searchDocuments(query) : [];
  const recentDocs = documents.slice(0, 5);

  const HighlightedText = ({ text, search, style }: { text: string; search: string; style: object }) => {
    if (!search.trim()) return <Text style={style} numberOfLines={1}>{text}</Text>;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(search.toLowerCase());
    if (idx === -1) return <Text style={style} numberOfLines={1}>{text}</Text>;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + search.length);
    const after = text.slice(idx + search.length);
    return (
      <Text style={style} numberOfLines={1}>
        {before}
        <Text style={{ backgroundColor: colors.primary + '30', fontWeight: '700' }}>{match}</Text>
        {after}
      </Text>
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: Document }) => (
      <TouchableOpacity
        onPress={() => router.push(`/(app)/(home)/${item.id}`)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <Text style={{ fontSize: 24, marginRight: 12 }}>{item.icon || '📝'}</Text>
        <View style={{ flex: 1 }}>
          <HighlightedText
            text={item.title || 'Sem título'}
            search={query}
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: colors.text,
              marginBottom: 2,
            }}
          />
          {item.plainText ? (
            <HighlightedText
              text={item.plainText.substring(0, 80)}
              search={query}
              style={{ fontSize: 14, color: colors.textMuted }}
            />
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    ),
    [colors, router]
  );

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
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Busca
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 8,
              fontSize: 16,
              color: colors.text,
            }}
            placeholder="Buscar nos documentos..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.trim() ? (
        results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text
              style={{
                fontSize: 16,
                color: colors.textMuted,
                marginTop: 12,
              }}
            >
              Nenhum resultado para "{query}"
            </Text>
          </View>
        )
      ) : (
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
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
          {recentDocs.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              onPress={() => router.push(`/(app)/(home)/${doc.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 10 }}>{doc.icon || '📝'}</Text>
              <Text
                style={{ fontSize: 16, color: colors.text, flex: 1 }}
                numberOfLines={1}
              >
                {doc.title || 'Sem título'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
