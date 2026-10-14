# Supabase setup

WedConnect uses Supabase Auth for sign-in and account creation. Run the database migrations in the SQL Editor in filename order before testing the dashboard onboarding.

## Database migrations

Run every file in `migrations/` in filename order.

Key migrations:

- `20261012160000_init_profiles.sql` creates the private account profile and the initial role-assignment function.
- `20261013120000_profile_onboarding.sql` adds role-specific profiles, profile photos, row-level security, and the private photo bucket.
- `20261014130000_structured_couple_profile_fields.sql` adds the couple's federal state and structured coverage/style choices, and ensures the optional public introduction columns exist. The new choices are required before a new couple profile can be completed.

The photo bucket accepts JPEG, PNG, and WebP up to 10 MB per image. Incomplete profile records and photos remain private. After completion, profile details and photos can be read by signed-in WedConnect users.

## Authentication

Configure the site's allowed redirect URLs in Supabase Auth for the production domain and local preview. Google sign-in also requires the Google provider credentials and the Supabase callback URL configured in Google Cloud.

The frontend reads its public Supabase URL and publishable key from `assets/js/supabase-config.js`. Never place a service-role key in frontend code.
