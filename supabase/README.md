# Supabase setup

WedConnect uses Supabase Auth, Postgres Row Level Security and private Storage for profile photos. The list below describes migration files in source control. It does not prove which migrations have already run in a specific Supabase project.

## Database migrations

For a new project, execute the SQL files in the order below using the Supabase SQL Editor. The public-introduction migration currently lives in the repository root; it must also be run in its timestamp position. Do not skip a file based only on this README. For an existing database, compare its migration history and schema before reapplying anything.

1. `supabase/migrations/20261012160000_init_profiles.sql`
2. `supabase/migrations/20261013120000_profile_onboarding.sql`
3. `supabase/migrations/20261013130000_allow_role_change_until_profile_complete.sql`
4. `supabase/migrations/20261013140000_structured_photographer_profile.sql`
5. `supabase/migrations/20261013143000_recover_profile_role_on_completion.sql`
6. `supabase/migrations/20261013150000_allow_stepwise_profile_saves.sql`
7. `supabase/migrations/20261013153000_photographer_compensation.sql`
8. `supabase/migrations/20261013160000_photographer_coverage_options.sql`
9. `supabase/migrations/20261013170000_portfolio_photos_minimum_three.sql`
10. `supabase/migrations/20261013180000_separate_profile_photo_originals_and_display.sql`
11. `supabase/migrations/20261013185000_photographer_photo_placement.sql`
12. `supabase/migrations/20261013190000_fix_profile_completion_and_photo_deletion.sql`
13. `supabase/migrations/20261013200000_portfolio_highlight_star.sql`
14. `supabase/migrations/20261013210000_fix_role_reassignment_before_completion.sql`
15. `supabase/migrations/20261013220000_allow_role_changes_after_completion.sql`
16. `20261014100000_profile_public_intro.sql`
17. `supabase/migrations/20261014110000_profile_likes.sql`
18. `supabase/migrations/20261014120000_profile_avatars.sql`
19. `supabase/migrations/20261014130000_structured_couple_profile_fields.sql`
20. `supabase/migrations/20261014150000_allow_couple_profile_drafts.sql`

The code and schema include older photographer-highlight fields. The accepted product direction is a gallery of up to 20 ordinary photos without highlights. Do not infer that this product decision has already been applied to Supabase; check the current implementation and decide on a separately reviewed migration before changing deployed data.

## Storage

The private `wedconnect-profile-photos` bucket accepts JPEG, PNG and WebP and is configured for up to 10 MB per stored object. The photographer upload UI currently applies a 2 MB per-photo limit. Incomplete profiles and their photos are private according to the policies; completed profiles are readable by signed-in WedConnect users.

## Authentication

Configure allowed redirect URLs in Supabase Auth for production and local preview. Google sign-in requires Google provider credentials and the Supabase callback URL in Google Cloud. E-mail and Google use the same role-neutral entry; role selection belongs to profile creation after authentication.

The frontend reads the Supabase URL and publishable key from `assets/js/supabase-config.js`. Never place a service-role key in browser code.
