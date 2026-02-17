import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Document } from '@/types/document';
import { useTheme } from '@/hooks/useTheme';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
}

export function DocumentCard({ document, onPress }: DocumentCardProps) {
  const { colors } = useTheme();

  const timeAgo = formatDistanceToNow(document.updatedAt, {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderLeftWidth: 4,
        borderLeftColor: document.color || colors.primary,
      }}
    >
      <Text style={{ fontSize: 28, marginRight: 12 }}>
        {document.icon || '📝'}
      </Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            color: colors.text,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {document.title || 'Sem título'}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted }} numberOfLines={1}>
          {timeAgo}
          {document.plainText ? ` • ${document.plainText.substring(0, 40)}` : ''}
        </Text>
        {document.allowedUserIds.length > 1 && (
          <Text style={{ fontSize: 11, color: colors.primary, marginTop: 3, fontWeight: '600' }}>
            Compartilhado
          </Text>
        )}
      </View>
      {document.isFavorite && (
        <Ionicons name="star" size={16} color="#f59e0b" style={{ marginLeft: 8 }} />
      )}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.textMuted}
        style={{ marginLeft: 4 }}
      />
    </TouchableOpacity>
  );
}
