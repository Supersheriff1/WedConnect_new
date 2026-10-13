# WedConnect

WedConnect connects wedding couples and wedding photographers for potential TFP collaborations. A match means mutual interest and opens a conversation; it is not a booking confirmation.

## Project documents

- [Project Bible v1.2](docs/PROJECT-BIBLE-v1.2.md) — product scope, roles, profile onboarding, rights, and technical boundaries.
- [Project Bible v1.1](docs/PROJECT-BIBLE-v1.1.md) — previous version.
- [Design Bible](docs/DESIGN-BIBLE.md) — current visual system for the public website and app.
- [Supabase setup](supabase/README.md) — authentication configuration and initial database migration.

## Current repository state

The repository contains the public pages `index.html`, `hochzeitspaare.html`, and `fotografen.html`. The photographer page is the visual master; the homepage and couples page now follow its design system and outer content frame. Their copy is still an early draft and is not frozen.

The public site is static HTML. Supabase email and Google authentication use the same role-neutral signup and sign-in flow. Successful authentication opens `dashboard.html`; users choose a couple or photographer profile there. Discover, matches, messages, and matching remain locked until the role-specific profile is complete. The current dashboard implements the shared entry and profile-type selection; detailed profile onboarding and server-side completion checks are the next step.

## Important product boundary

A mutual match starts a conversation, not a booking. Scope, compensation, delivery, and image usage rights must be explicitly agreed before collaboration.
