import { apiClient } from '../lib/api';
import type { ApiEnvelope } from '../types/api';
import type { FeaturedCollection, PlatformInfo } from '../types/landing';

export const landingKeys = {
  platform: ['landing', 'platform'] as const,
  featuredCommunities: ['landing', 'communities', 'featured'] as const,
  featuredProjects: ['landing', 'projects', 'featured'] as const,
  upcomingEvents: ['landing', 'events', 'upcoming'] as const,
};

async function unwrap<T>(path: string): Promise<T> {
  const response = await apiClient.get<ApiEnvelope<T>>(path);
  return response.data.records;
}

export function fetchPlatform(): Promise<PlatformInfo> {
  return unwrap<PlatformInfo>('/public/platform');
}

export function fetchFeaturedCommunities(): Promise<FeaturedCollection> {
  return unwrap<FeaturedCollection>('/public/communities/featured?limit=3');
}

export function fetchFeaturedProjects(): Promise<FeaturedCollection> {
  return unwrap<FeaturedCollection>('/public/projects/featured?limit=3');
}

export function fetchUpcomingEvents(): Promise<FeaturedCollection> {
  return unwrap<FeaturedCollection>('/public/events/upcoming?limit=3');
}
