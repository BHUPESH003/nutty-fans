# NuttyFans — UI/UX Design Blueprint

**Version:** 1.0  
**Last Updated:** December 12, 2025  
**Document Owner:** Design Team

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Information Architecture](#3-information-architecture)
4. [User Journeys](#4-user-journeys)
5. [Wireframes](#5-wireframes)
6. [Component Library](#6-component-library)
7. [Interaction Patterns](#7-interaction-patterns)

---

## 1. Design Philosophy

### 1.1 Design Principles

| Principle                  | Description                                       |
| -------------------------- | ------------------------------------------------- |
| **Premium Minimalism**     | Clean, editorial aesthetic inspired by Hidden.com |
| **Content-First**          | UI serves the content, not the other way around   |
| **Progressive Disclosure** | Show complexity only when needed                  |
| **Trust & Safety**         | Clear visual cues for verification, safety        |
| **Mobile-First**           | Designed for mobile, enhanced for desktop         |
| **Accessible**             | WCAG 2.1 AA compliant                             |

### 1.2 Brand Personality

```
┌─────────────────────────────────────────────────────────────────┐
│                    BRAND PERSONALITY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     Premium ●────────────────────────────○ Casual               │
│                                                                 │
│        Bold ○────────────────●──────────○ Subtle                │
│                                                                 │
│  Expressive ○──────────●────────────────○ Restrained            │
│                                                                 │
│   Masculine ○─────────────────●─────────○ Feminine              │
│                                                                 │
│     Playful ○──────●────────────────────○ Serious               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Visual References

**Primary Inspiration:** Hidden.com

- Clean typography
- Generous whitespace
- Muted color palette with bold accents
- Editorial-style layouts
- Minimal UI chrome

**Secondary Inspiration:**

- Notion (clean interface)
- Linear (premium SaaS aesthetic)
- Glossier (brand warmth)

---

## 2. Design System

### 2.1 Color Palette

```
┌─────────────────────────────────────────────────────────────────┐
│                      COLOR PALETTE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMARY                                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ #0A0A0A │ │ #1A1A1A │ │ #2A2A2A │ │ #3A3A3A │ │ #4A4A4A │   │
│  │  Black  │ │ Dark    │ │ Charcoal│ │ Gray    │ │ Muted   │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                 │
│  NEUTRAL                                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ #F5F5F5 │ │ #E5E5E5 │ │ #D4D4D4 │ │ #A3A3A3 │ │ #737373 │   │
│  │  White  │ │ Light   │ │ Border  │ │ Muted   │ │ Text    │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                 │
│  ACCENT                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ #FF3366 │ │ #10B981 │ │ #3B82F6 │ │ #F59E0B │ │ #8B5CF6 │   │
│  │ Primary │ │ Success │ │  Info   │ │ Warning │ │ Premium │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSS Variables:**

```css
:root {
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e5e5e5;
  --bg-dark: #0a0a0a;

  /* Text */
  --text-primary: #0a0a0a;
  --text-secondary: #737373;
  --text-muted: #a3a3a3;
  --text-inverse: #ffffff;

  /* Accent */
  --accent-primary: #ff3366;
  --accent-primary-hover: #e6295c;
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --accent-error: #ef4444;

  /* Border */
  --border-light: #e5e5e5;
  --border-medium: #d4d4d4;
}
```

### 2.2 Typography

```
┌─────────────────────────────────────────────────────────────────┐
│                      TYPOGRAPHY SCALE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FONT FAMILY                                                    │
│  Primary: "Söhne", "Inter", system-ui, sans-serif               │
│  Display: "Playfair Display", Georgia, serif                    │
│  Mono: "SF Mono", "Fira Code", monospace                        │
│                                                                 │
│  SCALE                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Display    │ 48px / 56px │ 600 │ -0.02em │ Headings    │   │
│  │ H1         │ 36px / 44px │ 600 │ -0.02em │ Page Title  │   │
│  │ H2         │ 28px / 36px │ 600 │ -0.01em │ Section     │   │
│  │ H3         │ 22px / 28px │ 600 │ -0.01em │ Card Title  │   │
│  │ H4         │ 18px / 24px │ 600 │  0      │ Subsection  │   │
│  │ Body Large │ 18px / 28px │ 400 │  0      │ Intro text  │   │
│  │ Body       │ 16px / 24px │ 400 │  0      │ Default     │   │
│  │ Body Small │ 14px / 20px │ 400 │  0      │ Secondary   │   │
│  │ Caption    │ 12px / 16px │ 400 │  0.01em │ Labels      │   │
│  │ Overline   │ 11px / 14px │ 600 │  0.1em  │ Categories  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Spacing System

```
┌─────────────────────────────────────────────────────────────────┐
│                      SPACING SCALE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Base unit: 4px                                                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Token      │ Value  │ Use Case                            │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ space-1    │ 4px    │ Tight spacing, icons                │ │
│  │ space-2    │ 8px    │ Related elements                    │ │
│  │ space-3    │ 12px   │ Component padding                   │ │
│  │ space-4    │ 16px   │ Standard gap                        │ │
│  │ space-5    │ 20px   │ Card padding                        │ │
│  │ space-6    │ 24px   │ Section spacing                     │ │
│  │ space-8    │ 32px   │ Large gaps                          │ │
│  │ space-10   │ 40px   │ Section margins                     │ │
│  │ space-12   │ 48px   │ Page sections                       │ │
│  │ space-16   │ 64px   │ Major sections                      │ │
│  │ space-20   │ 80px   │ Hero spacing                        │ │
│  │ space-24   │ 96px   │ Page margins                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Grid System

```
┌─────────────────────────────────────────────────────────────────┐
│                        GRID SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BREAKPOINTS                                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Token   │ Width    │ Columns │ Gutter │ Margin            │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ mobile  │ <640px   │ 4       │ 16px   │ 16px              │ │
│  │ tablet  │ 640-1024 │ 8       │ 20px   │ 24px              │ │
│  │ desktop │ 1024-1440│ 12      │ 24px   │ 40px              │ │
│  │ wide    │ >1440px  │ 12      │ 24px   │ auto (max 1400px) │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  CONTAINER                                                      │
│  Max-width: 1400px                                              │
│  Padding: 16px (mobile) / 24px (tablet) / 40px (desktop)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Information Architecture

### 3.1 Sitemap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SITEMAP                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HOME (/)                                                                   │
│  ├── Feed (/feed) ★ Primary View                                            │
│  │   ├── For You (personalized)                                             │
│  │   └── Following (subscriptions only)                                     │
│  │                                                                          │
│  ├── Explore (/explore)                                                     │
│  │   ├── Trending                                                           │
│  │   ├── Categories                                                         │
│  │   │   ├── Fitness (/explore/fitness)                                     │
│  │   │   ├── Art (/explore/art)                                             │
│  │   │   ├── Education (/explore/education)                                 │
│  │   │   └── Adult (/explore/adult) [Age-gated]                             │
│  │   ├── Featured Creators                                                  │
│  │   └── Search Results (/search?q=)                                        │
│  │                                                                          │
│  ├── Messages (/messages)                                                   │
│  │   └── Conversation (/messages/:id)                                       │
│  │                                                                          │
│  ├── Notifications (/notifications)                                         │
│  │                                                                          │
│  ├── Creator Profile (/@username)                                           │
│  │   ├── Posts (default)                                                    │
│  │   ├── Media                                                              │
│  │   ├── About                                                              │
│  │   └── Live (if streaming)                                                │
│  │                                                                          │
│  ├── Post Detail (/post/:id)                                                │
│  │                                                                          │
│  ├── Live Streams (/live)                                                   │
│  │   └── Stream (/live/:id)                                                 │
│  │                                                                          │
│  ├── User Settings (/settings)                                              │
│  │   ├── Profile                                                            │
│  │   ├── Account                                                            │
│  │   ├── Privacy                                                            │
│  │   ├── Notifications                                                      │
│  │   ├── Subscriptions                                                      │
│  │   └── Wallet                                                             │
│  │                                                                          │
│  └── Creator Dashboard (/dashboard) [Creators Only]                         │
│      ├── Overview                                                           │
│      ├── Content                                                            │
│      ├── Analytics                                                          │
│      ├── Subscribers                                                        │
│      ├── Messages                                                           │
│      ├── Earnings                                                           │
│      └── Settings                                                           │
│                                                                             │
│  AUTH                                                                       │
│  ├── Login (/login)                                                         │
│  ├── Register (/register)                                                   │
│  ├── Forgot Password (/forgot-password)                                     │
│  └── Verify Email (/verify-email)                                           │
│                                                                             │
│  LEGAL                                                                      │
│  ├── Terms (/terms)                                                         │
│  ├── Privacy (/privacy)                                                     │
│  ├── DMCA (/dmca)                                                           │
│  └── Help (/help)                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Navigation Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NAVIGATION                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DESKTOP TOP NAV                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Logo]    [Feed] [Explore] [Live]    [Search...]    🔔 💬 [Avatar]│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  MOBILE BOTTOM NAV                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │     🏠        🔍        ➕        💬        👤                       │   │
│  │    Home    Explore   Create   Messages  Profile                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  CREATOR DASHBOARD SIDEBAR                                                  │
│  ┌─────────────────────┐                                                    │
│  │  📊 Overview        │                                                    │
│  │  📝 Content         │                                                    │
│  │  📈 Analytics       │                                                    │
│  │  👥 Subscribers     │                                                    │
│  │  💬 Messages        │                                                    │
│  │  💰 Earnings        │                                                    │
│  │  ⚙️ Settings        │                                                    │
│  └─────────────────────┘                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. User Journeys

### 4.1 New User Registration Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               NEW USER REGISTRATION JOURNEY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Landing │───▶│ Age     │───▶│Sign Up  │───▶│ Verify  │───▶│ Onboard │  │
│  │ Page    │    │ Gate    │    │ Form    │    │ Email   │    │ Prefs   │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │         │
│       ▼              ▼              ▼              ▼              ▼         │
│  "See what's    "Confirm      "Quick sign    "Check your    "Choose       │
│   trending"      you're 18+"   up form"      inbox"         interests"    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         ONBOARDING FLOW                              │   │
│  │                                                                      │   │
│  │  Step 1: Category Selection                                          │   │
│  │  "What are you interested in?"                                       │   │
│  │  [ ] Fitness  [ ] Art  [ ] Music  [ ] Education  [ ] Adult           │   │
│  │                                                                      │   │
│  │  Step 2: Content Preferences                                         │   │
│  │  "NSFW content settings"                                             │   │
│  │  ○ Show all content  ○ SFW only  ○ Ask each time                     │   │
│  │                                                                      │   │
│  │  Step 3: Featured Creators                                           │   │
│  │  "Here are some creators you might like"                             │   │
│  │  [Creator Cards with Follow buttons]                                 │   │
│  │                                                                      │   │
│  │  Step 4: Add Funds (Optional)                                        │   │
│  │  "Ready to support creators?"                                        │   │
│  │  [Add $25] [Add $50] [Add $100] [Skip]                              │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Creator Application Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CREATOR APPLICATION JOURNEY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Apply   │───▶│ Profile │───▶│  KYC    │───▶│ Payout  │───▶│Dashboard│  │
│  │ Button  │    │ Setup   │    │ Verify  │    │ Setup   │    │ Access  │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                             │
│  KYC VERIFICATION STEPS:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Government ID Upload                                             │   │
│  │     [Upload front]  [Upload back]                                    │   │
│  │                                                                      │   │
│  │  2. Selfie Verification                                              │   │
│  │     [Take photo holding ID]                                          │   │
│  │                                                                      │   │
│  │  3. Address Verification                                             │   │
│  │     [Upload utility bill / bank statement]                           │   │
│  │                                                                      │   │
│  │  4. Review & Submit                                                  │   │
│  │     [Preview all documents]                                          │   │
│  │     [Submit for Review]                                              │   │
│  │                                                                      │   │
│  │  Status: ⏳ Under Review (typically 24-48 hours)                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Subscription Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUBSCRIPTION USER FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    CREATOR PROFILE PAGE                               │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │  [Cover Image                                                   ] │ │  │
│  │  │  ┌─────────┐                                                     │ │  │
│  │  │  │ Avatar  │  @username                                          │ │  │
│  │  │  └─────────┘  Creator Name ✓                                     │ │  │
│  │  │               "Bio description..."                               │ │  │
│  │  │               👥 5.2K subscribers                                │ │  │
│  │  │                                                                  │ │  │
│  │  │  ┌────────────────────────────────────────────────────────────┐ │ │  │
│  │  │  │           SUBSCRIBE FOR $9.99/month                        │ │ │  │
│  │  │  │  ○ 1 Month: $9.99                                          │ │ │  │
│  │  │  │  ○ 3 Months: $24.99 (save 17%)                            │ │ │  │
│  │  │  │  ○ 12 Months: $79.99 (save 33%)                           │ │ │  │
│  │  │  └────────────────────────────────────────────────────────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                               │                                             │
│                               ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    PAYMENT MODAL                                      │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │  Subscribe to @username                                         │ │  │
│  │  │                                                                  │ │  │
│  │  │  Plan: 1 Month                           $9.99                  │ │  │
│  │  │  ─────────────────────────────────────────────                  │ │  │
│  │  │  Wallet Balance:                         $50.00                 │ │  │
│  │  │  After Purchase:                         $40.01                 │ │  │
│  │  │                                                                  │ │  │
│  │  │  ┌────────────────────────────────────────────────────────────┐ │ │  │
│  │  │  │              ✓ CONFIRM SUBSCRIPTION                        │ │ │  │
│  │  │  └────────────────────────────────────────────────────────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Wireframes

### 5.1 Home Feed (Mobile)

```
┌─────────────────────────────┐
│  NuttyFans        🔔  👤    │
├─────────────────────────────┤
│  [For You] [Following]      │
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │ ○ @creator • 2h ago     ││
│  │                         ││
│  │  ┌───────────────────┐  ││
│  │  │                   │  ││
│  │  │    [Image/Video]  │  ││
│  │  │                   │  ││
│  │  └───────────────────┘  ││
│  │                         ││
│  │  ♡ 234  💬 45  ⤴ 12    ││
│  │                         ││
│  │  Caption text here...   ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ ○ @creator2 • 5h ago    ││
│  │                         ││
│  │  ┌───────────────────┐  ││
│  │  │   🔒 LOCKED       │  ││
│  │  │   Subscribe to    │  ││
│  │  │   view content    │  ││
│  │  │   [$9.99/mo]      │  ││
│  │  └───────────────────┘  ││
│  └─────────────────────────┘│
├─────────────────────────────┤
│  🏠    🔍    ➕    💬    👤 │
└─────────────────────────────┘
```

### 5.2 Explore Page

```
┌─────────────────────────────┐
│  🔍 Search creators...      │
├─────────────────────────────┤
│                             │
│  Categories                 │
│  ┌────┐┌────┐┌────┐┌────┐  │
│  │Fit-││Art ││Edu-││Adu- │  │
│  │ness││    ││cat ││lt   │  │
│  └────┘└────┘└────┘└────┘  │
│                             │
│  🔥 Trending Now            │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │     │ │     │ │     │   │
│  │     │ │     │ │     │   │
│  └─────┘ └─────┘ └─────┘   │
│                             │
│  ⭐ Featured Creators       │
│  ┌─────────────────────────┐│
│  │ ○ @creator              ││
│  │   "Fitness coach..."    ││
│  │   👥 10K    [Subscribe] ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ ○ @creator2             ││
│  │   "Digital artist..."   ││
│  │   👥 5K     [Subscribe] ││
│  └─────────────────────────┘│
│                             │
├─────────────────────────────┤
│  🏠    🔍    ➕    💬    👤 │
└─────────────────────────────┘
```

### 5.3 Creator Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  NuttyFans Creator Dashboard                        @username ▼ │
├────────────────┬────────────────────────────────────────────────┤
│                │                                                │
│  📊 Overview   │  Welcome back, Sarah                           │
│  📝 Content    │                                                │
│  📈 Analytics  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  👥 Subscribers│  │ $5,240     │ │ 1,250      │ │ 85         │ │
│  💬 Messages   │  │ This Month │ │ Subscribers│ │ Posts      │ │
│  💰 Earnings   │  │ ▲ +12%     │ │ ▲ +45      │ │            │ │
│  ⚙️ Settings   │  └────────────┘ └────────────┘ └────────────┘ │
│                │                                                │
│                │  Revenue Chart                                 │
│                │  ┌──────────────────────────────────────────┐ │
│                │  │                                    ╭────│ │
│                │  │                              ╭─────╯    │ │
│                │  │                        ╭─────╯          │ │
│                │  │                  ╭─────╯                │ │
│                │  │            ╭─────╯                      │ │
│                │  │      ╭─────╯                            │ │
│                │  │ ─────╯                                  │ │
│                │  └──────────────────────────────────────────┘ │
│                │    Jan  Feb  Mar  Apr  May  Jun               │
│                │                                                │
│                │  Recent Activity                               │
│                │  • @user subscribed • 2 min ago                │
│                │  • @user2 tipped $10 • 15 min ago              │
│                │  • New message from @user3 • 1 hour ago        │
│                │                                                │
└────────────────┴────────────────────────────────────────────────┘
```

---

## 6. Component Library

### 6.1 Core Components

| Component    | Variants                          | Description        |
| ------------ | --------------------------------- | ------------------ |
| **Button**   | Primary, Secondary, Ghost, Danger | Action buttons     |
| **Input**    | Text, Password, Search, Textarea  | Form inputs        |
| **Card**     | Post, Creator, Payment, Stats     | Content containers |
| **Avatar**   | XS, SM, MD, LG, XL                | User avatars       |
| **Badge**    | Verified, Live, New, Premium      | Status indicators  |
| **Modal**    | Default, Full, Bottom Sheet       | Overlays           |
| **Toast**    | Success, Error, Info, Warning     | Notifications      |
| **Tabs**     | Default, Pills, Underline         | Navigation         |
| **Dropdown** | Menu, Select, Multi-select        | Selection          |
| **Skeleton** | Text, Image, Card                 | Loading states     |

### 6.2 Domain Components

| Component            | Description                                |
| -------------------- | ------------------------------------------ |
| **PostCard**         | Displays a single post with media, actions |
| **CreatorCard**      | Creator preview with follow/subscribe      |
| **SubscriptionCard** | Subscription options and pricing           |
| **MediaGallery**     | Image/video gallery with lightbox          |
| **PaywallOverlay**   | Locked content overlay                     |
| **TipButton**        | Quick tip with amount selection            |
| **LiveBadge**        | Animated live indicator                    |
| **MessageBubble**    | Chat message component                     |
| **NotificationItem** | Notification list item                     |
| **StatCard**         | Analytics stat display                     |

---

## 7. Interaction Patterns

### 7.1 Animations

| Interaction      | Animation     | Duration    |
| ---------------- | ------------- | ----------- |
| Page Transition  | Fade + Slide  | 200ms       |
| Modal Open       | Scale + Fade  | 150ms       |
| Button Press     | Scale (0.98)  | 100ms       |
| Like             | Heart burst   | 400ms       |
| Pull to Refresh  | Spring bounce | 300ms       |
| Skeleton Loading | Shimmer       | 1500ms loop |
| Toast Entry      | Slide + Fade  | 200ms       |
| Infinite Scroll  | Fade in       | 150ms       |

### 7.2 Gesture Support

| Gesture               | Action             |
| --------------------- | ------------------ |
| Pull Down             | Refresh feed       |
| Swipe Left (Messages) | Delete/Archive     |
| Double Tap (Post)     | Like               |
| Long Press (Post)     | Quick actions menu |
| Pinch (Media)         | Zoom               |
| Swipe (Stories)       | Next/Previous      |

### 7.3 Loading States

| State           | Implementation             |
| --------------- | -------------------------- |
| Initial Load    | Full-screen skeleton       |
| Infinite Scroll | Inline skeleton cards      |
| Action Pending  | Button spinner + disabled  |
| Media Loading   | Blur placeholder + spinner |
| Error State     | Retry button + message     |

---

_This document is confidential and intended for internal use only._
