import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function AppLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.icon,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Documentos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Busca',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'IA',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="sparkles-outline" size={size} color={color} />
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#6366f1',
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trash"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="workspace/[workspaceId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
