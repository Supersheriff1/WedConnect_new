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
28. `supabase/migrations/20261016150000_message_read_receipts.sql`
29. `supabase/migrations/20261016160000_hide_conversations_for_user.sql`
30. `supabase/migrations/20261016170000_profile_blocks.sql`
31. `supabase/migrations/20261016180000_profile_saved_profiles.sql`
32. `supabase/migrations/20261016190000_user_discover_preferences.sql`
33. `supabase/migrations/20261018100000_mutual_matching_preferences.sql`
34. `supabase/migrations/20261019100000_collaboration_model_and_profile_consent.sql`
35. `supabase/migrations/20261019120000_recover_profile_role_after_collaboration_migration.sql`
36. `supabase/migrations/20261024100000_chat_identity_for_existing_matches.sql`
37. `supabase/migrations/20261024110000_chat_gallery_photo_access.sql`
38. `supabase/migrations/20261025100000_admin_dashboard.sql`
39. `supabase/migrations/20261025110000_admin_access_level_volatility.sql`
40. `supabase/migrations/20261025120000_fix_admin_overview_region_alias.sql`
41. `supabase/migrations/20261025130000_fix_admin_user_search_return_types.sql`

The collaboration migration adds mandatory pair consent for use of selected photos subject to approval before publication, a pair's willingness to consider a reduced contribution (`yes`, `no`, or `depends`), and the photographer's offer (`free`, `reduced`, or `both`) plus agreement to submit photos for approval before publication. The exact reduced price remains negotiable according to coverage scope. Existing completed profiles are reopened so their owners can confirm the new terms; profile data and photos remain stored. Profile completion enforces the terms in Supabase. Discover sorts by region first and collaboration-model compatibility second; no soft preference hides profiles or restricts likes. Likes still work for any visible profile, even when the compensation model does not align. Do not infer that these migrations are live; check the current Supabase migration history.

## Chat blockieren

Apply `supabase/migrations/20261016170000_profile_blocks.sql` before using the three-dot chat menu. Blocking prevents both participants from sending direct messages, removes each other from Discover, incoming likes and Matches, and keeps the existing conversation visible so the blocker can unblock later. Support chats are unaffected. The database also rejects new direct messages and likes involving blocked profiles. The block is one-way; the person who created it controls unblocking. Existing history is retained.

## Storage

The private `wedconnect-profile-photos` bucket accepts JPEG, PNG and WebP. The new migration sets the per-object limit to 2 MB; verify it has run before relying on server-side enforcement. Incomplete profiles and their photos are private according to the policies; completed profiles are readable by signed-in WedConnect users.

## Authentication

Configure allowed redirect URLs in Supabase Auth for production and local preview. Google sign-in requires Google provider credentials and the Supabase callback URL in Google Cloud. E-mail and Google use the same role-neutral entry; role selection belongs to profile creation after authentication.

The frontend reads the Supabase URL and publishable key from `assets/js/supabase-config.js`. Never place a service-role key in browser code.

The chat supports one removable heart reaction per user per message. Apply migration `20261016090000_profile_message_reactions.sql` before testing reactions. Authors can delete their own sent messages for both participants. The original body is replaced with a deletion placeholder, the app displays “Nachricht wurde gelöscht” at the original position, and existing heart reactions are removed automatically. Apply migration `20261016110000_profile_message_delete_for_everyone.sql` before using this control. Migration `20261016100000_profile_message_hidden.sql` is retained for history but is no longer used by the app. The Discover feed shows complete profiles of the opposite role. Likes are saved in `profile_likes` and can create a match when mutual. “Überspringen” is private to the acting account and saved in `profile_skips`; it never notifies the other profile or creates a match. Saved profiles are private to each account in `profile_saved_profiles`; apply `20261016180000_profile_saved_profiles.sql` before using the Merkliste. Removing a profile from the Merkliste makes it eligible for Entdecken again unless it has also been liked, skipped or blocked.

## Kontakt / Feedback

Der Kontobereich bietet einen einzigen Kontaktweg: Chat mit dem WedConnect-Team. Thema, Betreff und Nachricht werden beim Start einer Unterhaltung als erste Chatnachricht übernommen. Pro Konto wird eine bestehende Support-Unterhaltung fortgeführt; weitere Nachrichten erscheinen mit den anderen Unterhaltungen unter „Nachrichten“. Push-Nachrichten und Support-E-Mail-Versand sind nicht Teil dieser Funktion.

Der Support-Eingang ist nur für angemeldete Betreiberkonten sichtbar, die in `support_operators` eingetragen sind. Betreiberkonten erhalten diesen Zugang durch Einfügen ihrer authentifizierten Supabase-User-ID im Supabase SQL Editor:

