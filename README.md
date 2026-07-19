# K-VERSATION

K-VERSATION is Daniel Koo’s independent conversation archive and cultural publication. It pairs a public editorial experience with a private host desk for conversations, papers, moderation, membership, questions, analytics, settings, and notifications.

## Stack

- Next.js 16 App Router, React 19, and strict TypeScript
- Custom responsive CSS with Tailwind available for utilities
- Supabase PostgreSQL, Row Level Security, and Storage
- Iron Session with HTTP-only, same-site cookies
- Scrypt password verification
- Resend-compatible transactional email infrastructure

The public app runs without credentials using clearly labelled demonstration content and process-local form fallbacks. Connect Supabase before production so submissions and analytics persist across processes and deployments.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Public site: `http://localhost:3000`
Host login: `http://localhost:3000/host/login`

Run the complete local quality gate with:

```bash
npm run check
```

## Environment

Copy `.env.example` and configure:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only data and storage access |
| `HOST_PASSWORD_HASH` | Scrypt hash; never the raw password |
| `SESSION_SECRET` | Random value of at least 32 characters |
| `RESEND_API_KEY` | Transactional email API key |
| `RESEND_FROM_EMAIL` | Sender on a verified domain |
| `HOST_NOTIFICATION_EMAIL` | Defaults operationally to `thekversation@gmail.com` |

Generate a host hash locally. This prints a value to place in the deployment secret, not the password itself:

```bash
node -e "const c=require('crypto'),s=c.randomBytes(16).toString('hex'),p=process.argv[1];console.log('scrypt$'+s+'$'+c.scryptSync(p,s,32).toString('hex'))" 'YOUR PASSWORD'
```

Generate `SESSION_SECRET` with `openssl rand -hex 32`.

## Database and storage

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial.sql` and `002_functions.sql` in order.
3. Optionally run `supabase/seed.sql`. Every invented record has `is_sample=true`.
4. Create a public Storage bucket named `kversation-media`.
5. Restrict writes to service-role/server operations. The upload endpoint additionally checks authentication, MIME type, and a 500 MB size ceiling.

The schema includes host users, conversations, chapters, papers, media assets, categories, reaction types, reactions, comments, reports, subscribers, questions, settings, analytics events, statistic adjustments, notification campaigns, and audit logs. Verified analytics remain separate from host adjustments and manual overrides.

## Host security

- There is no public host registration.
- The raw secret is never stored, committed, or sent back to the browser.
- Login is rate limited and compared with timing-safe scrypt verification.
- Sessions use secure HTTP-only cookies in production and expire after eight hours.
- Host layouts and mutation endpoints verify the session on the server.
- Successful sign-ins and host mutations are structured for audit logging.

## Content and media

Conversation records support direct MP4/WebM/MOV uploads from the browser file picker, Supabase media, YouTube, Vimeo, and Google Drive share URLs, plus thumbnails, captions, transcripts, chapters, related links, scheduling, and per-item interaction controls. Uploads use short-lived host-authorized signed URLs, so large files go directly from the host’s device to Supabase Storage instead of passing through the application server. Paper creation requires a PDF upload and supports an embedded reader, optional downloads, cover images, audio narration, citations, and the same publishing states.

The repository ships with three generated, original editorial images in `public/editorial/`. They are used only for clearly labelled demonstration pieces.

## Email

Use a Resend account with a verified sending domain. Keep `thekversation@gmail.com` as reply-to and host notification recipient. Publishing and milestone messages should be created as campaigns, explicitly approved by the host, sent only to active consented subscribers, and recorded in `notification_campaigns`. Every message must include an unsubscribe URL.

## Deployment

1. Push the repository to GitHub and import it into Vercel.
2. Add every environment variable in the Vercel project settings.
3. Apply Supabase migrations and create the storage bucket.
4. Run `npm run check` in CI.
5. Replace or unpublish all records labelled `Sample content`.
6. Confirm the production domain in `NEXT_PUBLIC_SITE_URL`, Resend, Supabase auth/network settings, and social metadata.

## Design system

The visual analysis is recorded in `docs/design-analysis.md`. The project uses Manrope for a legally available neo-grotesque display voice and Cormorant Garamond for long-form editorial contrast, both loaded through `next/font`. Motion is brief, once per session, skippable, and disabled under reduced-motion preferences.

## Content still required from the host

- Final conversations, guest approvals, thumbnails, videos, captions, chapters, and transcripts
- Final papers, PDFs, audio narration, citations, footnotes, and downloads
- Daniel’s approved portrait and behind-the-scenes photographs
- Approved social profile URLs
- Final About copy and milestones, if any
- Production logo approval and final favicon review
- Verified sending domain and deployment credentials
- Legal review of the privacy placeholder
