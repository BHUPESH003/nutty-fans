# 🎨 NuttyFans UI Redesign — Cursor Agent Instructions

## MISSION

Redesign the entire frontend UI of this Next.js app to match the "Daylight Premium" design system from our Stitch designs. This is a **UI-only** operation. You must never modify business logic, API calls, data fetching, hooks, state management, authentication, or routing.

---

## ⚠️ ABSOLUTE GUARDRAILS — NEVER TOUCH

```
src/app/api/            ← ALL API routes are off-limits
src/lib/                ← All utilities, auth, db, cache
src/services/           ← All service layer
src/repositories/       ← All repository layer
src/hooks/              ← All custom hooks
src/types/              ← All TypeScript types
src/middleware.ts        ← Middleware off-limits
prisma/                 ← Database schema off-limits
```

**In component files**, you may ONLY change:

- `className` strings
- Inline `style` props (for design only)
- Wrapper `<div>` elements purely for layout
- Import statements for new fonts or icons

You must NEVER change:

- `onClick`, `onChange`, `onSubmit` handlers
- `useState`, `useEffect`, `useCallback`, `useMemo`
- `fetch`, `axios`, API call logic
- Props passed between components
- Conditional rendering logic (only the className inside conditions)
- `router.push`, `Link href`, navigation logic
- Form `action`, `method`, validation logic

---

## STEP 1 — Install Fonts

In `src/app/layout.tsx`, add these Google Fonts to the `<head>` (or via `next/font`):

```tsx
// Option A: next/font (preferred)
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['400', '500', '600', '700', '800'],
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

// Add both variables to <html> className
```

Also add Material Symbols to `src/app/layout.tsx` `<head>`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
  rel="stylesheet"
/>
```

---

## STEP 2 — Update Tailwind Config (`tailwind.config.ts`)

Replace the `theme.extend` section with the full design system tokens:

```ts
theme: {
  extend: {
    colors: {
      // Primary — Deep Rose
      'primary':                    '#ba0048',
      'primary-container':          '#e0245e',
      'on-primary':                 '#ffffff',
      'on-primary-container':       '#fffeff',
      'primary-fixed':              '#ffd9dd',
      'primary-fixed-dim':          '#ffb2bd',
      'on-primary-fixed':           '#400013',
      'on-primary-fixed-variant':   '#900036',
      'inverse-primary':            '#ffb2bd',

      // Secondary — Sky Blue
      'secondary':                  '#006399',
      'secondary-container':        '#35adff',
      'on-secondary':               '#ffffff',
      'on-secondary-container':     '#003f63',
      'secondary-fixed':            '#cde5ff',
      'secondary-fixed-dim':        '#95ccff',
      'on-secondary-fixed':         '#001d32',
      'on-secondary-fixed-variant': '#004a75',

      // Tertiary — Crimson
      'tertiary':                   '#bc002d',
      'tertiary-container':         '#eb003b',
      'on-tertiary':                '#ffffff',
      'on-tertiary-container':      '#fffeff',
      'tertiary-fixed':             '#ffdad9',
      'tertiary-fixed-dim':         '#ffb3b3',
      'on-tertiary-fixed':          '#400009',
      'on-tertiary-fixed-variant':  '#920021',

      // Surface & Background
      'background':                 '#fbf8ff',
      'on-background':              '#1b1b20',
      'surface':                    '#fbf8ff',
      'surface-dim':                '#dcd9e0',
      'surface-bright':             '#fbf8ff',
      'surface-tint':               '#bd0049',
      'surface-variant':            '#e4e1e9',
      'surface-container-lowest':   '#ffffff',
      'surface-container-low':      '#f6f2fa',
      'surface-container':          '#f0ecf4',
      'surface-container-high':     '#eae7ee',
      'surface-container-highest':  '#e4e1e9',
      'on-surface':                 '#1b1b20',
      'on-surface-variant':         '#5b4043',
      'inverse-surface':            '#303035',
      'inverse-on-surface':         '#f3eff7',

      // Outline
      'outline':                    '#8f6f73',
      'outline-variant':            '#e3bdc1',

      // Error
      'error':                      '#ba1a1a',
      'error-container':            '#ffdad6',
      'on-error':                   '#ffffff',
      'on-error-container':         '#93000a',
    },
    fontFamily: {
      headline: ['Plus Jakarta Sans', 'sans-serif'],
      body:     ['Inter', 'sans-serif'],
      label:    ['Inter', 'sans-serif'],
    },
    borderRadius: {
      DEFAULT: '1rem',    // 16px — standard cards/inputs
      'sm':    '0.5rem',  // 8px
      'md':    '0.75rem', // 12px
      'lg':    '2rem',    // 32px — large panels
      'xl':    '3rem',    // 48px — hero sections
      'full':  '9999px',  // pills/avatars
    },
    boxShadow: {
      'ambient':   '0 8px 32px rgba(186, 0, 72, 0.08)',
      'card':      '0 2px 16px rgba(27, 27, 32, 0.06)',
      'modal':     '0 16px 64px rgba(27, 27, 32, 0.12)',
      'glow':      '0 0 0 3px rgba(255, 217, 221, 0.6)',
    },
  },
},
```

---

## STEP 3 — Update Global CSS (`src/app/globals.css`)

Replace the entire file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Base Reset ─── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #fbf8ff;
  color: #1b1b20;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* ─── Material Symbols ─── */
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
  user-select: none;
}
.material-symbols-filled {
  font-variation-settings:
    'FILL' 1,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}

/* ─── Glassmorphism ─── */
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.glass-dark {
  background: rgba(27, 27, 32, 0.75);
  backdrop-filter: blur(20px);
}

/* ─── Navigation ─── */
.nav-item-active {
  background-color: rgba(186, 0, 72, 0.06);
  color: #ba0048;
  font-weight: 600;
  border-radius: 9999px;
}
.nav-item-active-bordered {
  border-left: 3px solid #e0245e;
  background-color: rgba(224, 36, 94, 0.05);
  color: #e0245e;
}

/* ─── Story Rings ─── */
.story-ring {
  border: 2px solid #e4e1e9;
  padding: 2px;
  border-radius: 9999px;
}
.story-ring-live {
  border: 2px solid #bc002d;
  padding: 2px;
  border-radius: 9999px;
}

/* ─── LIVE Badge Pulse ─── */
@keyframes live-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(188, 0, 45, 0.5);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(188, 0, 45, 0);
  }
}
.badge-live {
  background-color: #bc002d;
  color: #ffffff;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  animation: live-pulse 2s ease-in-out infinite;
}

/* ─── Scrollbar Hide ─── */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* ─── Focus Ring Override ─── */
input:focus,
textarea:focus,
select:focus,
button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 217, 221, 0.6);
}

/* ─── Verified Badge Halo ─── */
.verified-halo {
  filter: drop-shadow(0 0 0 1px #ffffff);
}
```

