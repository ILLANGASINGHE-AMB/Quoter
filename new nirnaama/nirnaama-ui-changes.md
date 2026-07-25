# Nirnaama UI/UX Changes

A summary of all improvements made to the Nirnaama (නිර්නාම) anonymous Sinhala message board.

---

## 1. Branded Loading Screen

**File:** `src/components/LoadingScreen.jsx` (new)

Replace the plain spinner with a branded splash that shows the quill logo, title, and tagline immediately — so users know what they're loading into.

```jsx
export default function LoadingScreen() {
  return (
    <div className="splash">
      <div className="splash-quill">🖊</div>
      <h1 className="splash-title">නිර්නාම</h1>
      <p className="splash-sub">අදහස් සහ සිතුවිලි නිදහසේ බෙදාගන්න</p>
      <div className="splash-spinner" />
    </div>
  );
}
```

```css
.splash {
  background: #F5F0E8;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  gap: 1rem;
  min-height: 100vh;
}
.splash-title { font-size: 28px; font-weight: 700; color: #3D2B1A; }
.splash-sub   { font-size: 14px; color: #7A5C3A; }
.splash-spinner {
  width: 28px; height: 28px;
  border: 2.5px solid #E0D8C8;
  border-top-color: #8B5E3C;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

---

## 2. Friendlier Anonymity Banner

**File:** `src/components/AnonBanner.jsx`

Softer tone, tighter copy, shield-lock icon instead of an alert circle.

**Before:**
```
⚠ නිර්නාමිකයි • සීමාවන් නොමැත
මෙහි කිසිදු ලියාපදිංචියක් අවශ්‍ය නොවේ. ඔබ පල කරන සෑම දෙයක්ම ක්ෂණිකව සහ සම්පූර්ණයෙන්ම නිර්නාමිකව පළ වේ. කරුණාකර පුද්ගලික තොරතුරු ඇතුළත් කිරීමෙන් වළකින්න.
```

**After:**
```
🛡 නිර්නාමිකයි · සීමාවන් නොමැත
ලියාපදිංචියක් අවශ්‍ය නොවේ. ඔබ ලියන සෑම දෙයක්ම සම්පූර්ණයෙන්ම නිර්නාමිකව පළ වේ.
```

```jsx
export default function AnonBanner() {
  return (
    <div className="banner">
      <i className="ti ti-shield-lock banner-icon" aria-hidden="true" />
      <div>
        <p className="banner-title">නිර්නාමිකයි · සීමාවන් නොමැත</p>
        <p className="banner-body">
          ලියාපදිංචියක් අවශ්‍ය නොවේ. ඔබ ලියන සෑම දෙයක්ම සම්පූර්ණයෙන්ම නිර්නාමිකව පළ වේ.
        </p>
      </div>
    </div>
  );
}
```

---

## 3. Polished Character Counter (limit raised to 500)

**File:** `src/components/ComposeBox.jsx`

Replaced the raw `> COUNT: 0 / 350` debug-style label with a slim progress bar and a `0 / 500` counter that changes colour as the user approaches the limit. Character limit raised from 350 to 500.

**Before:** `> COUNT: 0 / 350`

**After:** slim bar + `0 / 500`, amber at 80%, red at 100%, submit disabled when empty or over limit.

```jsx
import { useState } from "react";

