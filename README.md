# WedConnect

WedConnect connects wedding couples and wedding photographers for potential TFP collaborations. A mutual match starts a conversation; it is not a booking confirmation.

## Product and design source of truth

- [Project Bible](docs/PROJECT-BIBLE.md) — product scope, roles, flows, rights, and boundaries.
- [Design Bible](docs/DESIGN-BIBLE.md) — visual standards for the public website and the separate logged-in app.
- [Technical Foundation](docs/TECHNICAL-FOUNDATION.md) — planned architecture, environments, and delivery sequence.

## Current implementation

The repository currently contains the public “Für Fotografen” design master and its illustration assets. It does not yet contain the production app, authentication, database, or file-upload flows. The current HTML page is a design reference to preserve when the public site is moved into the app.

The public website follows the Design Bible. The logged-in app is a separate product surface and is not required to inherit the marketing-site illustration style.

## Product boundary

A mutual match starts a conversation, not a booking. Scope, compensation, delivery, and image usage rights must be explicitly agreed before a collaboration.

## Development principles

- GitHub is the source of truth; changes go through branches and pull requests.
- Preview and production environments use separate backend projects and credentials.
- Database changes are committed as Supabase migrations.
- All user-facing data access is protected by database Row Level Security.
