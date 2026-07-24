# නිර්නාම — Anonymous Sinhala Message Board

A premium, fully anonymous, open-access web application where anyone can post and reply in Sinhala/English. Features a sleek, modern glassmorphic dark mode, real-time message feeds, and grapheme-aware character counting tailored for complex Sinhala script conjuncts.

Built with **React (Vite)**, **Tailwind CSS v4**, and **Supabase (PostgreSQL + Realtime)**.

---

## 🚀 Features

- **100% Anonymous by Design**: No user accounts, registration, passwords, session state, or identifying metadata (like IP address, browser footprint) are stored in the database.
- **Sinhala Script Compatibility**: Typography configured with **Noto Sans Sinhala** from Google Fonts to avoid rendering issues (tofu blocks).
- **Grapheme-Aware Length Checking**: The frontend counts actual visual Sinhala characters (using browser-native `Intl.Segmenter`) instead of raw Unicode code-points.
- **Real-Time Synchronisation**: Newly posted messages and replies appear instantly across all connected clients using Supabase Postgres Realtime broadcast.
- **Client-Side Anti-Spam protection**: Local soft rate-limiting (maximum 5 posts/replies per minute) using localStorage.

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://react.dev/) + [Vite](https://vite.dev/)
- **CSS Styling Engine**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Realtime Backend**: [Supabase](https://supabase.com/)

---

## 📋 Getting Started

### 1. Database Setup (Supabase)

1. Create a free project on [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** in the Supabase Dashboard.
3. Open a new query window, copy the contents of [supabase/schema.sql](file:///Users/anjana/Desktop/Quoter/supabase/schema.sql), paste them in, and click **Run**.
   - *This script configures the `messages` and `replies` tables, sets database-level character length constraints, defines Row Level Security (RLS) policies allowing public select/insert, sets performance indexes, and enables real-time broadcast publications for both tables.*

### 2. Copy API Keys

In the Supabase Dashboard, go to **Project Settings** ➡️ **API**:
- Copy the **Project URL**
- Copy the **API key (anon public)**

### 3. Local Installation & Configuration

1. Clone or copy the project files to your environment.
2. In the root directory, copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and enter your Supabase details:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Launch the local development server:
   ```bash
   npm run dev
   ```

---

## ☁️ Deploying to Vercel

Since the project is structured as a standard single-page app, deploying to Vercel is extremely simple:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Initialize Anonymous Sinhala Message Board"
   git branch -M main
   git push -u origin main
   ```
2. Open the **[Vercel Dashboard](https://vercel.com/)** and click **Add New** ➡️ **Project**.
3. Import your GitHub repository (`Quoter`).
4. Expand the **Environment Variables** section and add:
   - Name: `VITE_SUPABASE_URL` | Value: *[Your Supabase URL]*
   - Name: `VITE_SUPABASE_ANON_KEY` | Value: *[Your Supabase Anon Key]*
5. Click **Deploy**. Vercel will build and launch your application!

---

## 🛡️ Database Policies (RLS)

This application runs entirely serverless and secures backend access via **Row Level Security (RLS)** in PostgreSQL:

- **SELECT (Read)**: Permitted to everyone (`true`) so anyone can load messages and replies.
- **INSERT (Create)**: Permitted to everyone under the validation constraint `char_length(content) <= 1500 and char_length(content) > 0` (with a client-side visual constraint of 500 graphemes, excluding spaces) preventing empty posts or oversize inputs.
- **UPDATE & DELETE**: Blocked entirely for public client access. Only administrative credentials (e.g. database owner, dashboard) can delete offending messages, guaranteeing client-side data immutability.
