# Anonymous Sinhala Message Board — Guide, Implementation Plan & Build Prompt

## 1. Overview

A fully anonymous, open-access web app where:
- Anyone with the link can post a message (max 350 characters, Sinhala-first)
- Anyone can read all messages
- Anyone can reply to any message (also anonymous, 350 char max)
- No usernames, accounts, logins, or identifying metadata are stored
- Data is stored in Supabase (Postgres)

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) or plain HTML/JS | Simple, fast, easy to deploy |
| Styling/Font | Tailwind CSS + Noto Sans Sinhala | Sinhala renders correctly everywhere |
| Backend/DB | Supabase (Postgres + auto REST API) | No custom backend needed |
| Auth | None (fully public) | By design — total anonymity |
| Hosting | Vercel / Netlify (frontend) + Supabase (DB) | Free tier friendly |
| Abuse control | Supabase Edge Function for rate limiting (optional but recommended) | Prevent spam floods |

---

## 3. Database Schema (Supabase SQL)

```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Top-level messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  content varchar(350) not null,
  created_at timestamptz not null default now()
);

-- Replies to messages
create table replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  content varchar(350) not null,
  created_at timestamptz not null default now()
);

-- Indexes for fast feed loading
create index idx_messages_created_at on messages (created_at desc);
create index idx_replies_message_id on replies (message_id);
```

**No user_id, ip, session_id, device_id, or any identity column exists anywhere.** This is intentional and central to the anonymity guarantee.

### Row Level Security (RLS)

```sql
alter table messages enable row level security;
alter table replies enable row level security;

-- Anyone can read
create policy "public read messages" on messages
  for select using (true);

create policy "public read replies" on replies
  for select using (true);

-- Anyone can insert (post)
create policy "public insert messages" on messages
  for insert with check (char_length(content) <= 350 and char_length(content) > 0);

create policy "public insert replies" on replies
  for insert with check (char_length(content) <= 350 and char_length(content) > 0);

-- No update/delete policies for public = no one (except service role) can edit or delete
```

> ⚠️ `char_length()` in Postgres counts Unicode code points, not visual graphemes. For Sinhala, this can slightly undercount visible characters (see Section 5). Treat the DB check as a hard safety ceiling, and do the real-feeling 350-char limit in the frontend.

---

## 4. Moderation (admin-only, not exposed to public)

Since users can't self-delete (no identity to check against), you need an admin path:

- Create a **separate internal tool** (a small password-protected page, or just Supabase Studio itself) that uses the **service_role key** (never expose this key in frontend code) to delete rows.
- Optional: add a `hidden boolean default false` column and filter `select ... where hidden = false` in the public read policy, so you can soft-hide content instead of hard-deleting.
- Optional: basic bad-word filter client-side before insert, as a first line of defense (not foolproof, but reduces obvious spam).

---

## 5. Sinhala Character Counting (important detail)

Sinhala uses combining vowel signs — a single visible character can be 2+ Unicode code points. Using plain `.length` in JavaScript can misjudge the true 350-char experience for users. Use grapheme-aware counting:

```js
function countGraphemes(str) {
  const segmenter = new Intl.Segmenter('si', { granularity: 'grapheme' });
  return [...segmenter.segment(str)].length;
}
```

Use this function to:
- Show a live counter ("245 / 350")
- Block submission past 350
- Disable the textarea / submit button when limit is hit

---

## 6. Frontend Font & UI Notes

- Load **Noto Sans Sinhala** via Google Fonts or self-hosted, and set it as the primary font-family so Sinhala never falls back to tofu boxes.
- UI copy (buttons, placeholders, empty states) should be in Sinhala since that's the main audience — offer English as a secondary toggle if needed.
- Feed: reverse-chronological list of messages, each with a "reply" toggle that expands an inline thread + its own textarea.
- No avatars, no names, no "posted by" labels anywhere in the UI — this is a UX requirement, not just a DB one.

---

## 7. Implementation Plan (Step-by-Step)

**Step 1 — Supabase project setup**
1. Create a new Supabase project.
2. Run the SQL from Section 3 (schema) and Section 3 (RLS policies) in the SQL editor.
3. Copy the `Project URL` and `anon public` API key (Settings → API). Never use the `service_role` key in frontend code.

**Step 2 — Frontend scaffold**
1. `npm create vite@latest sinhala-board -- --template react`
2. Install: `npm install @supabase/supabase-js`
3. Add Tailwind CSS + Noto Sans Sinhala font.
4. Create a `supabaseClient.js` with the URL + anon key.

**Step 3 — Core features**
1. Message composer component (textarea + grapheme counter + submit).
2. Message feed component (fetch + realtime subscribe via `supabase.channel()`).
3. Reply thread component (expand/collapse, own composer, fetch replies by `message_id`).