---

## STEP 4 — Redesign Shared Layout Components

### 4A. `src/components/layout/AppShell.tsx`

Redesign the desktop sidebar with these exact specs:

**Sidebar (desktop, `w-64`, fixed left, full height):**

```
- bg: white (#ffffff), no hard border-r (use border-r border-zinc-50 max)
- Brand: "NuttyFans" in Plus Jakarta Sans font-black text-2xl text-primary (rose)
- Nav items (inactive): flex items-center gap-3 px-4 py-3, text-neutral-600,
  font-medium, hover:bg-neutral-100, rounded-full transition
- Nav items (active): same + bg-primary/5 text-primary font-bold
- Icons: <span className="material-symbols-outlined"> — replace ALL Lucide/Heroicon icons
- "Create Post" CTA: w-full bg-primary-container text-white py-3 rounded-full
  font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90
- Profile card at bottom: flex items-center gap-3 p-3 bg-surface-container-low
  rounded-xl mt-auto
```

**Mobile bottom navigation:**

```
- fixed bottom-0, full width
- glass background (bg-white/80 backdrop-blur-xl)
- 5 icons max, active = text-primary, inactive = text-neutral-400
- No labels, just icons (or very small labels below)
```

**Top header bar:**

```
- sticky top-0 z-40
- glass: bg-white/90 backdrop-blur-xl
- border-b border-surface-container-high
- Search input: bg-surface-container-low rounded-full pl-12, no hard border
  focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest
- Search icon: material-symbols-outlined "search"
- Notification bell: rounded-full hover:bg-surface-container-low relative
  (red dot badge: w-2 h-2 bg-primary rounded-full absolute top-2 right-2)
```

### 4B. `src/components/ui/button.tsx`

Update all button variants:

