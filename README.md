# WedConnect

WedConnect connects wedding couples and wedding photographers for potential TFP collaborations. A match means mutual interest and opens a conversation; it is not a booking confirmation.

## Project documents

- [Project Bible v1.2](docs/PROJECT-BIBLE-v1.2.md) — product scope, roles, profile onboarding, rights, and technical boundaries.
- [Project Bible v1.1](docs/PROJECT-BIBLE-v1.1.md) — previous version.
- [Design Bible](docs/DESIGN-BIBLE.md) — current visual system.
- [Supabase setup](supabase/README.md) — authentication and database setup.

## Current repository state

The public pages are `index.html`, `hochzeitspaare.html`, and `fotografen.html`. The photographer page remains unchanged.

Email and Google registration use the same role-neutral flow. After authentication, `dashboard.html` opens the profile assistant. Users select **Hochzeitspaar** or **Fotograf** after login, enter the required profile data, upload the required photos, and review the profile. The full dashboard is shown only after the profile is complete.

Run both files in `supabase/migrations` in filename order before testing the onboarding forms and photo uploads. Matching and messages are not implemented yet.

## Important product boundary

A mutual match starts a conversation, not a booking. Scope, compensation, delivery, and image usage rights must be explicitly agreed before collaboration.
