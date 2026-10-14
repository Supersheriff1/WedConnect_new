# WedConnect · Implementierungsstand

**Version:** 1.0  
**Stand:** 14. Oktober 2026  
**Geprüfte Referenz:** GitHub `main`, Commit `3e000d296cea561203480c48cfb03ae3823905f6`  
**Prüfart:** Quellcode- und Migrationsprüfung; kein erneuter Live-Login mit Testkonten in dieser Dokumentationsrunde

Dieses Dokument beschreibt den belegbaren Codezustand. Es trennt Code, Produktentscheidung und ungeprüften Betriebszustand.

## Kurzstatus

| Bereich | Status laut Repository |
|---|---|
| Öffentliche Seiten | `index.html`, `hochzeitspaare.html`, `fotografen.html` vorhanden. Fotografen-Seite ist der eingefrorene Website-Master. |
| Anmeldung | Supabase Auth für E-Mail/Passwort und Google ist eingebunden. Der Nutzer hat die funktionierende Anmeldung und Weiterleitung zuletzt bestätigt. |
| Rollenwahl | Erfolgt nach der Anmeldung im Profil-Onboarding, nicht im Auth-Formular. |
| Profil-Onboarding | Mehrstufige Formulare für Hochzeitspaar und Fotograf, Zwischenschrittspeicherung und Foto-Crop sind im Code vorhanden. |
| Hochzeitspaarfotos | Gemeinsame oder individuelle Fotos; die zuletzt geprüfte Änderung unterstützt individuelle Uploads, Crop und Ausrichtung. Nutzer hat den Ablauf als passend bestätigt. |
| Fotografengalerie | Code enthält 2-MB-Bildlimit, Crop, Löschen und zusätzlich noch Highlight-Stern-Logik. Siehe Abweichungen. |
| Likes / Matches / Chat | Eine Likes-Migration liegt im Repository. Eine vollständige funktionsfähige Entdecken-, Like-, Match- oder Chat-Oberfläche ist aus dem aktuellen Code nicht belegt. |
| Konto-Profilfoto | Eine Avatar-Migration ist vorhanden. Die gewünschte Upload-/Crop-Verwaltung ist im geprüften `dashboard.html` und Dashboard-JS nicht belegt. |
| Live-Datenbank | Ob alle im Repository vorhandenen Migrationen auf dem verbundenen Supabase-Projekt ausgeführt wurden, ist hier nicht abfragbar. |

## Zentrale Codepfade

- Auth und öffentliche Einstiege: `index.html`, `assets/js/wedconnect-auth.js`
- Dashboard und Onboarding: `dashboard.html`, `assets/js/wedconnect-dashboard.js`
- Öffentliche Seiten: `index.html`, `hochzeitspaare.html`, `fotografen.html`
- Supabase-Verbindung: `assets/js/supabase-config.js` (nur öffentliche URL und Publishable Key; kein Service-Role-Key im Browser)

Das Dashboard prüft die Supabase-Sitzung, leitet nicht angemeldete Personen zur Anmeldung zurück und öffnet für unvollständige Profile das Onboarding. Nach Profilabschluss wird die Dashboard-Übersicht angezeigt. Die Navigationspunkte Entdecken, Matches und Nachrichten sind im geprüften Stand gesperrt.

## Datenbankdateien im Repository

In `supabase/migrations/` liegen diese Migrationen in Zeitreihenfolge:

1. `20261012160000_init_profiles.sql`
2. `20261013120000_profile_onboarding.sql`
3. `20261013130000_allow_role_change_until_profile_complete.sql`
4. `20261013140000_structured_photographer_profile.sql`
5. `20261013143000_recover_profile_role_on_completion.sql`
6. `20261013150000_allow_stepwise_profile_saves.sql`
7. `20261013153000_photographer_compensation.sql`
8. `20261013160000_photographer_coverage_options.sql`
9. `20261013170000_portfolio_photos_minimum_three.sql`
10. `20261013180000_separate_profile_photo_originals_and_display.sql`
11. `20261013185000_photographer_photo_placement.sql`
12. `20261013190000_fix_profile_completion_and_photo_deletion.sql`
13. `20261013200000_portfolio_highlight_star.sql`
14. `20261013210000_fix_role_reassignment_before_completion.sql`
15. `20261013220000_allow_role_changes_after_completion.sql`
16. `20261014110000_profile_likes.sql`
17. `20261014120000_profile_avatars.sql`
18. `20261014130000_structured_couple_profile_fields.sql`
19. `20261014150000_allow_couple_profile_drafts.sql`