```tsx
const variants = {
  // Primary: pill-shaped, rose gradient
  default: "bg-primary-container text-white rounded-full font-headline font-bold
            shadow-ambient hover:opacity-90 active:scale-95 transition-all",

  // Secondary: glass-style
  secondary: "bg-surface-container-high text-on-surface rounded-full font-medium
              hover:bg-surface-container-highest transition-all",

  // Outline: ghost border
  outline: "border border-outline-variant text-primary rounded-full font-bold
            hover:bg-primary/5 transition-all",

  // Ghost: text-only
  ghost: "text-on-surface-variant hover:text-primary hover:bg-primary/5
          rounded-full transition-all",

  // Destructive
  destructive: "bg-error text-on-error rounded-full font-bold hover:opacity-90",
}

const sizes = {
  sm:      "px-4 py-2 text-xs",
  default: "px-6 py-3 text-sm",
  lg:      "px-8 py-4 text-base",
  icon:    "w-10 h-10 flex items-center justify-center",
}
```

### 4C. `src/components/ui/input.tsx`

```tsx
// Base input classes:
"w-full bg-surface-container-low border-none rounded-[12px] py-3 px-4
 text-on-surface placeholder:text-on-surface-variant
 focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest
 transition-all outline-none text-sm"
```

### 4D. `src/components/ui/card.tsx`

```tsx
// Card: tonal stacking — no hard border
const Card = 'bg-surface-container-lowest rounded-[12px] shadow-card overflow-hidden';
const CardHeader = 'p-5 pb-3';
const CardContent = 'px-5 pb-5';
// NO divider lines between sections — use spacing gaps instead
```

### 4E. `src/components/ui/badge.tsx`

```tsx
const badgeVariants = {
  default:
    'bg-primary-container/10 text-primary-container rounded-full px-3 py-1 text-xs font-bold',
  secondary: 'bg-secondary/10 text-secondary rounded-full px-3 py-1 text-xs font-bold',
  live: 'badge-live', // uses CSS animation class from globals
  verified: 'bg-secondary text-white rounded-full px-2 py-0.5 text-[10px] font-bold verified-halo',
  outline: 'border border-outline-variant text-on-surface-variant rounded-full px-3 py-1 text-xs',
};
```

---

## STEP 5 — Redesign Pages (Covered by Stitch Designs)

### 5A. Home Feed — `src/app/(app)/page.tsx` + `src/components/feed/` + `src/components/home/`

**Layout:**

```
Desktop: 3-column
  - Col 1: Sidebar (w-64 fixed) — from AppShell
  - Col 2: Feed (ml-64 max-w-[680px] min-h-screen border-r border-surface-container-high)
  - Col 3: Right panel (w-80 fixed right, hidden on <xl screens)

Mobile: Single column with bottom nav
```

**Feed header (sticky):**

```
- glass: bg-white/90 backdrop-blur-xl
- Search bar + notification bell
- No page title (let the feed speak)
```

**Creator stories row:**

```
- Horizontal scroll, no-scrollbar
- Heading: "Top Creators" font-headline font-bold text-lg + "See all" link text-primary-container text-xs
- Story items: flex-col items-center gap-2 flex-shrink-0
- Avatar ring: story-ring or story-ring-live class
- LIVE label: badge-live class, absolute -bottom-1 centered
- Name: text-[11px] font-medium max-w-[70px] truncate
```

**Post cards (`src/components/posts/PostCard.tsx`):**

```
- Wrapper: bg-surface-container-lowest rounded-[12px] shadow-card border border-surface-container-high mb-6
- NO divider lines — use padding/spacing only
- Author row: p-4, avatar rounded-full, name font-headline font-bold text-sm,
  handle text-xs text-on-surface-variant, timestamp text-xs text-on-surface-variant
- Verified badge: text-secondary material-symbols-outlined "verified" text-base
- Media: full-width, no border-radius on media itself (it's clipped by card overflow-hidden)
- Paywall overlay: absolute inset-0, backdrop-blur-md bg-surface/70,
  centered lock icon + "Subscribe to unlock" + CTA button
- Interactions row: p-3, flex gap-1, icon buttons rounded-full
  hover:bg-surface-container-low
  - Like: heart icon, liked = text-primary
  - Comment: chat_bubble icon
  - Tip: toll icon
  - Share: share icon
  - Bookmark: bookmark icon (right-aligned)
```

**Right panel (desktop only, fixed right, w-80):**

