import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Workspace } from '@/types/workspace';
import { ProjectKind } from '@/types/project';

const PROJECT_COLORS = [
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
];

type ModalMode = 'personal-project' | 'shared-project' | 'workspace';

export interface CreateEntityPayload {
  name: string;
  icon: string;
  color: string;
  kind: ProjectKind;
  workspaceId: string | null;
  memberIds: string[];
}

interface CreateEntityModalProps {
  visible: boolean;
  mode: ModalMode;
  workspaces: Workspace[];
  onClose: () => void;
  onSubmit: (payload: CreateEntityPayload) => Promise<void> | void;
}

function parseMembers(raw: string): string[] {
  if (!raw.trim()) return [];
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function CreateEntityModal({
  visible,
  mode,
  workspaces,
  onClose,
  onSubmit,
}: CreateEntityModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [kind, setKind] = useState<ProjectKind>('folder');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [rawMembers, setRawMembers] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => {
    if (mode === 'workspace') return 'Novo espaço de equipe';
    if (mode === 'shared-project') return 'Novo projeto compartilhado';
    return 'Nova pasta/caderno';
  }, [mode]);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setColor(PROJECT_COLORS[0]);
    setRawMembers('');

    if (mode === 'workspace') {
      setIcon('🏢');
      setKind('shared-project');
      setWorkspaceId(null);
      return;
    }

    if (mode === 'shared-project') {
      setIcon('🤝');
      setKind('shared-project');
      setWorkspaceId(workspaces[0]?.id || null);
      return;
    }

    setIcon('📁');
    setKind('folder');
    setWorkspaceId(null);
  }, [visible, mode, workspaces]);

  const showProjectOptions = mode !== 'workspace';
  const canSubmit =
    name.trim().length >= 2 && (mode !== 'shared-project' || workspaces.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        icon: icon.trim() || (mode === 'workspace' ? '🏢' : '📁'),
        color,
        kind,
        workspaceId: mode === 'shared-project' ? workspaceId : null,
        memberIds: parseMembers(rawMembers),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            borderRadius: 16,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            maxHeight: '80%',
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              {title}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 14 }}
          >
            <View>
              <Text style={{ color: colors.textMuted, marginBottom: 6, fontSize: 13 }}>
                Nome
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Digite um nome..."
                placeholderTextColor={colors.textMuted}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  color: colors.text,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 15,
                }}
              />
            </View>

            <View>
              <Text style={{ color: colors.textMuted, marginBottom: 6, fontSize: 13 }}>
                Ícone (emoji)
              </Text>
              <TextInput
                value={icon}
                onChangeText={setIcon}
                placeholder="📁"
                placeholderTextColor={colors.textMuted}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  color: colors.text,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 20,
                }}
              />
            </View>

            {showProjectOptions && (
              <View>
                <Text style={{ color: colors.textMuted, marginBottom: 8, fontSize: 13 }}>
                  Cor
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {PROJECT_COLORS.map((option) => {
                    const isSelected = option === color;
                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setColor(option)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: option,
                          borderWidth: isSelected ? 3 : 1,
                          borderColor: isSelected ? colors.text : colors.border,
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            {mode === 'personal-project' && (
              <View>
                <Text style={{ color: colors.textMuted, marginBottom: 8, fontSize: 13 }}>
                  Tipo
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { label: 'Pasta', value: 'folder', icon: '📁' },
                    { label: 'Caderno', value: 'notebook', icon: '📓' },
                  ].map((option) => {
                    const isSelected = kind === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setKind(option.value as ProjectKind)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                        }}
                      >
                        <Text>{option.icon}</Text>
                        <Text style={{ color: colors.text, fontWeight: '600' }}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {mode === 'shared-project' && (
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={{ color: colors.textMuted, marginBottom: 8, fontSize: 13 }}>
                    Espaço de equipe
                  </Text>
                  {workspaces.length === 0 ? (
                    <Text style={{ color: colors.warning, fontSize: 13 }}>
                      Crie um espaço de equipe antes de criar projeto compartilhado.
                    </Text>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {workspaces.map((workspace) => {
                        const isSelected = workspaceId === workspace.id;
                        return (
                          <TouchableOpacity
                            key={workspace.id}
                            onPress={() => setWorkspaceId(workspace.id)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: isSelected ? colors.primary : colors.border,
                              backgroundColor: isSelected
                                ? colors.primary + '20'
                                : colors.surface,
                            }}
                          >
                            <Text>{workspace.icon || '🏢'}</Text>
                            <Text style={{ color: colors.text }}>{workspace.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                <View>
                  <Text style={{ color: colors.textMuted, marginBottom: 6, fontSize: 13 }}>
                    UIDs extras (opcional)
                  </Text>
                  <TextInput
                    value={rawMembers}
                    onChangeText={setRawMembers}
                    placeholder="uid1, uid2, uid3"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      color: colors.text,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 15,
                    }}
                  />
                </View>
              </View>
            )}

            {mode === 'workspace' && (
              <View>
                <Text style={{ color: colors.textMuted, marginBottom: 6, fontSize: 13 }}>
                  UIDs de membros (opcional)
                </Text>
                <TextInput
                  value={rawMembers}
                  onChangeText={setRawMembers}
                  placeholder="uid1, uid2, uid3"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    color: colors.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                  }}
                />
              </View>
            )}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: canSubmit ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {submitting ? 'Criando...' : 'Criar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
