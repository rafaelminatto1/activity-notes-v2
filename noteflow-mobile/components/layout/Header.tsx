import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({ title, showBack, onBack, rightAction }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={{ marginRight: 8, padding: 4 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text }}>
          {title}
        </Text>
      </View>
      {rightAction}
    </View>
  );
}
