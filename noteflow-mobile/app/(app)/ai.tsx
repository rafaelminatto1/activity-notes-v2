import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAI } from '@/hooks/useAI';
import { useTheme } from '@/hooks/useTheme';
import { AIAction, AIMessage } from '@/types/ai';
import { AI_ACTION_LABELS } from '@/lib/gemini/prompts';

const QUICK_ACTIONS: AIAction[] = ['summarize', 'expand', 'improve', 'translate', 'ideas'];

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { messages, isLoading, usage, sendMessage, refreshUsage } = useAI();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = input.trim();
    setInput('');
    await sendMessage('freePrompt', text, text);
  }, [input, isLoading, sendMessage]);

  const handleQuickAction = useCallback(
    async (action: AIAction) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendMessage(action, 'Analise e processe o conteúdo dos meus documentos.');
    },
    [sendMessage]
  );

  const renderMessage = useCallback(
    ({ item }: { item: AIMessage }) => {
      const isUser = item.role === 'user';
      return (
        <View
          style={{
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            marginVertical: 4,
            marginHorizontal: 16,
          }}
        >
          <View
            style={{
              backgroundColor: isUser ? colors.surface : '#eef2ff',
              borderRadius: 16,
              borderBottomRightRadius: isUser ? 4 : 16,
              borderBottomLeftRadius: isUser ? 16 : 4,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: isUser ? colors.text : '#1e1b4b',
                lineHeight: 22,
              }}
            >
              {item.content}
            </Text>
          </View>
        </View>
      );
    },
    [colors]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>
          Assistente IA
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 2,
              marginRight: 8,
            }}
          >
            <View
              style={{
                width: `${Math.min((usage.count / usage.limit) * 100, 100)}%`,
                height: 4,
                backgroundColor: usage.count > 40 ? colors.warning : colors.primary,
                borderRadius: 2,
              }}
            />
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {usage.count}/{usage.limit} hoje
          </Text>
        </View>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Ionicons name="sparkles" size={48} color={colors.primary} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            Assistente IA
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
            Pergunte algo sobre seus documentos ou use as ações rápidas abaixo.
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: 24,
              gap: 8,
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action}
                onPress={() => handleQuickAction(action)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 24,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.text }}>
                  {AI_ACTION_LABELS[action]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      {isLoading && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 8,
          }}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ marginLeft: 8, color: colors.textMuted, fontSize: 14 }}>
            Pensando...
          </Text>
        </View>
      )}

      {/* Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 16,
          paddingVertical: 8,
          paddingBottom: insets.bottom + 8,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          gap: 8,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 15,
            color: colors.text,
            maxHeight: 100,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          placeholder="Pergunte algo..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: input.trim() ? colors.primary : colors.border,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="arrow-up" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
