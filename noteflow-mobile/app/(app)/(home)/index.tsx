import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  AlertButton,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  CreateEntityModal,
  CreateEntityPayload,
} from '@/components/spaces/CreateEntityModal';
import { useDocuments } from '@/hooks/useDocuments';
import { useSpaces } from '@/hooks/useSpaces';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/hooks/useTheme';
import { Project } from '@/types/project';
import { Workspace } from '@/types/workspace';

type HomeFilter =
  | { type: 'all' }
  | { type: 'project'; id: string }
  | { type: 'workspace'; id: string };

type CreateMode = 'personal-project' | 'shared-project' | 'workspace';

function SectionHeader({
  title,
  onAdd,
  onReset,
}: {
  title: string;
  onAdd: () => void;
  onReset: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}
    >
      <TouchableOpacity onPress={onReset}>
        <Text
          style={{
            fontSize: 24,
            color: colors.textMuted,
            fontWeight: '700',
            letterSpacing: -0.2,
          }}
        >
          {title}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAdd} style={{ padding: 6 }}>
        <Ionicons name="add" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function NavigationRow({
  icon,
  title,
  subtitle,
  active,
  onPress,
  onLongPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  active: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={450}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: 10,
        backgroundColor: active ? colors.surface : 'transparent',
      }}
    >
      <Text style={{ fontSize: 18, marginRight: 10 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 19,
            color: colors.text,
            fontWeight: active ? '700' : '500',
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function QuickCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 132,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        marginRight: 10,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 36, backgroundColor: colors.surfaceSecondary }} />
      <View style={{ paddingHorizontal: 10, paddingVertical: 10 }}>
        <Text style={{ fontSize: 19, marginBottom: 6 }}>{icon}</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profile, user } = useAuthStore();
  const { documents, isLoading, create, getFavorites, getRecent } = useDocuments();
  const {
    workspaces,
    personalProjects,
    sharedProjects,
    incomingInvitations,
    isLoading: isSpacesLoading,
    createPersonalProject,
    createSharedProject,
    createTeamWorkspace,
    removeProject,
    removeWorkspace,
    acceptInvitation,
    declineInvitation,
  } = useSpaces();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<HomeFilter>({ type: 'all' });
  const [createMode, setCreateMode] = useState<CreateMode>('personal-project');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const firstName = profile?.displayName?.split(' ')[0] || 'Usuário';
  const recentDocs = useMemo(() => documents.slice(0, 10), [documents]);

  const selectedProject = useMemo(
    () =>
      activeFilter.type === 'project'
        ? [...personalProjects, ...sharedProjects].find((item) => item.id === activeFilter.id) || null
        : null,
    [activeFilter, personalProjects, sharedProjects]
  );

  const selectedWorkspace = useMemo(
    () =>
      activeFilter.type === 'workspace'
        ? workspaces.find((item) => item.id === activeFilter.id) || null
        : null,
    [activeFilter, workspaces]
  );

  const scopedDocs = useMemo(() => {
    if (activeFilter.type === 'project') {
      return documents.filter((doc) => doc.projectId === activeFilter.id);
    }
    if (activeFilter.type === 'workspace') {
      return documents.filter((doc) => doc.workspaceId === activeFilter.id);
    }
    return recentDocs;
  }, [activeFilter, documents, recentDocs]);

  const scopeTitle = useMemo(() => {
    if (selectedProject) return `${selectedProject.icon} ${selectedProject.name}`;
    if (selectedWorkspace) return `${selectedWorkspace.icon} ${selectedWorkspace.name}`;
    return 'Recentes';
  }, [selectedProject, selectedWorkspace]);

  const openCreateModal = (mode: CreateMode) => {
    setCreateMode(mode);
    setIsModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const createDocForActiveScope = async () => {
    if (!user?.uid) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      let projectId: string | null = null;
      let workspaceId: string | null = null;
      let icon = '📝';
      let color = '#10b981';
      let allowedUserIds = [user.uid];

      if (selectedProject) {
        projectId = selectedProject.id;
        workspaceId = selectedProject.workspaceId;
        icon = selectedProject.icon || icon;
        color = selectedProject.color || color;
        allowedUserIds =
          selectedProject.memberIds.length > 0 ? selectedProject.memberIds : [user.uid];
      } else if (selectedWorkspace) {
        workspaceId = selectedWorkspace.id;
        icon = selectedWorkspace.icon || icon;
        allowedUserIds = Array.from(
          new Set([user.uid, ...(selectedWorkspace.members || [])])
        );
      }

      const id = await create({
        title: '',
        icon,
        color,
        projectId,
        workspaceId,
        allowedUserIds,
      });
      router.push(`/(app)/(home)/${id}`);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o documento.');
    }
  };

  const askDeleteProject = (project: Project) => {
    Alert.alert(
      'Excluir projeto?',
      `O projeto "${project.name}" será removido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await removeProject(project.id);
            if (activeFilter.type === 'project' && activeFilter.id === project.id) {
              setActiveFilter({ type: 'all' });
            }
          },
        },
      ]
    );
  };

  const askDeleteWorkspace = (workspace: Workspace) => {
    Alert.alert(
      'Excluir espaço de equipe?',
      `O espaço "${workspace.name}" será removido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await removeWorkspace(workspace.id);
            if (activeFilter.type === 'workspace' && activeFilter.id === workspace.id) {
              setActiveFilter({ type: 'all' });
            }
          },
        },
      ]
    );
  };

  const openWorkspaceActions = (workspace: Workspace) => {
    const actions: AlertButton[] = [
      {
        text: 'Gerenciar membros',
        onPress: () => router.push(`/(app)/workspace/${workspace.id}`),
      },
      {
        text: 'Cancelar',
        style: 'cancel' as const,
      },
    ];

    if (workspace.ownerId === user?.uid) {
      actions.splice(1, 0, {
        text: 'Excluir espaço',
        style: 'destructive',
        onPress: () => askDeleteWorkspace(workspace),
      });
    }

    Alert.alert(workspace.name, 'Selecione uma ação', actions);
  };

  const handleCreateEntity = async (payload: CreateEntityPayload) => {
    try {
      if (createMode === 'workspace') {
        await createTeamWorkspace({
          name: payload.name,
          icon: payload.icon,
          members: payload.memberIds,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      if (createMode === 'shared-project') {
        await createSharedProject({
          name: payload.name,
          icon: payload.icon,
          color: payload.color,
          workspaceId: payload.workspaceId,
          extraMemberIds: payload.memberIds,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      await createPersonalProject({
        name: payload.name,
        icon: payload.icon,
        color: payload.color,
        kind: payload.kind === 'notebook' ? 'notebook' : 'folder',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o item.');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    const invitation = incomingInvitations.find((item) => item.id === invitationId);
    if (!invitation) return;
    try {
      await acceptInvitation(invitation);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Erro', 'Não foi possível aceitar o convite.');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await declineInvitation(invitationId);
      Haptics.selectionAsync();
    } catch {
      Alert.alert('Erro', 'Não foi possível recusar o convite.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 10,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>
            Activity Notes
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 18, color: colors.textMuted }}>Espaço pessoal de {firstName}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text
          style={{
            fontSize: 24,
            color: colors.textMuted,
            fontWeight: '700',
            marginBottom: 10,
            marginTop: 4,
          }}
        >
          Recentes
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 22 }}
        >
          <QuickCard
            icon="📁"
            title="Pasta"
            subtitle="Organizar notas"
            onPress={() => openCreateModal('personal-project')}
          />
          <QuickCard
            icon="📓"
            title="Caderno"
            subtitle="Anotações longas"
            onPress={() => openCreateModal('personal-project')}
          />
          <QuickCard
            icon="🤝"
            title="Compartilhado"
            subtitle="Projeto em equipe"
            onPress={() => openCreateModal('shared-project')}
          />
          <QuickCard
            icon="🏢"
            title="Espaço"
            subtitle="Time ou clínica"
            onPress={() => openCreateModal('workspace')}
          />
        </ScrollView>

        {incomingInvitations.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 18,
                color: colors.text,
                fontWeight: '700',
                marginBottom: 10,
              }}
            >
              Convites pendentes
            </Text>
            {incomingInvitations.map((invitation) => (
              <View
                key={invitation.id}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                  {invitation.workspaceIcon || '🏢'} {invitation.workspaceName}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                  Convite para {invitation.invitedEmail}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleDeclineInvitation(invitation.id)}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '600' }}>Recusar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAcceptInvitation(invitation.id)}
                    style={{
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Aceitar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <SectionHeader
          title="Particular"
          onAdd={() => openCreateModal('personal-project')}
          onReset={() => setActiveFilter({ type: 'all' })}
        />
        {personalProjects.length === 0 && !isSpacesLoading ? (
          <Text style={{ color: colors.textMuted, marginBottom: 16 }}>
            Crie sua primeira pasta ou caderno.
          </Text>
        ) : (
          <View style={{ marginBottom: 18 }}>
            {personalProjects.map((project) => (
              <NavigationRow
                key={project.id}
                icon={project.icon || '📁'}
                title={project.name}
                subtitle={project.kind === 'notebook' ? 'Caderno' : 'Pasta'}
                active={activeFilter.type === 'project' && activeFilter.id === project.id}
                onPress={() => setActiveFilter({ type: 'project', id: project.id })}
                onLongPress={() => askDeleteProject(project)}
              />
            ))}
          </View>
        )}

        <SectionHeader
          title="Espaços de equipe"
          onAdd={() => openCreateModal('workspace')}
          onReset={() => setActiveFilter({ type: 'all' })}
        />
        {workspaces.length === 0 && !isSpacesLoading ? (
          <Text style={{ color: colors.textMuted, marginBottom: 16 }}>
            Crie um espaço para organizar projetos de equipe.
          </Text>
        ) : (
          <View style={{ marginBottom: 18 }}>
            {workspaces.map((workspace) => (
              <NavigationRow
                key={workspace.id}
                icon={workspace.icon || '🏢'}
                title={workspace.name}
                subtitle={workspace.ownerId === user?.uid ? 'Você é owner' : 'Espaço compartilhado'}
                active={activeFilter.type === 'workspace' && activeFilter.id === workspace.id}
                onPress={() => setActiveFilter({ type: 'workspace', id: workspace.id })}
                onLongPress={() => openWorkspaceActions(workspace)}
              />
            ))}
          </View>
        )}

        <SectionHeader
          title="Compartilhado"
          onAdd={() => openCreateModal('shared-project')}
          onReset={() => setActiveFilter({ type: 'all' })}
        />
        {sharedProjects.length === 0 && !isSpacesLoading ? (
          <Text style={{ color: colors.textMuted, marginBottom: 18 }}>
            Ainda não há projetos compartilhados.
          </Text>
        ) : (
          <View style={{ marginBottom: 18 }}>
            {sharedProjects.map((project) => (
              <NavigationRow
                key={project.id}
                icon={project.icon || '🤝'}
                title={project.name}
                subtitle="Projeto compartilhado"
                active={activeFilter.type === 'project' && activeFilter.id === project.id}
                onPress={() => setActiveFilter({ type: 'project', id: project.id })}
                onLongPress={() => askDeleteProject(project)}
              />
            ))}
          </View>
        )}

        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: colors.text,
              marginBottom: 10,
            }}
          >
            {scopeTitle}
          </Text>
          {scopedDocs.length === 0 && !isLoading ? (
            <EmptyState
              icon="document-text-outline"
              title="Nenhum documento"
              subtitle="Crie um documento para este contexto."
            />
          ) : (
            scopedDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onPress={() => router.push(`/(app)/(home)/${doc.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={createDocForActiveScope}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 96,
          right: 20,
          width: 58,
          height: 58,
          borderRadius: 18,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <CreateEntityModal
        visible={isModalVisible}
        mode={createMode}
        workspaces={workspaces}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleCreateEntity}
      />
    </View>
  );
}
