import { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
}

const TOAST_COLORS = {
  success: { bg: '#22c55e', icon: 'checkmark-circle' },
  error: { bg: '#ef4444', icon: 'alert-circle' },
  info: { bg: '#6366f1', icon: 'information-circle' },
};

export function Toast({ visible, message, type = 'info', onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(onHide);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, translateY, onHide]);

  if (!visible) return null;

  const toastConfig = TOAST_COLORS[type];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + 10,
        left: 20,
        right: 20,
        backgroundColor: toastConfig.bg,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        opacity,
        transform: [{ translateY }],
        zIndex: 1000,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      }}
    >
      <Ionicons
        name={toastConfig.icon as any}
        size={20}
        color="#ffffff"
        style={{ marginRight: 8 }}
      />
      <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500', flex: 1 }}>
        {message}
      </Text>
    </Animated.View>
  );
}
