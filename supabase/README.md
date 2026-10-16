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
21. `supabase/migrations/20261015160000_couple_ceremony_and_timeline.sql`
22. `supabase/migrations/20261015180000_dashboard_activity_and_email_preferences.sql`
23. `supabase/migrations/20261015200000_profile_skips_for_discover.sql`
24. `supabase/migrations/20261016090000_profile_message_reactions.sql`
25. `supabase/migrations/20261016100000_profile_message_hidden.sql` (legacy; no longer used by the app)
26. `supabase/migrations/20261016110000_profile_message_delete_for_everyone.sql`
27. `supabase/migrations/20261016130000_support_contact_feedback.sql`

The couple profile stores a structured ceremony type and guided timeline. Photographer galleries remain ordinary photos without a highlight selection. Couple profiles show wedding date, town and photo-use preference as key facts. Couple uploads require each partner to be represented: either one joint photo (stored as `photo_type = 'couple'`) or at least one individual photo for each partner. A joint photo may also be combined with individual photos. Each new image is limited to 2 MB. The activity migration also adds messages, role-targeted overview announcements/offers, email preferences, and a 2 MB bucket limit. Do not infer that these migrations are live; check the current Supabase migration history.

## Storage

The private `wedconnect-profile-photos` bucket accepts JPEG, PNG and WebP. The new migration sets the per-object limit to 2 MB; verify it has run before relying on server-side enforcement. Incomplete profiles and their photos are private according to the policies; completed profiles are readable by signed-in WedConnect users.

## Authentication

Configure allowed redirect URLs in Supabase Auth for production and local preview. Google sign-in requires Google provider credentials and the Supabase callback URL in Google Cloud. E-mail and Google use the same role-neutral entry; role selection belongs to profile creation after authentication.

The frontend reads the Supabase URL and publishable key from `assets/js/supabase-config.js`. Never place a service-role key in browser code.

The chat supports one removable heart reaction per user per message. Apply migration `20261016090000_profile_message_reactions.sql` before testing reactions. Authors can delete their own sent messages for both participants. The original body is replaced with a deletion placeholder, the app displays “Nachricht wurde gelöscht” at the original position, and existing heart reactions are removed automatically. Apply migration `20261016110000_profile_message_delete_for_everyone.sql` before using this control. Migration `20261016100000_profile_message_hidden.sql` is retained for history but is no longer used by the app. The Discover feed shows complete profiles of the opposite role. Likes are saved in `profile_likes` and can create a match when mutual. “Überspringen” is private to the acting account and saved in `profile_skips`; it never notifies the other profile or creates a match.

## Kontakt / Feedback

The account dialog offers two contact channels: WedConnect chat and e-mail. Chat threads are listed with other conversations; e-mail threads and replies stay in the account dialog. No push notifications are sent. The support inbox is visible only to authenticated operator accounts explicitly allowlisted in `support_operators`.

For each operator, add their authenticated Supabase user UUID in the Supabase SQL Editor:

```sql
insert into public.support_operators (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

The e-mail channel uses the `send-support-email` Supabase Edge Function and Resend. Deploy it and configure these Supabase Function secrets:

- `RESEND_API_KEY`: Resend API key.
- `SUPPORT_FROM_EMAIL`: sender address on a verified Resend domain.
- `SUPPORT_EMAIL`: final WedConnect support inbox. Until changed, the function uses `albert.fuerst.usa@gmail.com` as a provisional recipient. **This address must be replaced before the app goes live.**

The function also uses Supabase's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` runtime secrets. Never place the service-role key in browser code. The Supabase migration and Edge Function deployment/secrets must be applied separately; repository files do not confirm live Supabase configuration.