```
- bg-white p-6 space-y-8
- "Suggested Creators" section: heading font-headline font-bold + list
- Creator list item: flex items-center gap-3, avatar w-10 h-10 rounded-full,
  name font-bold text-sm, handle text-xs text-on-surface-variant,
  "Follow" button: text-xs border border-outline-variant rounded-full px-3 py-1
```

---

### 5B. Explore — `src/app/(app)/explore/page.tsx` + `src/components/explore/`

**Layout:**

```
Desktop: sidebar + main (ml-64 mr-80) + right panel (w-80 fixed right)
```

**Sticky control bar:**

```
- glass-nav + border-b-0
- Search input: rounded-full bg-surface-container-low no border
- Filter tabs: text-primary border-b-2 border-primary for active,
  text-on-surface-variant for inactive — NO underline box, just border-b
- Tab items: "All", "Creators", "Photos", "Videos", "Live"
```

**Category grid (`src/components/explore/CategoryGrid.tsx`):**

```
- grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4
- Category card: relative rounded-[12px] overflow-hidden aspect-square
  gradient overlay from transparent to black/60
  label: absolute bottom-3 left-3 text-white font-headline font-bold text-sm
```

**Trending creators (`src/components/explore/TrendingCreators.tsx`):**

```
- Horizontal scroll row for mobile, grid for desktop
- Creator card: bg-surface-container-lowest rounded-[16px] p-4 shadow-card
  avatar w-16 h-16 rounded-full mx-auto mb-3
  name font-headline font-bold text-sm text-center
  handle text-xs text-on-surface-variant text-center
  "Subscribe" pill button: w-full mt-3 bg-primary-container text-white rounded-full text-xs font-bold py-2
```

**Masonry feed:**

```
- grid grid-cols-2 gap-3 (mobile)
- grid grid-cols-3 gap-4 (desktop)
- Post tiles: rounded-[12px] overflow-hidden relative aspect-[3/4]
  hover: scale-[1.02] transition-transform
  overlay on hover: bg-black/40, show title + creator name
```

---

### 5C. Messages — `src/app/(app)/messages/` + `src/components/messaging/`

**Layout (desktop):**

```
3-panel:
  Panel 1: Sidebar (w-64 fixed) — AppShell
  Panel 2: Conversation list (w-[340px] border-r border-surface-container-high bg-white)
  Panel 3: Chat window (flex-1 bg-surface)
```

**Conversation list (`src/components/messaging/ConversationList.tsx`):**

```
- Header: p-6 pb-4
  Title "Messages" font-headline font-extrabold text-xl tracking-tight
  New message button: w-10 h-10 rounded-full border border-surface-container-high
    icon: edit_square material-symbols-outlined
- Action buttons row:
  "Broadcast" pill: bg-primary-container text-white rounded-full text-xs font-bold
  "Requests" pill: border border-outline-variant text-primary rounded-full text-xs font-bold
- Search: bg-surface-container-low rounded-full no border
- Conversation items: NO dividers — gap-0 with hover:bg-surface-container-low
  py-4 px-6 flex items-center gap-3
  Avatar: w-12 h-12 rounded-full, LIVE ring if applicable
  Name: font-bold text-sm, Last message: text-sm text-on-surface-variant truncate
  Time: text-xs text-on-surface-variant
  Unread badge: w-5 h-5 bg-primary text-white rounded-full text-xs font-bold
```

**Chat window (`src/components/messaging/ChatWindow.tsx`):**

```
- Header: glass bg-white/90 backdrop-blur-sm border-b border-surface-container-high
  p-4 flex items-center gap-3
  Back arrow (mobile), avatar, name font-headline font-bold, "Online" text-xs text-secondary
- Messages area: flex-1 overflow-y-auto p-6 space-y-4 bg-surface no-scrollbar
- Message bubbles (`src/components/messaging/MessageBubble.tsx`):
  Sent (mine): bg-primary-container text-white rounded-[18px] rounded-br-[4px]
               max-w-[75%] ml-auto px-4 py-3 text-sm
  Received: bg-surface-container-lowest text-on-surface rounded-[18px] rounded-bl-[4px]
            max-w-[75%] mr-auto px-4 py-3 text-sm shadow-card
  Timestamp: text-[10px] text-on-surface-variant mt-1 text-right
- Locked message: bg-surface-container-low rounded-[18px] p-4 flex items-center gap-3
  lock icon text-primary, "Unlock for $X" text-sm font-bold text-primary,
  "Unlock" button pill bg-primary-container text-white text-xs px-4 py-2 rounded-full
- Input bar (`src/components/messaging/MessageInput.tsx`):
  sticky bottom-0 bg-white/90 backdrop-blur-xl border-t border-surface-container-high p-4
  flex items-center gap-3
  Attachment button: w-10 h-10 rounded-full hover:bg-surface-container-low icon: attach_file
  Input: flex-1 bg-surface-container-low rounded-full px-4 py-3 text-sm no border
  Send button: w-10 h-10 rounded-full bg-primary-container text-white icon: send
```

