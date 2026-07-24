Here is a brief summary of the නිර්නාම (Nirnama) system:

Purpose & Core Concept:
An anonymous, public Sinhala-first message board where users can create posts (messages) and reply to them in threads.
Total anonymity by design—no log-ins, session IDs, user IDs, or IP addresses are stored anywhere.
Visual Style:
Utilizes a warm, premium, typewriter/letterpress look with curated vintage sepia colors (#FAF6EE background, #2A2421 text, #b24c32 accent orange/red).
Core Tech Stack:
Frontend: React 19, Vite 8, Tailwind CSS v4, and Lucide React.
Backend/Database: Supabase (PostgreSQL with RLS policy locks and Realtime Channels for instant post & reply propagation).
Validation & Abuse Controls:
Grapheme-aware visual character counting via Intl.Segmenter (limited to 500 visual characters, excluding spaces).
Database varchar limits set up to 1500 code points to cover combining Sinhala character marks safely.
Client-side rate-limiter allowing a maximum of 5 messages or replies per minute using localStorage timestamps.