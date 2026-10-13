# Supabase setup

WedConnect uses Supabase Auth for sign-in and account creation. Run the database migrations in the SQL Editor in filename order before testing the dashboard onboarding.

## Database migrations

1. `migrations/20261012160000_init_profiles.sql` creates the private account profile and the one-time role assignment function.
2. `migrations/20261013120000_profile_onboarding.sql` adds role-specific profiles, completion status, row-level security, and a private photo bucket.

The second migration creates `couple_profiles`, `photographer_profiles`, and `profile_photos`. The photo bucket accepts JPEG, PNG, and WebP up to 10 MB per image. Incomplete profile records and photos remain private. After completion, profile details and photos can be read by signed-in WedConnect users.

## Authentication

Configure the site's allowed redirect URLs in Supabase Auth for the production domain and local preview. Google sign-in also requires the Google provider credentials and the Supabase callback URL configured in Google Cloud.

The frontend reads its public Supabase URL and publishable key from `assets/js/supabase-config.js`. Never place a service-role key in frontend code.
