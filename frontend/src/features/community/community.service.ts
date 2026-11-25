import { apiClient } from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';
import type {
  Channel,
  Community,
  CommunityMember,
  CommunityRole,
  CreateChannelPayload,
  CreateMessagePayload,
  CreateReplyPayload,
  Message,
  MessagePage,
  Resource,
  ResourceQuery,
  Role,
  UpdateChannelPayload,
} from './community.types';

interface RawCommunity extends Partial<Omit<Community, 'currentUserRole'>> {
  role?: Role;
  currentUserRole?: Role;
}

interface RawMember extends Partial<CommunityMember> {
  id?: string;
  userId?: string;
}

type RawChannel = Partial<Channel>;

interface RawAuthor {
  id?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
}

interface RawResource extends Partial<Omit<Resource, 'sharedBy'>> {
  sharedByUserId?: string;
  sharedBy?: RawAuthor;
}

interface RawMessage extends Partial<Omit<Message, 'author'>> {
  author?: RawAuthor;
}

interface RawMessagePage {
  items?: RawMessage[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

const roles: Role[] = ['owner', 'admin', 'moderator', 'member'];

function unwrap<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.records;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function role(value: unknown): Role {
  return typeof value === 'string' && roles.includes(value as Role) ? (value as Role) : 'member';
}

function author(value: RawAuthor | undefined, fallbackId: string) {
  return {
    id: text(value?.id, fallbackId),
    username: text(value?.username, 'unknown'),
    displayName: text(value?.displayName, 'Unknown member'),
    avatarUrl: nullableText(value?.avatarUrl),
  };
}

function normalizeCommunity(value: RawCommunity): Community {
  return {
    id: text(value.id),
    name: text(value.name, 'Community'),
    slug: text(value.slug),
    description: nullableText(value.description),
    coverImageUrl: nullableText(value.coverImageUrl),
    visibility: value.visibility === 'private' ? 'private' : 'public',
    memberCount: typeof value.memberCount === 'number' ? value.memberCount : 0,
    currentUserRole: value.currentUserRole ?? (value.role ? role(value.role) : undefined),
  };
}

function normalizeMember(value: RawMember): CommunityMember {
  const userId = text(value.userId, text(value.id));
  return {
    id: text(value.id, userId),
    userId,
    username: text(value.username, 'unknown'),
    displayName: text(value.displayName, 'Unknown member'),
    avatarUrl: nullableText(value.avatarUrl),
    role: role(value.role),
    joinedAt: text(value.joinedAt),
  };
}

function normalizeChannel(value: RawChannel): Channel {
  return {
    id: text(value.id),
    communityId: text(value.communityId),
    name: text(value.name, 'Channel'),
    slug: text(value.slug),
    description: nullableText(value.description),
    type:
      value.type === 'announcement' || value.type === 'question' || value.type === 'resources'
        ? value.type
        : 'text',
    visibility: value.visibility === 'private' ? 'private' : 'public',
    memberCount: typeof value.memberCount === 'number' ? value.memberCount : undefined,
    createdAt: text(value.createdAt),
  };
}

function normalizeMessage(value: RawMessage): Message {
  const counts =
    value.reactionCounts && typeof value.reactionCounts === 'object' ? value.reactionCounts : {};
  const viewer = Array.isArray(value.viewerReactions) ? value.viewerReactions : [];
  const kind =
    value.kind === 'question' ||
    value.kind === 'answer' ||
    value.kind === 'announcement' ||
    value.kind === 'resource'
      ? value.kind
      : 'message';

  return {
    id: text(value.id),
    channelId: text(value.channelId),
    parentMessageId: nullableText(value.parentMessageId),
    authorId: text(value.authorId, text(value.author?.id)),
    author: author(value.author, text(value.authorId)),
    body: text(value.body),
    kind,
    code: nullableText(value.code),
    language: nullableText(value.language),
    linkUrl: nullableText(value.linkUrl),
    linkTitle: nullableText(value.linkTitle),
    createdAt: text(value.createdAt),
    updatedAt: text(value.updatedAt, text(value.createdAt)),
    reactionCounts: counts,
    viewerReactions: viewer.filter((entry): entry is string => typeof entry === 'string'),
  };
}

function normalizeResource(value: RawResource, members: CommunityMember[] = []): Resource {
  const sharedByUserId = text(value.sharedByUserId, text(value.sharedBy?.id));
  const member = members.find(
    (entry) => entry.userId === sharedByUserId || entry.id === sharedByUserId,
  );
  const sharedBy = value.sharedBy
    ? author(value.sharedBy, sharedByUserId)
    : member
      ? {
          id: member.userId,
          username: member.username,
          displayName: member.displayName,
          avatarUrl: member.avatarUrl,
        }
      : author(undefined, sharedByUserId);
  const type =
    value.type === 'image' || value.type === 'file' || value.type === 'link'
      ? value.type
      : 'link';

  return {
    id: text(value.id),
    channelId: text(value.channelId),
    type,
    title: text(value.title, 'Shared resource'),
    url: text(value.url),
    source: nullableText(value.source),
    sharedBy,
    createdAt: text(value.createdAt),
  };
}

export const communityKeys = {
  all: ['community'] as const,
  communities: () => [...communityKeys.all, 'communities'] as const,
  community: (slug: string | null) => [...communityKeys.all, 'community', slug] as const,
  members: (communityId: string | null) => [...communityKeys.all, 'members', communityId] as const,
  channels: (communityId: string | null) => [...communityKeys.all, 'channels', communityId] as const,
  roles: (communityId: string | null) => [...communityKeys.all, 'roles', communityId] as const,
  channel: (channelId: string | null) => [...communityKeys.all, 'channel', channelId] as const,
  messages: (channelId: string | null) => [...communityKeys.all, 'messages', channelId] as const,
  replies: (messageId: string | null) => [...communityKeys.all, 'replies', messageId] as const,
  resources: (channelId: string | null, query: ResourceQuery) =>
    [...communityKeys.all, 'resources', channelId, query.type ?? 'all', query.search ?? ''] as const,
};

export async function getCommunities(): Promise<Community[]> {
  const values = unwrap<RawCommunity[] | null>(
    await apiClient.get<ApiEnvelope<RawCommunity[] | null>>('/communities'),
  );
  return (values ?? []).map(normalizeCommunity);
}

export async function getCommunity(slug: string): Promise<Community> {
  const value = unwrap<RawCommunity>(
    await apiClient.get<ApiEnvelope<RawCommunity>>(`/communities/${encodeURIComponent(slug)}`),
  );
  return normalizeCommunity(value);
}

export async function getMembers(communityId: string): Promise<CommunityMember[]> {
  const values = unwrap<RawMember[] | null>(
    await apiClient.get<ApiEnvelope<RawMember[] | null>>(`/communities/${communityId}/members`),
  );
  return (values ?? []).map(normalizeMember);
}

export async function getChannels(communityId: string): Promise<Channel[]> {
  const values = unwrap<RawChannel[] | null>(
    await apiClient.get<ApiEnvelope<RawChannel[] | null>>(`/communities/${communityId}/channels`),
  );
  return (values ?? []).map(normalizeChannel);
}

export async function joinCommunity(communityId: string): Promise<void> {
  await apiClient.post(`/communities/${communityId}/join`);
}

export async function leaveCommunity(communityId: string): Promise<void> {
  await apiClient.delete(`/communities/${communityId}/join`);
}

export async function getRoles(communityId: string): Promise<CommunityRole[]> {
  const values = unwrap<CommunityRole[] | null>(
    await apiClient.get<ApiEnvelope<CommunityRole[] | null>>(`/communities/${communityId}/roles`),
  );
  return values ?? [];
}

export async function createChannel(
  communityId: string,
  payload: CreateChannelPayload,
): Promise<Channel> {
  const value = unwrap<RawChannel>(
    await apiClient.post<ApiEnvelope<RawChannel>>(`/communities/${communityId}/channels`, payload),
  );
  return normalizeChannel(value);
}

export async function updateChannel(
  channelId: string,
  payload: UpdateChannelPayload,
): Promise<Channel> {
  const value = unwrap<RawChannel>(
    await apiClient.patch<ApiEnvelope<RawChannel>>(`/channels/${channelId}`, payload),
  );
  return normalizeChannel(value);
}

export async function getChannel(channelId: string): Promise<Channel> {
  const value = unwrap<RawChannel>(
    await apiClient.get<ApiEnvelope<RawChannel>>(`/channels/${channelId}`),
  );
  return normalizeChannel(value);
}

export async function getMessages(
  channelId: string,
  options: { limit?: number; cursor?: string } = {},
): Promise<MessagePage> {
  const value = unwrap<RawMessagePage>(
    await apiClient.get<ApiEnvelope<RawMessagePage>>(`/channels/${channelId}/messages`, {
      params: { limit: options.limit ?? 30, ...(options.cursor ? { cursor: options.cursor } : {}) },
    }),
  );
  return {
    items: (value.items ?? []).map(normalizeMessage),
    nextCursor: nullableText(value.nextCursor),
    hasMore: Boolean(value.hasMore),
  };
}

export async function sendMessage(
  channelId: string,
  payload: CreateMessagePayload,
): Promise<Message> {
  const value = unwrap<RawMessage>(
    await apiClient.post<ApiEnvelope<RawMessage>>(`/channels/${channelId}/messages`, payload),
  );
  return normalizeMessage(value);
}

export async function editMessage(messageId: string, body: string): Promise<Message> {
  const value = unwrap<RawMessage>(
    await apiClient.put<ApiEnvelope<RawMessage>>(`/messages/${messageId}`, { body }),
  );
  return normalizeMessage(value);
}

export async function deleteMessage(messageId: string): Promise<void> {
  await apiClient.delete(`/messages/${messageId}`);
}

export async function addReaction(messageId: string, emoji: string): Promise<void> {
  await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
}

export async function removeReaction(messageId: string, emoji: string): Promise<void> {
  await apiClient.delete(`/messages/${messageId}/reactions`, { data: { emoji } });
}

export async function getReplies(messageId: string): Promise<Message[]> {
  const values = unwrap<RawMessage[] | null>(
    await apiClient.get<ApiEnvelope<RawMessage[] | null>>(`/messages/${messageId}/replies`),
  );
  return (values ?? []).map(normalizeMessage);
}

export async function sendReply(messageId: string, payload: CreateReplyPayload): Promise<Message> {
  const value = unwrap<RawMessage>(
    await apiClient.post<ApiEnvelope<RawMessage>>(`/messages/${messageId}/replies`, payload),
  );
  return normalizeMessage(value);
}

export async function getResources(
  channelId: string,
  query: ResourceQuery = {},
  members: CommunityMember[] = [],
): Promise<Resource[]> {
  const values = unwrap<RawResource[] | null>(
    await apiClient.get<ApiEnvelope<RawResource[] | null>>(`/channels/${channelId}/resources`, {
      params: { ...(query.type ? { type: query.type } : {}), ...(query.search ? { search: query.search } : {}) },
    }),
  );
  return (values ?? []).map((value) => normalizeResource(value, members));
}

export async function reportMessage(messageId: string, reason: string): Promise<void> {
  await apiClient.post(`/messages/${messageId}/report`, { reason });
}
