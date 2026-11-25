import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import type {
  Channel,
  Community,
  CommunityMember,
  CommunityRole,
  CreateChannelPayload,
  Message,
  Resource,
  ResourceQuery,
  ResourceType,
  Role,
  UpdateChannelPayload,
} from './community.types';
import {
  communityKeys,
  createChannel as createChannelRequest,
  getChannels,
  getCommunities,
  getCommunity,
  getMembers,
  getResources,
  getRoles,
  updateChannel as updateChannelRequest,
} from './community.service';
import { useToast } from './ToastProvider';

export interface WorkspaceContextValue {
  communities: Community[];
  community: Community | null;
  channels: Channel[];
  members: CommunityMember[];
  roles: CommunityRole[];
  channel: Channel | null;
  resources: Resource[];
  currentUserRole: Role;
  canManageChannels: boolean;
  canEditChannel: boolean;
  canModerate: boolean;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  search: string;
  setSearch: (value: string) => void;
  resourceType: ResourceType;
  setResourceType: (value: ResourceType) => void;
  resourceSearch: string;
  setResourceSearch: (value: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  contextOpen: boolean;
  setContextOpen: (value: boolean) => void;
  navigationOpen: boolean;
  setNavigationOpen: (value: boolean) => void;
  threadMessageId: string | null;
  setThreadMessageId: (value: string | null) => void;
  threadParent: Message | null;
  setThreadParent: (value: Message | null) => void;
  createChannelOpen: boolean;
  setCreateChannelOpen: (value: boolean) => void;
  editingChannel: Channel | null;
  setEditingChannel: (value: Channel | null) => void;
  selectCommunity: (slug: string) => void;
  selectChannel: (id: string) => void;
  submitChannel: (payload: CreateChannelPayload) => Promise<void>;
  submitChannelUpdate: (payload: UpdateChannelPayload) => Promise<void>;
  queryClient: ReturnType<typeof useQueryClient>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const roleRank: Record<Role, number> = { owner: 4, admin: 3, moderator: 2, member: 1 };
const emptyCommunities: Community[] = [];
const emptyChannels: Channel[] = [];
const emptyMembers: CommunityMember[] = [];
const emptyRoles: CommunityRole[] = [];
const emptyResources: Resource[] = [];

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('link');
  const [resourceSearch, setResourceSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
  const [threadParent, setThreadParent] = useState<Message | null>(null);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  const communitiesQuery = useQuery({
    queryKey: communityKeys.communities(),
    queryFn: getCommunities,
  });
  const slugParam = searchParams.get('community');
  const activeSlug = slugParam ?? communitiesQuery.data?.[0]?.slug ?? null;
  const communityQuery = useQuery({
    queryKey: communityKeys.community(activeSlug),
    queryFn: () => getCommunity(activeSlug as string),
    enabled: Boolean(activeSlug),
  });
  const community = communityQuery.data ?? null;
  const communityId = community?.id ?? null;

  const channelsQuery = useQuery({
    queryKey: communityKeys.channels(communityId),
    queryFn: () => getChannels(communityId as string),
    enabled: Boolean(communityId),
  });
  const membersQuery = useQuery({
    queryKey: communityKeys.members(communityId),
    queryFn: () => getMembers(communityId as string),
    enabled: Boolean(communityId),
  });
  const rolesQuery = useQuery({
    queryKey: communityKeys.roles(communityId),
    queryFn: () => getRoles(communityId as string),
    enabled: Boolean(communityId),
  });

  const channels = channelsQuery.data ?? emptyChannels;
  const channelParam = searchParams.get('channel');
  const channel = channels.find((entry) => entry.id === channelParam) ?? channels[0] ?? null;
  const activeChannelId = channel?.id ?? null;

  const resourceQuery: ResourceQuery = { type: resourceType, search: resourceSearch.trim() };
  const resourcesQuery = useQuery({
    queryKey: communityKeys.resources(activeChannelId, resourceQuery),
    queryFn: () => getResources(activeChannelId as string, resourceQuery, membersQuery.data ?? []),
    enabled: Boolean(activeChannelId),
  });

  useEffect(() => {
    if (slugParam || !communitiesQuery.data?.length) return;
    const slug = communitiesQuery.data[0].slug;
    setSearchParams(
      (previous) => {
        previous.set('community', slug);
        return previous;
      },
      { replace: true },
    );
  }, [slugParam, communitiesQuery.data, setSearchParams]);

  useEffect(() => {
    if (!channels.length || (channelParam && channel?.id === channelParam)) return;
    setSearchParams(
      (previous) => {
        previous.set('channel', channel?.id ?? channels[0].id);
        return previous;
      },
      { replace: true },
    );
  }, [channels, channelParam, channel, setSearchParams]);

  const selectCommunity = useCallback(
    (slug: string) => {
      setSearchParams(
        (previous) => {
          previous.set('community', slug);
          previous.delete('channel');
          return previous;
        },
        { replace: false },
      );
      setSidebarOpen(false);
      setNavigationOpen(false);
    },
    [setSearchParams],
  );

  const selectChannel = useCallback(
    (id: string) => {
      setSearchParams(
        (previous) => {
          previous.set('channel', id);
          return previous;
        },
        { replace: false },
      );
      setSidebarOpen(false);
      setNavigationOpen(false);
    },
    [setSearchParams],
  );

  const submitChannel = useCallback(
    async (payload: CreateChannelPayload) => {
      if (!communityId) return;
      await createChannelRequest(communityId, payload);
      await queryClient.invalidateQueries({ queryKey: communityKeys.channels(communityId) });
      showToast('Channel created.', 'success');
    },
    [communityId, queryClient, showToast],
  );

  const submitChannelUpdate = useCallback(
    async (payload: UpdateChannelPayload) => {
      if (!editingChannel) return;
      await updateChannelRequest(editingChannel.id, payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: communityKeys.channels(editingChannel.communityId) }),
        queryClient.invalidateQueries({ queryKey: communityKeys.channel(editingChannel.id) }),
      ]);
      showToast('Channel updated.', 'success');
    },
    [editingChannel, queryClient, showToast],
  );

  const currentUserRole: Role =
    community?.currentUserRole ??
    membersQuery.data?.find((member) => member.userId === user?.id)?.role ??
    'member';
  const value: WorkspaceContextValue = {
    communities: communitiesQuery.data ?? emptyCommunities,
    community,
    channels,
    members: membersQuery.data ?? emptyMembers,
    roles: rolesQuery.data ?? emptyRoles,
    channel,
    resources: resourcesQuery.data ?? emptyResources,
    currentUserRole,
    canManageChannels: roleRank[currentUserRole] >= roleRank.admin,
    canEditChannel: roleRank[currentUserRole] >= roleRank.moderator,
    canModerate: roleRank[currentUserRole] >= roleRank.moderator,
    isLoading:
      communitiesQuery.isPending ||
      Boolean(activeSlug && communityQuery.isPending) ||
      Boolean(communityId && (channelsQuery.isPending || membersQuery.isPending)),
    error:
      communitiesQuery.error ??
      communityQuery.error ??
      channelsQuery.error ??
      membersQuery.error ??
      rolesQuery.error,
    refetch: () => {
      void communitiesQuery.refetch();
      void communityQuery.refetch();
      void channelsQuery.refetch();
      void membersQuery.refetch();
      void rolesQuery.refetch();
    },
    search,
    setSearch,
    resourceType,
    setResourceType,
    resourceSearch,
    setResourceSearch,
    sidebarOpen,
    setSidebarOpen,
    contextOpen,
    setContextOpen,
    navigationOpen,
    setNavigationOpen,
    threadMessageId,
    setThreadMessageId,
    threadParent,
    setThreadParent,
    createChannelOpen,
    setCreateChannelOpen,
    editingChannel,
    setEditingChannel,
    selectCommunity,
    selectChannel,
    submitChannel,
    submitChannelUpdate,
    queryClient,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
