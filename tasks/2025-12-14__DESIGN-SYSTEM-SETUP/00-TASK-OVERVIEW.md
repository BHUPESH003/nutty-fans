# Task 04 – Design System Setup & Component Library Init

## Problem Statement

NuttyFans has a comprehensive UI/UX Blueprint (`docs/06-UI-UX-BLUEPRINT.md`) with:
- Color palette defined
- Typography scale defined
- Spacing system defined
- Component specifications

However, the codebase currently has:
- Basic Tailwind CSS configured
- Empty `src/components/ui/` folder
- No design tokens implemented
- No component library initialized

**Gap:** Design specs exist in docs, but not implemented in code.

---

## Business Goal

Establish a consistent, scalable design system that:
- Implements the UI/UX Blueprint as code
- Provides reusable components for rapid development
- Ensures visual consistency across all pages
- Enables designers and developers to speak the same language (tokens)

---

## Scope

### IN SCOPE

#### 1. Design System Setup
- Implement CSS variables for design tokens (colors, typography, spacing)
- Configure Tailwind theme to match UI/UX Blueprint
- Set up dark mode support (CSS variables ready)
- Create utility classes for common patterns

#### 2. Component Library Initialization
- Install and configure shadcn/ui
- Initialize base components from shadcn/ui
- Customize components to match NuttyFans design
- Set up component folder structure

#### 3. Core Components (Initial Set)
Based on UI/UX Blueprint Section 6.1:
- Button (Primary, Secondary, Ghost, Danger)
- Input (Text, Password, Search, Textarea)
- Card (base component)
- Avatar (XS, SM, MD, LG, XL)
- Badge (Verified, Live, New, Premium)
- Modal/Dialog
- Toast/Notifications
- Tabs
- Dropdown/Select
- Skeleton loaders

### OUT OF SCOPE

- Domain-specific components (PostCard, CreatorCard, etc.)
- Page layouts
- Authentication UI
- API integration
- Animations (beyond basic transitions)
- Storybook setup (future task)

---

## Current State

| Item | Status |
|------|--------|
| UI/UX Blueprint | ✅ Complete (`docs/06-UI-UX-BLUEPRINT.md`) |
| Tailwind CSS | ✅ Installed (basic config) |
| Design tokens in code | ❌ Not implemented |
| Component library | ❌ Empty (`src/components/ui/`) |
| shadcn/ui | ❌ Not installed |

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component Library | **shadcn/ui** | Per tech architecture docs; customizable, accessible |
| Styling | **Tailwind CSS** | Already installed; matches shadcn/ui |
| Class Utilities | **clsx + tailwind-merge** | Already installed |
| Icons | **Lucide React** | Bundled with shadcn/ui |

---

## Success Criteria

- [ ] Design tokens (colors, typography, spacing) implemented as CSS variables
- [ ] Tailwind config extended with custom theme
- [ ] shadcn/ui initialized and configured
- [ ] 10+ core UI components available in `src/components/ui/`
- [ ] Components match UI/UX Blueprint specifications
- [ ] Dark mode CSS variables ready (toggle implementation later)
- [ ] All components pass TypeScript type-checking
- [ ] All components pass ESLint

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| UI/UX Blueprint | ✅ Ready | `docs/06-UI-UX-BLUEPRINT.md` |
| Tailwind CSS | ✅ Installed | v3.4.x |
| TypeScript | ✅ Configured | v5.7.x |
| clsx + tailwind-merge | ✅ Installed | For className utilities |

---

## References

- `docs/06-UI-UX-BLUEPRINT.md` — Design specifications
- `docs/03-TECHNICAL-ARCHITECTURE.md` — Tech stack decisions
- shadcn/ui documentation: https://ui.shadcn.com/

---

## Status: ✅ READY FOR PM RESEARCH