---

### 5D. Subscriptions — `src/app/subscriptions/page.tsx` + `src/components/containers/subscriptions/`

**Layout:**

```
Full-width main content (with sidebar from AppShell)
```

**Subscription card grid:**

```
- Heading: font-headline font-black text-3xl + subtitle text-on-surface-variant
- Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Subscription card:
  bg-surface-container-lowest rounded-[20px] p-5 shadow-card
  overflow-hidden relative
  Top: Creator avatar w-14 h-14 rounded-full, name font-headline font-bold text-base,
  handle text-xs text-on-surface-variant
  Status badge: "Active" bg-secondary/10 text-secondary rounded-full px-3 py-1 text-xs font-bold
  "Expired" bg-surface-container text-on-surface-variant rounded-full px-3 py-1 text-xs
  Price row: text-2xl font-headline font-black text-on-surface + "/mo" text-on-surface-variant text-sm
  Renewal: text-xs text-on-surface-variant "Renews Jan 15"
  CTA: "Manage" pill button border border-outline-variant text-primary rounded-full px-4 py-2 text-xs font-bold
```

---

### 5E. Settings — `src/app/(app)/settings/page.tsx` + `src/components/containers/settings/`

**Layout (desktop):**

```
3-column: AppShell sidebar + Settings nav (w-64) + Settings content (flex-1)
```

**Settings nav panel:**

```
- bg-white border-r border-zinc-50 h-screen sticky top-0 overflow-y-auto no-scrollbar
- Title: "Settings" font-headline font-bold text-2xl p-8 pb-4
- Section labels: text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-4 mb-3
- Menu items:
  Active: font-semibold text-primary-container active-rose-border bg-rose-50/30 px-4 py-2.5 text-sm
  Inactive: font-medium text-zinc-500 hover:text-zinc-900 px-4 py-2.5 text-sm transition-colors
```

**Settings content area:**

```
- bg-background flex-1 p-8 max-w-[600px]
- Section title: font-headline font-bold text-xl mb-6
- Form groups: space-y-6
- Labels: text-sm font-semibold text-on-surface mb-1.5
- Inputs: use updated input variant from Step 4C
- Toggle/Switch: use secondary color for active state
- Save button: bg-primary-container text-white rounded-full px-8 py-3 font-bold text-sm
- Danger zone: bg-error-container/30 rounded-[16px] p-5
  label text-error font-bold
  button: border border-error text-error rounded-full px-6 py-2.5 text-sm
```

---

### 5F. Cart / Checkout — `src/app/(app)/wallet/page.tsx` + `src/components/payments/`

**Subscription checkout modal / page:**

```
- Modal: bg-surface-container-lowest rounded-[24px] shadow-modal p-8 max-w-[480px]
  NO hard border
- Creator info at top: avatar w-16 h-16 rounded-full, name font-headline font-bold text-xl,
  handle text-on-surface-variant text-sm, verified badge
- Price block: text-4xl font-headline font-black text-on-surface + "/month"
- Tier cards: bg-surface-container-low rounded-[16px] p-4 mb-3
  Selected: border-2 border-primary-container bg-primary/5
  Unselected: border border-transparent hover:border-outline-variant
  Price: font-headline font-black text-lg text-primary
  Features: text-sm text-on-surface-variant space-y-1
- Subscribe CTA: w-full bg-primary-container text-white py-4 rounded-full
  font-headline font-bold text-base shadow-ambient hover:opacity-90 active:scale-[0.98]
- Secure badge row: text-xs text-on-surface-variant flex items-center gap-1
  lock icon text-secondary
```

**Wallet card (`src/components/payments/WalletCard.tsx`):**

```
- bg-gradient-to-br from-primary to-primary-container rounded-[24px] p-6 text-white
- Balance: text-4xl font-headline font-black
- "Available Balance" label: text-sm opacity-80
- Top up button: bg-white/20 text-white rounded-full px-6 py-2.5 text-sm font-bold
  hover:bg-white/30 backdrop-blur-sm
```

