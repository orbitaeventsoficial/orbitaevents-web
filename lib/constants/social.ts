export const SOCIAL_PLATFORMS = {
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK: 'TIKTOK',
  FACEBOOK: 'FACEBOOK',
  LINKEDIN: 'LINKEDIN',
  X: 'X',
  PINTEREST: 'PINTEREST',
  YOUTUBE: 'YOUTUBE',
} as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[keyof typeof SOCIAL_PLATFORMS];

export const SOCIAL_POST_STATUSES = {
  IDEA: 'IDEA',
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[keyof typeof SOCIAL_POST_STATUSES];

export const SOCIAL_CONTENT_TYPES = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  CAROUSEL: 'CAROUSEL',
  REEL: 'REEL',
  STORY: 'STORY',
  TEXT: 'TEXT',
} as const;
export type SocialContentType = (typeof SOCIAL_CONTENT_TYPES)[keyof typeof SOCIAL_CONTENT_TYPES];

export const SOCIAL_CATEGORIES = {
  EVENT_SHOWCASE: 'EVENT_SHOWCASE',
  BEHIND_SCENES: 'BEHIND_SCENES',
  TESTIMONIAL: 'TESTIMONIAL',
  PROMO: 'PROMO',
  TIPS: 'TIPS',
  TEAM: 'TEAM',
  SEASONAL: 'SEASONAL',
  COLLAB: 'COLLAB',
} as const;
export type SocialCategory = (typeof SOCIAL_CATEGORIES)[keyof typeof SOCIAL_CATEGORIES];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  X: 'X',
  PINTEREST: 'Pinterest',
  YOUTUBE: 'YouTube',
};

export const SOCIAL_POST_STATUS_LABELS: Record<SocialPostStatus, string> = {
  IDEA: 'Idea',
  DRAFT: 'Esborrany',
  SCHEDULED: 'Programada',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Arxivada',
};

export const SOCIAL_CONTENT_TYPE_LABELS: Record<SocialContentType, string> = {
  IMAGE: 'Imatge',
  VIDEO: 'Video',
  CAROUSEL: 'Carousel',
  REEL: 'Reel',
  STORY: 'Story',
  TEXT: 'Text',
};

export const SOCIAL_CATEGORY_LABELS: Record<SocialCategory, string> = {
  EVENT_SHOWCASE: 'Event showcase',
  BEHIND_SCENES: 'Behind the scenes',
  TESTIMONIAL: 'Testimoni',
  PROMO: 'Promo',
  TIPS: 'Consells',
  TEAM: 'Equip',
  SEASONAL: 'Seasonal',
  COLLAB: 'Collab',
};

export const SOCIAL_VALIDATION_SETS = {
  platforms: new Set<SocialPlatform>(Object.values(SOCIAL_PLATFORMS)),
  statuses: new Set<SocialPostStatus>(Object.values(SOCIAL_POST_STATUSES)),
  contentTypes: new Set<SocialContentType>(Object.values(SOCIAL_CONTENT_TYPES)),
  categories: new Set<SocialCategory>(Object.values(SOCIAL_CATEGORIES)),
} as const;

export const TASK_QUEUE_VALUES = ['VENÇUT', 'AVUI', 'VIP', 'BLOQUEJAT', 'NORMAL'] as const;
