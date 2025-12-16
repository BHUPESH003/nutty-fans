# Task – User Profiles, Settings & Navigation

## Problem Statement

NuttyFans needs user-facing profile pages, profile editing, account settings, avatar upload, and core layout/navigation so that users can manage their identity and move through the app. Today these surfaces are missing or skeletal, blocking meaningful engagement and making it hard to layer in future features (creator onboarding, subscriptions, messaging, etc.).

## Business Goal

Provide a solid, reusable foundation for user profiles and navigation that:

- Lets users view and edit their basic profile.
- Exposes key settings (privacy, notifications, basic account options).
- Enables avatar upload to make profiles feel personal.
- Introduces the core layout and navigation patterns the rest of the app will reuse.

## Scope

### In Scope

- User profile pages (self-view and other-user view, at a basic level).
- Profile editing for core fields (display name, bio, basic public info).
- Settings page for core account and preference settings (non-creator, non-payment).
- Avatar upload flow (client + server integration using existing media/storage strategy).
- Basic layout components (shell, header, sidebar/top-nav, content area).
- Navigation implementation for primary sections (e.g., home/feed, profile, settings).

### Out of Scope

- Creator-specific profile customization and monetization settings.
- Admin views of profiles.
- Detailed notification preference matrix.
- Payments, subscriptions, or payout settings.
- Deep information architecture / full site map beyond what’s needed to support this task.

## Success Criteria

- Users can visit their own profile and see accurate profile information.
- Users can edit core profile fields and see changes reflected.
- Users can access a settings page with at least basic account and preference options.
- Users can upload/update an avatar that appears consistently across the app.
- Core layout and navigation work reliably and can be reused for future features.

## Dependencies

- Completed AUTH-SYSTEM (users can sign in).
- Existing media/storage approach for avatar hosting.
- UI design system and layout guidance from UI/UX blueprint.

## Owners

- Product/PM (you) — define and approve requirements.
- Tech Lead — architecture and data/ownership boundaries.
- Frontend engineer — pages, layout, navigation, profile/settings UIs.
- Backend engineer — profile and settings persistence, avatar handling endpoints.
- Security/Compliance — privacy implications of profile fields and avatars (public vs private).