---

## STEP 6 — Redesign Pages NOT Covered (Infer from Design System)

Apply these rules to all remaining pages using the same tokens:

### Auth Pages (`src/app/(auth)/`)

**Login / Register:**

```
- Full-page: bg-background
- Card: bg-surface-container-lowest max-w-[420px] mx-auto mt-20 rounded-[24px]
  shadow-modal p-8
- Brand: "NuttyFans" font-headline font-black text-3xl text-primary text-center mb-2
- Tagline: text-on-surface-variant text-sm text-center mb-8
- Input group: space-y-4
- Inputs: use updated input (Step 4C)
- Primary CTA: full-width bg-primary-container text-white rounded-full py-4
  font-headline font-bold shadow-ambient
- Divider: "or continue with" text-xs text-on-surface-variant —
  use tonal lines (bg-surface-container-high h-px), NOT dark lines
- OAuth buttons: bg-surface-container-low rounded-full py-3 px-6 font-medium text-sm
  border border-outline-variant/50 hover:bg-surface-container
- Footer link: text-primary font-semibold hover:underline
```

**Forgot/Reset Password:**

```
Same card pattern. Add a back arrow: text-on-surface-variant hover:text-primary
```

**Age Gate / Age Verification:**

```
Same card pattern. Add a warning icon in tertiary color.
```

### Notifications — `src/app/(app)/notifications/page.tsx`

```
- Page header: font-headline font-black text-2xl + "Mark all read" text button text-primary
- Notification items: NO dividers — gap-4 spacing
  flex items-start gap-4 p-4 rounded-[12px] hover:bg-surface-container-low
  Unread: bg-primary/5 (light tint)
  Avatar: w-10 h-10 rounded-full
  Icon badge over avatar: w-5 h-5 rounded-full absolute -bottom-1 -right-1
    Like = bg-primary, Comment = bg-secondary, Tip = bg-tertiary
  Text: font-medium text-sm text-on-surface, time text-xs text-on-surface-variant
```

### Profile Pages — `src/components/profile/`

**Profile header (`ProfileHeader.tsx`):**

```
- Banner: aspect-[3/1] bg-surface-container-high relative overflow-hidden rounded-b-[24px]
- Avatar: w-24 h-24 rounded-full border-4 border-surface-container-lowest shadow-card
  positioned -bottom-12 left-6 absolute
- Stats row: flex gap-8 mt-16 px-6
  stat: font-headline font-black text-xl + label text-xs text-on-surface-variant
- Subscribe button: bg-primary-container text-white rounded-full px-8 py-3
  font-headline font-bold shadow-ambient
- Message button: border border-outline-variant text-primary rounded-full px-6 py-3
  font-bold
```

**Profile tabs (`ProfileTabs.tsx`):**

```
- Tab bar: border-b border-surface-container-high
- Tab: px-6 py-4 font-headline font-semibold text-sm
  Active: text-primary border-b-2 border-primary
  Inactive: text-on-surface-variant hover:text-on-surface
- NO box/pill style tabs — use underline pattern only
```

**Profile bio (`ProfileBio.tsx`):**

```
- bg-surface-container-lowest rounded-[16px] p-5 shadow-card
- Bio text: text-sm text-on-surface leading-relaxed
- Social links: flex gap-3, each link rounded-full bg-surface-container-low
  hover:bg-surface-container px-3 py-1.5 text-sm text-primary font-medium
```

### Reels — `src/app/(app)/reels/page.tsx` + `src/components/reels/`

```
- Full-screen vertical scroll snap
- Each reel: h-screen w-full relative bg-black
- Overlay gradient: absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
- Creator info: absolute bottom-20 left-4 text-white
  name font-headline font-bold text-base + @handle text-sm opacity-80
- Action sidebar: absolute right-4 bottom-24 flex flex-col gap-6 items-center
  Like: heart icon + count (text-white text-xs)
  Comment: chat_bubble + count
  Share: share + count
  Each: w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center
```

### Live Streams — `src/app/(app)/live/`

**Live list page:**

```
- Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Stream card: relative rounded-[16px] overflow-hidden aspect-video bg-black shadow-card
  LIVE badge (badge-live class) absolute top-3 left-3
  Viewer count: absolute top-3 right-3 bg-black/60 text-white text-xs rounded-full px-2 py-1
  Creator info bar: absolute bottom-0 left-0 right-0
    bg-gradient-to-t from-black/80 p-4
    name text-white font-headline font-bold text-sm
```