```sql
insert into public.support_operators (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

Führe für die Chat-Funktion `supabase/migrations/20261016130000_support_contact_feedback.sql` aus. Die Migration und die Betreiberfreischaltung in Supabase müssen separat erfolgen; das Vorhandensein der Dateien im Repository bestätigt keine Live-Einrichtung.


## Konto dauerhaft löschen

Die Einstellungsseite enthält einen dauerhaft sichtbaren Löschbereich. Nutzer müssen im Bestätigungsdialog exakt `KONTO LÖSCHEN` eingeben. Der authentifizierte Aufruf geht an `supabase/functions/delete-account/index.ts`; die Funktion prüft die Nutzersitzung, entfernt Dateien aus dem privaten Bucket `wedconnect-profile-photos` und löscht anschließend den Auth-Nutzer. Die Profil- und Aktivitätsdaten hängen per `ON DELETE CASCADE` am Auth-/Profilkonto. Die Löschung entfernt auch persönliche Chatverläufe für beide Beteiligten.

Vor der Verwendung muss die Funktion im richtigen Supabase-Projekt deployt werden:

```sh
supabase functions deploy delete-account
```

Die Supabase-Standard-Secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY` (oder `SUPABASE_PUBLISHABLE_KEY`) und `SUPABASE_SERVICE_ROLE_KEY` müssen für Functions verfügbar sein. Der Service-Role-Key bleibt ausschließlich im Supabase-Secret-Store und darf nie in Browsercode oder Vercel-Clientvariablen veröffentlicht werden. Bei einem Storage-Fehler wird die Auth-Löschung abgebrochen; ein erneuter Versuch kann nötig sein, falls bereits ein Teil der Dateien entfernt wurde. Das Deployment und die Ausführung in Produktion sind separat zu prüfen.


## Namen und Profilbilder in bestehenden Chats

Profile, die wegen neuer Pflichtangaben erneut geöffnet wurden, bleiben für Discover verborgen, bis sie bestätigt sind. Die Migration `20261024100000_chat_identity_for_existing_matches.sql` lässt Gesprächspartner trotzdem die Namen und Konto-Profilbilder eines bestehenden Chats sehen. Sie gibt nur Profilinformationen für Personen frei, mit denen bereits eine gegenseitige Unterhaltung besteht.


Die Migration `20261024110000_chat_gallery_photo_access.sql` erlaubt es, bei einem bestehenden Chat das erste Profilfoto als Avatar zu laden, wenn kein persönliches Konto-Profilbild vorhanden ist.

## Admin-Bereich

Der Admin-Bereich ist unter `/admin` erreichbar und wird nicht in die normalen Dashboard-Dateien eingebunden. Vor der ersten Anmeldung muss die Migration `20261025100000_admin_dashboard.sql` im Supabase SQL Editor ausgeführt werden.

1. Lege in Supabase Auth ein eigenes E-Mail-Konto für die Administration an und bestätige die Adresse. Verwende ein Passwort mit mindestens 14 Zeichen.
2. Kopiere die Auth-User-ID dieses Kontos und trage sie über den SQL Editor in die private Admin-Freigabeliste ein:

```sql
insert into public.admin_users (user_id, access_level)
values ('00000000-0000-0000-0000-000000000000', 'owner');
```

3. Öffne `/admin`, melde dich mit diesem Konto an und richte den TOTP-Authenticator ein. Die zehn einmaligen Wiederherstellungscodes erscheinen nach der Einrichtung genau einmal. Bewahre sie offline auf.
4. Setze in Supabase Auth eine Mindestpasswortlänge von 14 Zeichen. MFA-Prüfung, Admin-Freigabe und Zeitlimits werden zusätzlich in den Admin-Datenbankfunktionen serverseitig geprüft. Die Admin-Tabellen sind für Browserrollen gesperrt; es wird kein Service-Role-Key ausgeliefert.

Neue Fotograf:innen bleiben bis zur Profilfreigabe unsichtbar. Bereits vollständige Profile werden bei der Einführung als bestehender Bestand freigegeben, damit die Migration ihre Sichtbarkeit nicht unerwartet ändert. UID-, Firmenbuchnummer und Registername werden in einer gesonderten, für andere Nutzer gesperrten Tabelle gespeichert. Fotograf:innen können die Angaben im Profil eintragen und die gewerbliche Verifizierung beantragen. Die Admin-Einträge für Partner und Kampagnen sind nach der Migration leer.

Die Admin-Oberfläche enthält Nutzerwarnungen, befristete (7–30 Tage) und dauerhafte Sperren, Entsperren, Fotograf:innen-Pausen, Rollenreset und Kontolöschung. Für Rollenreset und Kontolöschung muss zusätzlich die Edge Function deployed sein; sie entfernt Storage-Dateien und löscht beim endgültigen Entfernen auch das Supabase-Auth-Konto. Dauerhafte Sperre, Rollenreset, Löschung und Audit-Export verlangen eine erneute Passwort- und TOTP-Prüfung. Änderungen werden vor der Ausführung im unveränderlichen Admin-Protokoll festgehalten.

```sh
supabase functions deploy admin-delete-account
```

Die Funktion benötigt die Supabase-Standard-Secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY` (oder `SUPABASE_PUBLISHABLE_KEY`) und `SUPABASE_SERVICE_ROLE_KEY`. Der Service-Role-Key bleibt ausschließlich im Supabase-Secret-Store.

Zwei projektweite Schutzmaßnahmen benötigen weiterhin separate Supabase-Auth-Konfiguration: eine E-Mail-Benachrichtigung bei Admin-Anmeldungen und die Begrenzung auf fünf fehlgeschlagene Loginversuche mit 15 Minuten Sperre. Die gewünschte Aufbewahrungsdauer des Admin-Protokolls ist noch festzulegen; aktuell erfolgt kein automatisches Löschen.