Zusätzlich liegt `20261014100000_profile_public_intro.sql` derzeit im Repository-Root statt im Migrationsordner. Die Supabase-README wurde entsprechend aktualisiert. Bei einer Neueinrichtung muss auch diese Datei in Zeitreihenfolge ausgeführt werden. Vor einem späteren Datenbank-Reset ist die vollständige Liste mit dem realen Supabase-Migrationsstatus abzugleichen.

Der private Bucket `wedconnect-profile-photos` ist laut SQL für JPEG, PNG und WebP sowie maximal 10 MB je Objekt vorgesehen. Das Fotografenformular hat zusätzlich ein clientseitiges Limit von 2 MB. Inkomplette Profile und Fotos sind laut Policies privat; vollständige Profile sind für angemeldete WedConnect-Nutzer lesbar.

## Bestätigte Abweichungen zwischen Entscheidung und Code

Diese Punkte sind wichtig, damit eine neue Sitzung keine Code-Eigenheit irrtümlich für eine bestätigte Produktentscheidung hält:

1. **Fotografen-Highlights:** Die aktuelle Produktentscheidung lautet Galerie mit bis zu 20 normalen Fotos, ohne Stern oder Highlight-Auswahl. Im geprüften JS, HTML/CSS und in `20261013200000_portfolio_highlight_star.sql` ist die alte Highlight-Funktion noch vorhanden; Onboarding verlangt sogar mindestens drei markierte Highlights. Diese Abweichung ist nicht im Rahmen der Dokumentationsänderung behoben.
2. **Vergütung:** Gewünscht sind nur „Unentgeltlich“ und „Fixbetrag“ sowie kein separates Feld für zusätzliche Nutzungsrechte-Vergütung. Der Code enthält noch `negotiable` und `usage_rights_compensation`.
3. **Hauptansicht nach Profilabschluss:** Gewünscht ist das vollständige eigene Profil mit Galerie als zentrale Dashboard-Ansicht. Der geprüfte Dashboard-Markup zeigt noch die frühere Übersichts-/Profilaktion statt der final gewünschten vollständigen Profilansicht.
4. **Navigation und Konto:** Gewünscht sind erreichbare Navigation während der Bearbeitung sowie ein Bereich „Konto und Einstellungen“ mit Profilfoto-Verwaltung. Im geprüften Markup sind noch separate Onboarding-Ansicht, einfache Abmeldung und Buchstaben-Avatar vorhanden; ein funktionsfähiger Profilfoto-Dialog ist nicht belegt.
5. **Autosave:** Gewünscht ist automatisches Speichern von Profiländerungen. Der geprüfte Onboarding-Ablauf speichert beim Weitergehen zwischen Schritten; ein allgemeines Autosave beim Bearbeiten des fertigen Profils ist nicht belegt.

Die Punkte oben gehören in einen späteren, ausdrücklich freigegebenen Implementierungsauftrag. Diese Dokumentationsrunde verändert keinen Code und keine eingefrorene öffentliche Seite.

## Deployment und Verifikation

Der geprüfte Commit `3e000d296cea561203480c48cfb03ae3823905f6` ist als Vercel-Deployment mit Status `READY` dokumentiert. Der letzte Code-Commit betrifft individuelle Hochzeitspaarfotos und deren Zuschnitt. Der aktuelle Deployment- und Supabase-Laufzeitstatus wurde in dieser Runde nicht live erneut getestet.

## Bei jeder Änderung aktualisieren

- Geänderte Funktion und betroffene Route/Datei
- dazugehörige Migration(en) und Hinweis, ob sie in Supabase ausgeführt wurden
- Status der Auth-, Profil-, Foto-, Entdecken-, Like-, Match- und Chat-Flows
- Verifikation (lokal, Preview, Produktion) samt Commit/Deployment
- neue Abweichungen oder behobene Punkte
