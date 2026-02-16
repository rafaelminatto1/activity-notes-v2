import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useDocuments } from '@/hooks/useDocuments';
import { useTheme } from '@/hooks/useTheme';
import { getDocument } from '@/lib/firebase/firestore';
import { Document } from '@/types/document';

export default function DocumentEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { update, toggleFavorite, remove } = useDocuments();

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>('');
  const lastSavedTitle = useRef<string>('');

  useEffect(() => {
    if (!id) return;
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    if (!id) return;
    const doc = await getDocument(id);
    if (doc) {
      setDocument(doc);
      setTitle(doc.title);
      const text = doc.plainText || '';
      setContent(text);
      lastSavedContent.current = text;
      lastSavedTitle.current = doc.title;
    }
  };

  const saveDocument = useCallback(
    async (newTitle: string, newContent: string) => {
      if (!id) return;
      if (newTitle === lastSavedTitle.current && newContent === lastSavedContent.current) return;

      setSaveStatus('saving');
      try {
        await update(id, {
          title: newTitle,
          plainText: newContent.substring(0, 500),
          content: { type: 'text', text: newContent },
        });
        lastSavedTitle.current = newTitle;
        lastSavedContent.current = newContent;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    },
    [id, update]
  );

  const scheduleAutoSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveDocument(newTitle, newContent);
      }, 2000);
    },
    [saveDocument]
  );

  const handleTitleChange = (text: string) => {
    setTitle(text);
    scheduleAutoSave(text, content);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    scheduleAutoSave(title, text);
  };

  const handleToggleFavorite = async () => {
    if (!document || !id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFav = !document.isFavorite;
    setDocument({ ...document, isFavorite: newFav });
    await toggleFavorite(id, newFav);
  };

  const handleDelete = () => {
    Alert.alert(
      'Mover para lixeira?',
      'O documento será arquivado e poderá ser restaurado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mover',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await remove(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
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
        <TouchableOpacity
          onPress={() => {
            saveDocument(title, content);
            router.back();
          }}
          style={{ padding: 4 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontSize: 12,
              color:
                saveStatus === 'saving'
                  ? colors.warning
                  : saveStatus === 'saved'
                  ? colors.success
                  : colors.textMuted,
            }}
          >
            {saveStatus === 'saving'
              ? 'Salvando...'
              : saveStatus === 'saved'
              ? '✓ Salvo'
              : ''}
          </Text>
          <TouchableOpacity onPress={handleToggleFavorite} style={{ padding: 4 }}>
            <Ionicons
              name={document?.isFavorite ? 'star' : 'star-outline'}
              size={22}
              color={document?.isFavorite ? '#f59e0b' : colors.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={{ padding: 4 }}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Emoji Icon */}
        <TouchableOpacity style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 40 }}>{document?.icon || '📝'}</Text>
        </TouchableOpacity>

        {/* Title */}
        <TextInput
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 16,
            padding: 0,
          }}
          placeholder="Sem título"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={handleTitleChange}
          multiline
        />

        {/* Content (Plain text editor - Tiptap via WebView can be added later) */}
        <TextInput
          style={{
            fontSize: 16,
            color: colors.text,
            lineHeight: 24,
            minHeight: 300,
            textAlignVertical: 'top',
            padding: 0,
          }}
          placeholder="Comece a escrever..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={handleContentChange}
          multiline
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Bottom Toolbar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
          paddingBottom: insets.bottom + 8,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          gap: 16,
        }}
      >
        {['text', 'list', 'checkbox-outline', 'code-slash', 'link', 'image-outline', 'sparkles'].map((icon) => (
          <TouchableOpacity key={icon} style={{ padding: 8 }}>
            <Ionicons name={icon as any} size={20} color={colors.icon} />
          </TouchableOpacity>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}
