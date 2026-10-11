# WedConnect · Technical Foundation

**Status:** proposed implementation baseline  
**Source of truth:** this document records technical choices; product scope remains in the Project Bible.

## Architecture

- **Repository:** one private GitHub repository for the public website, application, and database migrations.
- **Web application:** Next.js App Router with TypeScript, deployed on Vercel. Public pages and the logged-in app share one deployment but use separate layouts and visual systems.
- **Backend:** Supabase Auth and PostgreSQL. Use Supabase Storage for profile and portfolio images when upload work begins.
- **Database change management:** Supabase CLI migrations committed to `supabase/migrations/`. Do not make undocumented schema edits in the hosted SQL editor.
- **Data access:** Row Level Security (RLS) for every exposed table and private storage policies. Never put a Supabase service-role key in browser code.
- **Public page migration:** preserve `fotografen.html` and its assets as the visual reference. Port it into the public site and compare the rendered result before retiring the reference.

## Environments

| Environment | Web deployment | Backend |
|---|---|---|
| Local development | local Next.js server | local Supabase stack where practical |
| Pull request / preview | protected Vercel preview deployment | dedicated Supabase development project |
| Production | Vercel production deployment from `main` | separate Supabase production project |

Preview deployments must not use production user data or production secrets. Keep environment variables in the provider dashboards; commit only names and examples in an eventual `.env.example`, never real credentials.

## Delivery workflow

1. Work on a short-lived branch and open a pull request.
2. Run formatting, lint, type checks, and a production build in CI.
3. Review the protected Vercel preview for desktop and mobile layouts.
4. Apply and verify Supabase migrations against the development project.
5. Merge to `main`; production deploys from that branch after checks pass.
6. Promote database changes to production only after the preview flow is verified.

## First vertical slice

Build a small end-to-end slice before adding every product feature:

1. Role selection and account creation (couple or photographer).
2. Role-specific profile setup and profile editing.
3. Profile visibility controlled by explicit publication state and database policies.
4. Basic discovery and mutual-interest matching.
5. Conversation access only for the two matched accounts.

Subscriptions, push notifications, and advanced moderation tooling follow after the core matching flow works. Image upload and rights agreements are designed into the data model before portfolio collaboration is opened to real users.

## Security baseline

- RLS is enabled on every table exposed to clients; policies are tested for both allowed and denied access.
- Users can read or update only their own private profile data. Published profile fields are intentionally exposed through narrowly scoped policies or server endpoints.
- Match and conversation access is limited to the two participants.
- Storage buckets are private by default; image delivery uses explicit access rules.
- Authentication secrets and service-role credentials remain server-side.
- Account deletion and data export are included in the production readiness checklist.

## Infrastructure setup status

This repository is private and has its initial public-site assets and product documents. The Vercel project still needs to be connected to this GitHub repository with deployment protection enabled. Supabase projects (development and production) have not been created or connected yet. After the provider access is available, add the Supabase CLI configuration and the first migration in a reviewed pull request.
