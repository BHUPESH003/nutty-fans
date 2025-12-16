# Task – Authentication & Verification Flows

## Problem Statement

NuttyFans needs a production-ready authentication foundation covering email/password, social login (Google, Apple), email verification, password reset, and an age-verification gate powered by a third-party provider. The current codebase lacks these end-to-end flows, blocking user onboarding and trust/safety readiness.

## Business Goal

Enable secure, compliant user onboarding so new users can register, verify identity/age, and access the platform with minimal friction while meeting trust, safety, and compliance requirements.

## Scope

### In Scope

- NextAuth-based authentication setup.
- Email/password registration and login.
- Social login with Google and Apple.
- Email verification flow.
- Password reset flow.
- Age verification gate using a third-party provider.
- Basic session and sign-out handling.

### Out of Scope

- Creator KYC (separate task).
- MFA/2FA.
- Phone/SMS OTP flows.
- Admin tooling for identity review.
- Detailed UI/UX design beyond required forms and states.

## Success Criteria

- Users can register with email/password and sign in.
- Users can sign in with Google and Apple.
- Email verification required before full access; clear states for unverified users.
- Password reset flow works end to end.
- Age gate blocks under-18 users; third-party age verification integrated.
- Sessions handled consistently (sign-in, sign-out, expiration).

## Dependencies

- NextAuth stack decision (per architecture rules).
- Third-party age verification provider and credentials.
- Email delivery provider and domain settings for verification/reset emails.
- OAuth credentials for Google and Apple.
- Environment variable management and secrets setup.

## Owners

- Product/PM (you) — requirements and approvals.
- Tech Lead — architecture review.
- Backend engineer — auth and identity flows, third-party integrations.
- Frontend engineer — UI flows and state handling.
- DevOps — secrets/env setup, CI checks.
- Security/Compliance — age verification policy review and vendor approval.
- Legal — policy alignment for age gating and content access.
