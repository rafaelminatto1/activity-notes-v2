import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
      }}
    >
      <Ionicons name={icon as any} size={48} color={colors.textMuted} />
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: colors.textSecondary,
          marginTop: 16,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
