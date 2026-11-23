export interface LandingFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface LandingPillar {
  title: string;
  description: string;
}

export interface LandingStep {
  number: string;
  title: string;
  description: string;
}

export interface PlatformInfo {
  name: string;
  tagline: string;
  description: string;
  positioning: string;
  introduction: {
    eyebrow: string;
    title: string;
    description: string;
    pillars: LandingPillar[];
  };
  features: LandingFeature[];
  steps: LandingStep[];
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
}

export interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  href: string;
  meta: string[];
}

export interface FeaturedCollection {
  items: FeaturedItem[];
  total: number;
  available: boolean;
  message: string;
  emptyLabel: string;
}
