export type Role = 'owner' | 'admin' | 'moderator' | 'member';
export type Visibility = 'public' | 'private';
export type ChannelType = 'text' | 'announcement' | 'question' | 'resources';
export type MessageKind = 'message' | 'question' | 'answer' | 'announcement' | 'resource';
export type ResourceType = 'link' | 'image' | 'file';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  visibility: Visibility;
  memberCount: number;
  currentUserRole?: Role;
}

export interface CommunityMember {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  joinedAt: string;
}

export interface Channel {
  id: string;
  communityId: string;
  name: string;
  slug: string;
  description: string | null;
  type: ChannelType;
  visibility: Visibility;
  memberCount?: number;
  createdAt: string;
}

export interface MessageAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Message {
  id: string;
  channelId: string;
  parentMessageId: string | null;
  authorId: string;
  author: MessageAuthor;
  body: string;
  kind: MessageKind;
  code: string | null;
  language: string | null;
  linkUrl: string | null;
  linkTitle: string | null;
  createdAt: string;
  updatedAt: string;
  reactionCounts: Record<string, number>;
  viewerReactions: string[];
}

export interface Resource {
  id: string;
  channelId: string;
  type: ResourceType;
  title: string;
  url: string;
  source: string | null;
  sharedBy: MessageAuthor;
  createdAt: string;
}

export interface CommunityRole {
  role: Role;
  label: string;
  permissions: string[];
}

export interface MessagePage {
  items: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateChannelPayload {
  name: string;
  description?: string;
  type: ChannelType;
  visibility: Visibility;
}

export interface UpdateChannelPayload {
  name?: string;
  description?: string | null;
  type?: ChannelType;
  visibility?: Visibility;
}

export interface CreateMessagePayload {
  body: string;
  kind?: MessageKind;
  code?: string;
  language?: string;
  linkUrl?: string;
  linkTitle?: string;
}

export interface CreateReplyPayload {
  body: string;
  kind?: MessageKind;
  code?: string;
  language?: string;
}

export interface ResourceQuery {
  type?: ResourceType;
  search?: string;
}
