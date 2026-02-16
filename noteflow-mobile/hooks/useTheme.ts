import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, ThemeColors } from '@/constants/colors';

export function useTheme(): {
  isDark: boolean;
  colors: ThemeColors;
  theme: 'light' | 'dark';
} {
  const systemTheme = useColorScheme();
  const profile = useAuthStore((s) => s.profile);

  const userTheme = profile?.settings?.theme || 'system';
  let isDark: boolean;

  if (userTheme === 'system') {
    isDark = systemTheme === 'dark';
  } else {
    isDark = userTheme === 'dark';
  }

  return {
    isDark,
    colors: isDark ? Colors.dark : Colors.light,
    theme: isDark ? 'dark' : 'light',
  };
}
