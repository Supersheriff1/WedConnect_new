# WedConnect

WedConnect connects wedding couples and wedding photographers for potential TFP collaborations. A match means mutual interest and opens a conversation; it is not a booking confirmation.

## Project documents

- [Frozen baseline — 14 October 2026](docs/FROZEN-BASELINE-2026-10-14.md) — current implementation, production deployment, verified boundaries, and open issues.
- [Reference modules](docs/REFERENCE-MODULES-v1.0.md) — documented current reference for the photographer page, authentication, dashboard, profile management, and public profile.
- [Change control](docs/CHANGE-CONTROL.md) — freeze rule and safe process for explicitly requested changes.
- [Documentation architecture](docs/DOCUMENTATION-ARCHITECTURE.md) — proposed modular bibles, asset inventory, and guarded FAQ automation.

- [Project Bible v1.3](docs/PROJECT-BIBLE-v1.3.md) — current product decisions and implementation status.
- [Project Bible v1.2](docs/PROJECT-BIBLE-v1.2.md) — previous version, retained for history.
- [Project Bible v1.1](docs/PROJECT-BIBLE-v1.1.md) — previous version.
- [Design Bible](docs/DESIGN-BIBLE.md) — visual system for the public website.
- [App Design Bible v1.0](docs/APP-DESIGN-BIBLE-v1.0.md) — visual and interaction reference for the logged-in app.
- [Supabase setup](supabase/README.md) — authentication and database setup.

## Current repository state

The public pages are `index.html`, `hochzeitspaare.html`, and `fotografen.html`. The photographer page remains unchanged.

Email and Google registration use the same role-neutral flow. After authentication, `dashboard.html` opens the profile assistant. Users select **Hochzeitspaar** or **Fotograf** after login, enter the required profile data, upload the required photos, and review the profile. The full dashboard is shown only after the profile is complete.

Run the files in `supabase/migrations` in filename order before testing the onboarding forms and photo uploads. Matching and messages are not implemented yet.

## Important product boundary

A mutual match starts a conversation, not a booking. Scope, compensation, delivery, and image usage rights must be explicitly agreed before collaboration.
