export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived'

export type Conversation = {
  id: string
  slug: string
  title: string
  guestName: string
  guestTitle?: string
  description: string
  category: string
  publishedAt: string
  duration: string
  image: string
  videoUrl?: string
  transcript?: string
  views: number
  reactions: number
  commentsEnabled: boolean
  reactionsEnabled: boolean
  status: ContentStatus
  sample: boolean
  homepageVisible?: boolean
  featured?: boolean
}

export type Paper = {
  id: string
  slug: string
  title: string
  subtitle: string
  excerpt: string
  topic: string
  publishedAt: string
  readingTime: string
  audioDuration?: string
  pdfUrl?: string
  pdfDownloadEnabled?: boolean
  image: string
  body: Array<{ heading?: string; text?: string; quote?: string }>
  views: number
  reactions: number
  status: ContentStatus
  sample: boolean
  homepageVisible?: boolean
  featured?: boolean
}

export type PublicComment = {
  id: string
  contentId: string
  contentType: 'conversation' | 'paper'
  anonymousName: string
  body: string
  isPinned: boolean
  isOfficial: boolean
  parentId?: string
  createdAt: string
}

export type AnalyticsTotals = {
  impressions: number
  contentViews: number
  reactions: number
  subscribers: number
  conversations: number
  papers: number
  comments: number
  countries: number
}

// Compatibility types for pre-redesign route modules. Public traffic is redirected
// from /episodes and /admin into the new information architecture.
export type Episode = {id:string;slug:string;title:string;description:string;guest_name:string|null;guest_title:string|null;video_url:string|null;thumbnail_url:string|null;duration:string|null;tags:string[];category:string|null;status:'draft'|'published';featured:boolean;episode_number:number|null;published_at:string|null;created_at:string;updated_at:string;view_count:number;like_count:number;display_view_count?:number;display_like_count?:number}
export type Comment = {id:string;episode_id:string;username:string;body:string;is_pinned:boolean;is_hidden:boolean;is_official:boolean;parent_id:string|null;created_at:string;replies?:Comment[]}
export type ReactionType = 'thumbsup'|'fire'|'heart'|'mindblown'
export type ReactionCounts = Record<ReactionType,number>
export type Member = {id:string;email:string;created_at:string}
export type QuestionSubmission = {id:string;name:string|null;is_anonymous:boolean;email:string|null;question:string;category:string|null;permission_to_feature:boolean;created_at:string}
export type MetricsOverride = {id:string;key:string;value:number;updated_at:string}