### Creator Dashboard — `src/app/(creator)/creator/dashboard/page.tsx`

```
- Stats grid: grid grid-cols-2 lg:grid-cols-4 gap-4
- Stat card: bg-surface-container-lowest rounded-[20px] p-5 shadow-card
  Icon: w-10 h-10 rounded-full flex items-center justify-center
    Earnings: bg-primary/10 icon text-primary
    Subscribers: bg-secondary/10 icon text-secondary
    Views: bg-surface-container-high icon text-on-surface
  Value: font-headline font-black text-2xl mt-3
  Label: text-xs text-on-surface-variant mt-1
  Trend: text-xs font-bold (positive=text-secondary, negative=text-error) flex items-center gap-1
- Charts: bg-surface-container-lowest rounded-[20px] p-5 shadow-card
  Chart title: font-headline font-bold text-base mb-4
```

### Creator Posts — `src/app/(creator)/creator/posts/`

**New post form (`src/components/containers/creator/NewPostContainer.tsx`):**

```
- Two-column on desktop: left = form, right = preview
- Media upload zone: bg-surface-container-low rounded-[20px] border-2
  border-dashed border-outline-variant p-12 text-center
  hover: border-primary bg-primary/5 transition-all
  Icon: upload material-symbols-outlined text-4xl text-on-surface-variant
  Text: "Drop media here or click to upload" text-sm text-on-surface-variant
- Form fields: use updated inputs
- Paywall toggle: custom styled switch using secondary color
- Price input: has "$" prefix in bg-surface-container-high rounded-l-[12px] px-4
```

---

## STEP 7 — Icon Migration (Critical)

Replace ALL Lucide icons and Heroicons with Material Symbols Outlined. Use this mapping:

| Old Icon (Lucide)      | New Material Symbol             |
| ---------------------- | ------------------------------- |
| `Home`                 | `home`                          |
| `Compass`/`Explore`    | `explore`                       |
| `Bell`                 | `notifications`                 |
| `Mail`/`MessageCircle` | `mail` / `chat_bubble`          |
| `Heart`                | `favorite`                      |
| `Bookmark`             | `bookmark`                      |
| `Share2`               | `share`                         |
| `Search`               | `search`                        |
| `Settings`/`Cog`       | `settings`                      |
| `User`/`Person`        | `person`                        |
| `Plus`/`PlusCircle`    | `add` / `add_circle`            |
| `Edit`/`Pencil`        | `edit` / `edit_square`          |
| `Trash`                | `delete`                        |
| `Lock`/`LockIcon`      | `lock`                          |
| `Unlock`               | `lock_open`                     |
| `Camera`               | `photo_camera`                  |
| `Video`                | `videocam`                      |
| `Upload`               | `upload`                        |
| `Download`             | `download`                      |
| `X`/`Close`            | `close`                         |
| `Check`                | `check`                         |
| `ChevronRight`         | `chevron_right`                 |
| `ChevronLeft`          | `chevron_left`                  |
| `ChevronDown`          | `expand_more`                   |
| `ArrowLeft`            | `arrow_back`                    |
| `ArrowRight`           | `arrow_forward`                 |
| `MoreHorizontal`       | `more_horiz`                    |
| `MoreVertical`         | `more_vert`                     |
| `DollarSign`           | `payments` / `toll`             |
| `Wallet`               | `account_balance_wallet`        |
| `Star`                 | `star`                          |
| `Eye`/`EyeOff`         | `visibility` / `visibility_off` |
| `Copy`                 | `content_copy`                  |
| `Link`                 | `link`                          |
| `ExternalLink`         | `open_in_new`                   |
| `AlertTriangle`        | `warning`                       |
| `Info`                 | `info`                          |
| `CheckCircle`          | `check_circle`                  |
| `XCircle`              | `cancel`                        |
| `Play`                 | `play_arrow`                    |
| `Pause`                | `pause`                         |
| `Volume2`/`VolumeX`    | `volume_up` / `volume_off`      |
| `Maximize`             | `fullscreen`                    |
| `Live`/`Radio`         | `live_tv`                       |
| `Verified`             | `verified`                      |
| `Send`                 | `send`                          |
| `Attach`/`Paperclip`   | `attach_file`                   |
| `Gift`                 | `redeem`                        |
| `Zap`/`Bolt`           | `bolt`                          |

