# WedConnect

WedConnect connects wedding couples and wedding photographers for potential TFP collaborations. A match means mutual interest and opens a conversation; it is not a booking confirmation.

## Project documents

- [Project Bible](docs/PROJECT-BIBLE.md) — product scope, roles, flows, rights, and technical boundaries.
- [Design Bible](docs/DESIGN-BIBLE.md) — current visual system for the public website and app.
- [Supabase setup](supabase/README.md) — authentication configuration and initial database migration.

## Current repository state

The repository contains the public pages `index.html`, `hochzeitspaare.html`, and `fotografen.html`. The photographer page is the visual master; the homepage and couples page now follow its design system and outer content frame. Their copy is still an early draft and is not frozen.

The public site is static HTML. The Supabase Auth client is now wired to the profile registration dialogs for couples and photographers. The initial private profile migration is in `supabase/migrations`; it must be run in the Supabase SQL Editor before authentication can be tested. Google OAuth still needs provider credentials and redirect URLs in the Supabase Dashboard. Profile onboarding and matching are not implemented yet.

## Important product boundary

A mutual match starts a conversation, not a booking. Scope, compensation, delivery, and image usage rights must be explicitly agreed before collaboration.