export default function ComposeBox({ onSubmit }) {
  const [text, setText] = useState("");
  const MAX = 500;
  const pct = Math.min((text.length / MAX) * 100, 100);
  const isWarn = pct >= 80 && pct < 100;
  const isOver = text.length > MAX;

  return (
    <div className="compose">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="ඔබේ පණිවිඩය මෙහි ලියන්න..."
        maxLength={MAX}
      />
      <div className="compose-footer">
        <div className="counter-wrap">
          <div className="char-bar">
            <div
              className={`char-fill ${isOver ? "over" : isWarn ? "warn" : ""}`}
              style={{ width: pct + "%" }}
            />
          </div>
          <span className={`char-counter ${isOver ? "over" : isWarn ? "warn" : ""}`}>
            {text.length} / {MAX}
          </span>
        </div>
        <button
          className="submit-btn"
          disabled={text.trim().length === 0 || isOver}
          onClick={() => { onSubmit(text); setText(""); }}
        >
          පල කරන්න ↗
        </button>
      </div>
    </div>
  );
}
```

```css
.char-bar  { width: 56px; height: 3px; background: var(--border); border-radius: 99px; overflow: hidden; margin-right: 6px; }
.char-fill { height: 100%; border-radius: 99px; background: #8B5E3C; transition: width 0.15s, background 0.2s; }
.char-fill.warn { background: #BA7517; }
.char-fill.over { background: #A32D2D; }
.char-counter      { font-size: 12px; color: var(--text-muted); }
.char-counter.warn { color: #BA7517; }
.char-counter.over { color: #A32D2D; font-weight: 500; }
```

---

## 4. Feed Header — Sinhala-only label

**File:** `src/components/FeedHeader.jsx`

Removed the English `(Board Feed)` bracket from the section heading.

**Before:** `පණිවිඩ එකතුව (Board Feed)`

**After:** `පණිවිඩ එකතුව`

---

## 5. Relative Timestamps in Sinhala

**File:** `src/utils/relativeTime.js` (new)

Replaced cold US-format dates (`7/23/2026`) with warm relative labels in Sinhala.

```js
export function relativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 1)   return "දැන්";
  if (mins < 60)  return `මිනිත්තු ${mins}කට පෙර`;
  if (hours < 24) return `පැය ${hours}කට පෙර`;
  if (days === 1) return "ඊයේ";
  return `දින ${days}කට පෙර`;
}
```

**Usage in post card:**
```jsx
import { relativeTime } from "../utils/relativeTime";
// ...
<span className="post-time">{relativeTime(post.createdAt)}</span>
```

---

## 6. Post Cards — Reply Highlight

**File:** `src/components/PostCard.jsx`

Posts that have at least one reply get a warm left-border accent so they stand out in the feed.

```jsx
<div className={`post-card ${post.replyCount > 0 ? "has-replies" : ""}`}>
  ...
</div>
```

```css
.post-card.has-replies {
  border-left: 2.5px solid #C9A882;
  border-radius: 0 12px 12px 0;
}
```

---

## 7. Tab Bar for Feed Filtering

**File:** `src/components/FeedTabs.jsx` (new)

Added a tab bar so users can filter between all posts, today's posts, and popular posts.

```jsx
const TABS = ["සියල්ල", "අද", "ජනප්‍රිය"];

export default function FeedTabs({ active, onChange }) {
  return (
    <div className="tabs">
      {TABS.map(tab => (
        <button
          key={tab}
          className={`tab ${active === tab ? "active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
```

---

## 8. Empty State

**File:** `src/components/EmptyState.jsx` (new)

When a tab has no posts, show a friendly invitation instead of a plain `0` badge.

```jsx
export default function EmptyState() {
  return (
    <div className="empty-state">
      <i className="ti ti-writing" aria-hidden="true" />
      <p className="empty-title">අද තවම පණිවිඩ නැත</p>
      <p className="empty-body">පළමු අදහස ලියන්නේ ඔබ විය හැකිය.</p>
    </div>
  );
}
```

---

## 9. Refresh Button

**File:** `src/components/FeedHeader.jsx`

Added a "යළි පූරණය" (refresh) button to the top-right of the feed header. It spins during the fetch, disables itself to prevent double-taps, and shows a success toast on completion. Does **not** trigger the loading screen — only the message list reloads.

```jsx
import { useState } from "react";

export default function FeedHeader({ onRefresh, total, todayCount }) {
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  return (
    <>
      <div className="feed-header">
        <div className="feed-left">
          <span className="feed-title">පණිවිඩ එකතුව</span>
          <div className="feed-badges">
            <span className="badge badge-total">{total} පණිවිඩ</span>
            <span className="badge badge-today">අද: {todayCount}</span>
          </div>
        </div>
        <button
          className={`refresh-btn ${refreshing ? "spinning" : ""}`}
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh messages"
        >
          <i className="ti ti-refresh" aria-hidden="true" />
          <span>යළි පූරණය</span>
        </button>
      </div>

      {toastVisible && (
        <div className="refresh-toast show">
          <i className="ti ti-circle-check" aria-hidden="true" />
          <span>පණිවිඩ යළි පූරණය විය</span>
        </div>
      )}
    </>
  );
}
```

```css
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--surface-1);
  border: 0.5px solid var(--border);
  border-radius: 8px;
  padding: 5px 10px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.refresh-btn:hover    { border-color: var(--border-strong); color: #8B5E3C; }
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.refresh-btn.spinning .ti { animation: spin 0.6s linear infinite; }

.refresh-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #3D2B1A;
  color: #FFF8F0;
  font-size: 12px;
  padding: 8px 14px;
  border-radius: 8px;
  margin-bottom: 10px;
  animation: slideIn 0.25s ease;
}
@keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
```

---

## Summary of All Changes

| # | Change | Type | Files affected |
|---|--------|------|----------------|
| 1 | Branded loading screen | New component | `LoadingScreen.jsx` |
| 2 | Friendlier anonymity banner | Update | `AnonBanner.jsx` |
| 3 | Polished counter + 500 char limit | Update | `ComposeBox.jsx` |
| 4 | Sinhala-only feed label | Update | `FeedHeader.jsx` |
| 5 | Relative timestamps in Sinhala | New utility | `utils/relativeTime.js` |
| 6 | Reply highlight on post cards | Update | `PostCard.jsx` |
| 7 | Tab bar for feed filtering | New component | `FeedTabs.jsx` |
| 8 | Empty state design | New component | `EmptyState.jsx` |
| 9 | Refresh button with toast | Update | `FeedHeader.jsx` |