**Step 4 — Realtime (optional but nice)**
Use Supabase Realtime so new messages/replies appear live without refresh:
```js
supabase
  .channel('messages-feed')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
    // prepend new message to state
  })
  .subscribe();
```

**Step 5 — Abuse mitigation**
1. Add a Supabase Edge Function that rate-limits by IP (e.g. max 5 posts/minute) before allowing insert — call this from the frontend instead of inserting directly, OR restrict direct table inserts and route all writes through the Edge Function.
2. Add simple client-side profanity filter as a soft gate.

**Step 6 — Deploy**
1. Push frontend to GitHub, deploy via Vercel/Netlify.
2. Set environment variables for Supabase URL/anon key in the hosting dashboard.
3. Test end-to-end: post, reply, refresh, confirm no identifying data anywhere (check network tab, DB rows).

**Step 7 — Legal/ethical note**
Add a short "About" page clarifying: messages are public, permanent-ish, and moderated by admins; no identity is collected by the app, though hosting-level logs (IP in server logs) may exist outside the app's control. This sets expectations and reduces misuse.

---

## 8. Ready-to-Use Build Prompt

Copy the block below into Claude Code, Cursor, or any AI coding assistant to scaffold the whole project in one go.

```
Build a web app called "Anonymous Sinhala Message Board" with the following spec:

STACK: React (Vite) + Tailwind CSS + Supabase (Postgres + Realtime). No authentication of any kind.

CORE BEHAVIOR:
- Any visitor can post a plain-text message, max 350 characters (measured by grapheme clusters
  using Intl.Segmenter, not raw string length, to correctly handle Sinhala combining characters).
- Any visitor can read all messages, newest first.
- Any visitor can reply to any message (same 350-char rule), replies shown as an expandable
  thread under each message.
- No usernames, no login, no identifying metadata (no user_id, ip, session_id) is ever stored
  or displayed. The UI must never show any "posted by" or author info.
- Primary language is Sinhala: use Noto Sans Sinhala font, Sinhala UI copy for buttons/placeholders
  (with labels: post button "පළ කරන්න", reply button "පිළිතුරු දෙන්න", placeholder
  "ඔබේ පණිවිඩය මෙහි ලියන්න...").

DATABASE (Supabase):
- Table `messages`: id (uuid, pk, default gen_random_uuid()), content (varchar(350), not null),
  created_at (timestamptz, default now()).
- Table `replies`: id (uuid, pk), message_id (uuid, fk -> messages.id on delete cascade),
  content (varchar(350), not null), created_at (timestamptz, default now()).
- Enable RLS on both tables. Public SELECT allowed on both. Public INSERT allowed on both with a
  check constraint enforcing char_length(content) between 1 and 350. No UPDATE or DELETE policies
  for the public role.
- Add indexes: messages(created_at desc), replies(message_id).

FRONTEND FEATURES:
1. Composer component: textarea with live grapheme counter ("x / 350"), disabled submit past 350
   or empty input, Sinhala placeholder text.
2. Feed component: fetches messages ordered by created_at desc, subscribes to Supabase Realtime
   for new INSERTs on `messages` and prepends them live.
3. Message card: shows message content only (no author info), a reply toggle, and reply count.
4. Reply thread: expands inline under a message, fetches replies for that message_id, has its own
   composer (same rules), subscribes to Realtime INSERTs on `replies` filtered by message_id.
5. Responsive, mobile-first layout, clean minimal design, Sinhala-legible typography sized
   comfortably (at least 16px base).
6. An "About" page/modal in Sinhala and English explaining: fully anonymous, publicly readable,
   moderated by admins, please don't post identifying info about yourself or others.

CONFIG:
- Read Supabase URL and anon public key from environment variables (VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY). Never hardcode keys, never use the service_role key in frontend code.

DELIVERABLES:
- Full Vite React project structure
- supabaseClient.js
- SQL migration file with schema + RLS policies exactly as specified above
- README with setup steps (Supabase project creation, running the SQL, env vars, npm install, npm run dev, deployment to Vercel)
```

---

## 9. Post-Launch Checklist

- [ ] Confirm no identifying columns exist in either table
- [ ] Confirm RLS blocks UPDATE/DELETE for public role
- [ ] Confirm 350-char limit matches visually for Sinhala text (test with conjuncts like ක්‍ෂ, ශ්‍රී)
- [ ] Confirm font renders correctly on iOS/Android/desktop browsers
- [ ] Set up an admin-only moderation path using the service_role key (kept server-side only)
- [ ] Add a basic rate limiter to reduce spam floods
- [ ] Add the About/disclaimer page
