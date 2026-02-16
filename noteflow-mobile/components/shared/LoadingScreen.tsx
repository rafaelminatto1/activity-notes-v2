import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 16,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
