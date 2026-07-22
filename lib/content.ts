import type { AnalyticsTotals, Conversation, Paper } from './types'

// Invented demonstration content is deliberately labelled SAMPLE throughout the UI.
export const conversations: Conversation[] = [
  {
    id: 'sample-conversation-01', slug: 'what-we-carry-between-places',
    title: 'What We Carry Between Places', guestName: 'Sample guest', guestTitle: 'Demonstration content',
    description: 'A sample conversation format about memory, belonging, and how a place changes when it is described from somewhere else.',
    category: 'Identity', publishedAt: '2026-06-12T12:00:00Z', duration: '42 min', image: '/editorial/exchange.jpg',
    views: 0, reactions: 0, commentsEnabled: true, reactionsEnabled: true, status: 'published', sample: true,
    transcript: 'Sample transcript. Real conversation transcripts can be added and edited from the host dashboard.'
  },
  {
    id: 'sample-conversation-02', slug: 'the-distance-behind-an-image',
    title: 'The Distance Behind an Image', guestName: 'Sample guest', guestTitle: 'Demonstration content',
    description: 'A demonstration of how K-VERSATION can hold a patient exchange about representation and the realities hidden by an international image.',
    category: 'Society', publishedAt: '2026-05-04T12:00:00Z', duration: '35 min', image: '/editorial/bridge.jpg',
    views: 0, reactions: 0, commentsEnabled: true, reactionsEnabled: true, status: 'published', sample: true
  },
  {
    id: 'sample-conversation-03', slug: 'language-as-a-place-to-meet',
    title: 'Language as a Place to Meet', guestName: 'Sample guest', guestTitle: 'Demonstration content',
    description: 'Sample content exploring the small acts of translation that happen inside families, friendships, and public life.',
    category: 'Culture', publishedAt: '2026-03-18T12:00:00Z', duration: '48 min', image: '/editorial/paper-study.jpg',
    views: 0, reactions: 0, commentsEnabled: true, reactionsEnabled: true, status: 'published', sample: true
  }
]

export const papers: Paper[] = [
  {
    id: 'sample-paper-01', slug: 'notes-on-looking-twice', title: 'Notes on Looking Twice',
    subtitle: 'What changes when a familiar image is given more time?', summary: 'A sample paper about resisting the first, easiest version of a story.', excerpt: 'A sample paper about resisting the first, easiest version of a story.',
    topic: 'Representation', category: 'Representation', publishedAt: '2026-06-02T12:00:00Z', archiveDate: '2026-06-02T12:00:00Z', authorName: 'Daniel Koo', readingTime: '7 min read', audioDuration: '8 min audio', image: '/editorial/paper-study.jpg', views: 0, reactions: 0, commentsEnabled: true, reactionsEnabled: true, status: 'published', sample: true,
    body: [
      { type: 'paragraph', text: 'This is sample editorial content created to demonstrate the reading experience. It does not represent a published claim or a completed paper by Daniel Koo.' },
      { type: 'heading', text: 'The first image is rarely the whole image' },
      { type: 'paragraph', text: 'Distance makes clean outlines. Real places are harder to hold: contradictory, ordinary, intimate, and always changing beneath the names used to describe them.' },
      { type: 'quote', text: 'To look twice is to leave room for another person’s reality.' },
      { type: 'heading', text: 'A practice of attention' },
      { type: 'paragraph', text: 'K-VERSATION is designed for that second look. The finished paper can include citations, footnotes, audio narration, images, and a downloadable PDF.' }
    ]
  },
  {
    id: 'sample-paper-02', slug: 'the-shape-of-an-inherited-question', title: 'The Shape of an Inherited Question',
    subtitle: 'Identity is not a conclusion. It is a method of asking.', summary: 'Sample writing on heritage, uncertainty, and the questions passed between generations.', excerpt: 'Sample writing on heritage, uncertainty, and the questions passed between generations.',
    topic: 'Identity', category: 'Identity', publishedAt: '2026-04-20T12:00:00Z', archiveDate: '2026-04-20T12:00:00Z', authorName: 'Daniel Koo', readingTime: '9 min read', image: '/editorial/bridge.jpg', views: 0, reactions: 0, commentsEnabled: true, reactionsEnabled: true, status: 'published', sample: true,
    body: [{ type: 'paragraph', text: 'Sample paper. Replace this text through the host dashboard before publication.' }]
  },
  {
    id: 'sample-paper-03', slug: 'beyond-the-exported-story', title: 'Beyond the Exported Story',
    subtitle: 'Culture travels quickly. Context travels more slowly.', summary: 'A sample essay structure about international attention and the details that resist packaging.', excerpt: 'A sample essay structure about international attention and the details that resist packaging.',
    topic: 'Culture', category: 'Culture', publishedAt: '2026-02-11T12:00:00Z', archiveDate: '2026-02-11T12:00:00Z', authorName: 'Daniel Koo', readingTime: '6 min read', image: '/editorial/exchange.jpg', views: 0, reactions: 0, commentsEnabled: true, reactionsEnabled: true, status: 'published', sample: true,
    body: [{ type: 'paragraph', text: 'Sample paper. Replace this text through the host dashboard before publication.' }]
  }
]

export const sampleTotals: AnalyticsTotals = {
  impressions: 0, contentViews: 0, reactions: 0, subscribers: 0,
  conversations: conversations.length, papers: papers.length, comments: 0, countries: 0
}

export function formatEditorialDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'America/Los_Angeles' }).format(date)
}

export function formatLongEditorialDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value)
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' }).format(date)
}
