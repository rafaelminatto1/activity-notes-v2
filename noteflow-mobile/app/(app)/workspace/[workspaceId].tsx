import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/auth-store';
import { useSpaces } from '@/hooks/useSpaces';
import {
  subscribeToWorkspaceInvitations,
  subscribeToWorkspaceMembers,
} from '@/lib/firebase/spaces';
import { WorkspaceInvitation, WorkspaceMember } from '@/types/workspace';

function MemberRow({
  member,
  canRemove,
  onRemove,
}: {
  member: WorkspaceMember;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {(member.displayName || member.email || '?').charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
          {member.displayName || 'Membro'}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          {member.email || member.uid}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor:
            member.role === 'owner' ? colors.primary + '22' : colors.surface,
          marginRight: canRemove ? 8 : 0,
        }}
      >
        <Text
          style={{
            color: member.role === 'owner' ? colors.primary : colors.textMuted,
            fontWeight: '700',
            fontSize: 11,
          }}
        >
          {member.role === 'owner' ? 'OWNER' : 'MEMBRO'}
        </Text>
      </View>

      {canRemove && (
        <TouchableOpacity onPress={onRemove} style={{ padding: 6 }}>
          <Ionicons name="person-remove-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function InvitationRow({
  invitation,
  canCancel,
  onCancel,
}: {
  invitation: WorkspaceInvitation;
  canCancel: boolean;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>
          {invitation.invitedEmail}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          Status: {invitation.status}
        </Text>
      </View>
      {canCancel && invitation.status === 'pending' && (
        <TouchableOpacity onPress={onCancel} style={{ padding: 6 }}>
          <Ionicons name="close-circle-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function WorkspaceMembersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const { user, profile } = useAuthStore();
  const {
    workspaces,
    inviteMemberByEmail,
    removeMember,
    cancelInvitation,
  } = useSpaces();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const workspace = useMemo(
    () => workspaces.find((item) => item.id === workspaceId) || null,
    [workspaces, workspaceId]
  );
  const isOwner = !!workspace && workspace.ownerId === user?.uid;

  useEffect(() => {
    if (!workspaceId) return;
    const unsubMembers = subscribeToWorkspaceMembers(workspaceId, setMembers);
    const unsubInvitations = subscribeToWorkspaceInvitations(workspaceId, setInvitations);
    return () => {
      unsubMembers();
      unsubInvitations();
    };
  }, [workspaceId]);

  const membersWithOwner = useMemo(() => {
    if (!workspace || !user?.uid) return members;

    const ownerMemberExists = members.some((member) => member.uid === workspace.ownerId);
    if (ownerMemberExists) return members;

    return [
      {
        uid: workspace.ownerId,
        email: profile?.email || user.email || '',
        displayName: profile?.displayName || user.displayName || 'Owner',
        role: 'owner' as const,
        joinedAt: workspace.createdAt,
      },
      ...members,
    ];
  }, [members, profile?.displayName, profile?.email, user?.displayName, user?.email, user?.uid, workspace]);

  const handleInvite = async () => {
    if (!workspaceId || !inviteEmail.trim()) return;
    try {
      setSubmittingInvite(true);
      await inviteMemberByEmail(workspaceId, inviteEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInviteEmail('');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o convite.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const askRemoveMember = (member: WorkspaceMember) => {
    if (!workspaceId) return;
    Alert.alert(
      'Remover membro?',
      `Remover ${member.displayName || member.email} deste espaço?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await removeMember(workspaceId, member.uid);
            Haptics.selectionAsync();
          },
        },
      ]
    );
  };

  const askCancelInvitation = (invitation: WorkspaceInvitation) => {
    Alert.alert(
      'Cancelar convite?',
      `Cancelar convite para ${invitation.invitedEmail}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Cancelar convite',
          style: 'destructive',
          onPress: async () => {
            await cancelInvitation(invitation.id);
          },
        },
      ]
    );
  };

  if (!workspace) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 16,
            paddingBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginLeft: 6 }}>
            Espaço
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textMuted }}>Espaço não encontrado.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, color: colors.text, fontWeight: '800', marginLeft: 6 }}>
            {workspace.icon || '🏢'} {workspace.name}
          </Text>
        </View>
        <Text style={{ marginLeft: 38, marginTop: 2, color: colors.textMuted }}>
          Gerenciamento de membros e convites
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {isOwner && (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              backgroundColor: colors.card,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>
              Convidar por e-mail
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="colaborador@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  color: colors.text,
                }}
              />
              <TouchableOpacity
                onPress={handleInvite}
                disabled={submittingInvite || !inviteEmail.trim()}
                style={{
                  backgroundColor: inviteEmail.trim() ? colors.primary : colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {submittingInvite ? 'Enviando' : 'Convidar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            backgroundColor: colors.card,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>
            Membros ({membersWithOwner.length})
          </Text>
          {membersWithOwner.length === 0 ? (
            <Text style={{ color: colors.textMuted, paddingVertical: 6 }}>
              Nenhum membro.
            </Text>
          ) : (
            membersWithOwner.map((member) => (
              <MemberRow
                key={member.uid}
                member={member}
                canRemove={isOwner && member.uid !== workspace.ownerId}
                onRemove={() => askRemoveMember(member)}
              />
            ))
          )}
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            backgroundColor: colors.card,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>
            Convites
          </Text>
          {invitations.length === 0 ? (
            <Text style={{ color: colors.textMuted, paddingVertical: 6 }}>
              Nenhum convite enviado.
            </Text>
          ) : (
            invitations.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                canCancel={isOwner}
                onCancel={() => askCancelInvitation(invitation)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