Usage pattern:

```tsx
// Before (Lucide):
import { Heart } from 'lucide-react'
<Heart className="w-5 h-5 text-primary" />

// After (Material Symbols):
<span className="material-symbols-outlined text-[20px] text-primary">favorite</span>

// Filled variant:
<span className="material-symbols-outlined text-[20px] text-primary"
      style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
```

---

## STEP 8 — Typography Application Rules

Apply consistently across all components:

```
Display (hero headings):   font-headline text-4xl md:text-5xl font-black tracking-tight
H1 (page titles):          font-headline text-2xl md:text-3xl font-bold tracking-tight
H2 (section headings):     font-headline text-xl font-bold
H3 (card titles):          font-headline text-base font-bold
Body large:                text-base text-on-surface leading-relaxed
Body default:              text-sm text-on-surface
Body small / meta:         text-xs text-on-surface-variant
Labels / caps:             text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant
Price / numbers:           font-headline font-black (inherit size from context)
```

---

## STEP 9 — Spacing & Layout Rules

```
Page max-width:    max-w-[1440px] mx-auto
Content max-width: max-w-[680px] (feed column)
Section gaps:      space-y-8 (between major sections)
Card padding:      p-5 (standard), p-4 (compact), p-6 (generous)
List item gaps:    gap-4 (NO dividers — spacing replaces lines)
Form group gaps:   space-y-4
Button groups:     flex gap-3
Icon size:         text-[20px] (standard), text-[24px] (prominent), text-[16px] (compact)
Avatar sizes:      w-8 h-8 (tiny), w-10 h-10 (nav), w-12 h-12 (list), w-16 h-16 (card), w-24 h-24 (profile)
```

---

## STEP 10 — Responsive Breakpoints

```
Mobile (<768px):
  - Bottom navigation bar (fixed, glass)
  - Single column layout
  - Sidebars hidden (hidden md:flex)
  - Cards full-width with horizontal padding px-4
  - Grids: grid-cols-1 or grid-cols-2

Tablet (768-1024px):
  - Sidebar appears (condensed, icons only or w-16)
  - 2-column grids

Desktop (>1024px):
  - Full 3-column layout
  - All panels visible
  - Right panel appears (hidden xl:block)
```

---

## EXECUTION ORDER

Follow this exact order to avoid broken states:

1. `tailwind.config.ts` — design tokens
2. `src/app/globals.css` — global styles + utility classes
3. `src/app/layout.tsx` — fonts
4. `src/components/ui/button.tsx` — base component
5. `src/components/ui/input.tsx` — base component
6. `src/components/ui/card.tsx` — base component
7. `src/components/ui/badge.tsx` — base component
8. `src/components/layout/AppShell.tsx` — shell (affects every page)
9. `src/components/layout/PageHeader.tsx`
10. `src/components/posts/PostCard.tsx` — core feed component
11. `src/app/(app)/page.tsx` — home feed
12. `src/app/(app)/explore/page.tsx` + explore components
13. `src/app/(app)/messages/` + messaging components
14. `src/app/subscriptions/page.tsx` + subscription components
15. `src/app/(app)/settings/page.tsx` + settings components
16. `src/app/(app)/wallet/page.tsx` + payment components
17. Auth pages (`src/app/(auth)/`)
18. `src/app/(app)/notifications/page.tsx`
19. Profile components (`src/components/profile/`)
20. `src/app/(app)/reels/page.tsx` + reel components
21. `src/app/(app)/live/` + live components
22. Creator pages (`src/app/(creator)/`)
23. All remaining pages — apply design tokens and infer style

---

## VERIFICATION CHECKLIST

After each file, verify:

- [ ] No business logic was changed
- [ ] No `import` of service/hook/API files was removed
- [ ] All existing props are still passed correctly
- [ ] Component still renders without TypeScript errors
- [ ] No hard-coded `#000000` borders or lines
- [ ] No Lucide icons remain (all replaced with Material Symbols)
- [ ] All interactive states (hover, focus, active) are styled
- [ ] Mobile and desktop layouts are both handled

---

_Design system: "Daylight Premium" by Stitch / Google. North Star: "The Luminous Curator."_
_Brand colors: Primary Rose `#ba0048`, Deep Crimson CTA `#e0245e`, Sky Blue `#006399`_
_Typography: Plus Jakarta Sans (headlines) + Inter (body)_
