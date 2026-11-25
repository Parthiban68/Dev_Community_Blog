export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member';
export type CommunityVisibility = 'public' | 'private';
export type ChannelType = 'text' | 'announcement' | 'question' | 'resources';
export type ChannelVisibility = 'public' | 'private';
export type MessageKind = 'message' | 'question' | 'answer' | 'announcement' | 'resource';
export type ChannelResourceType = 'link' | 'image' | 'file';

export const COMMUNITY_ROLES: string[] = ['owner', 'admin', 'moderator', 'member'];
export const COMMUNITY_VISIBILITIES: string[] = ['public', 'private'];
export const CHANNEL_TYPES: string[] = ['text', 'announcement', 'question', 'resources'];
export const CHANNEL_VISIBILITIES: string[] = ['public', 'private'];
export const MESSAGE_KINDS: string[] = ['message', 'question', 'answer', 'announcement', 'resource'];
export const RESOURCE_TYPES: string[] = ['link', 'image', 'file'];
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const COMMUNITY_ROLE_RANK: Record<CommunityRole, number> = {
  owner: 4,
  admin: 3,
  moderator: 2,
  member: 1,
};

export const COMMUNITY_ROLE_DETAILS: Record<
  CommunityRole,
  { label: string; permissions: string[] }
> = {
  owner: {
    label: 'Owner',
    permissions: [
      'communities.read',
      'communities.manage',
      'channels.create',
      'channels.manage',
      'members.manage',
      'messages.create',
      'messages.moderate',
    ],
  },
  admin: {
    label: 'Admin',
    permissions: [
      'communities.read',
      'channels.create',
      'channels.manage',
      'members.manage',
      'messages.create',
      'messages.moderate',
    ],
  },
  moderator: {
    label: 'Moderator',
    permissions: ['communities.read', 'channels.manage', 'messages.create', 'messages.moderate'],
  },
  member: {
    label: 'Member',
    permissions: ['communities.read', 'messages.create'],
  },
};

export function hasCommunityRole(role: CommunityRole, minimum: CommunityRole): boolean {
  return COMMUNITY_ROLE_RANK[role] >= COMMUNITY_ROLE_RANK[minimum];
}
