# WedConnect

WedConnect connects wedding couples and photographers for potential TFP collaborations. Mutual interest starts a conversation; it is not a booking confirmation.

## Start here

- [START-HERE](docs/START-HERE.md) — handoff for new work sessions
- [Project Bible](docs/PROJECT-BIBLE.md) — binding product decisions
- [Public Design Bible](docs/DESIGN-BIBLE.md) — frozen public website standard
- [App Design Bible](docs/APP-DESIGN-BIBLE.md) — dashboard and logged-in app
- [Implementation Status](docs/IMPLEMENTATION-STATUS.md) — code, Supabase and verification
- [Ideas Bible](docs/IDEAS-BIBLE.md) — nonbinding idea pool
- [Supabase setup](supabase/README.md) — database and authentication setup

`docs/PROJECT-BIBLE-v1.1.md` and `docs/PROJECT-BIBLE-v1.2.md` are historical snapshots. Use `docs/PROJECT-BIBLE.md` as the current source.

## Current repository state

Public pages are `index.html`, `hochzeitspaare.html` and `fotografen.html`. `fotografen.html` is frozen as the visual master; the home and couple page content may still be revised.

Email and Google sign-in use the same role-neutral flow. After authentication, users choose a role during profile creation in `dashboard.html`. The profile must be complete before discovery and matching are opened. Matching and messages are not implemented in the currently reviewed code; see the implementation status for known gaps between the accepted product direction and repository code.
