# WedConnect · Implementierungsstand

**Version:** 1.1  
**Stand der Prüfung:** 14. Oktober 2026  
**Geprüfte Referenz:** GitHub `Supersheriff1/WedConnect_new`, Branch `main`, HEAD `20a268f2f6d2e155001a8c13b6fbbb370fe568e9`  
**Geprüfte Dateien:** `dashboard.html` (Blob `36c0a523a9bd76c38d2b117b30ef418e78889947`), `assets/js/wedconnect-dashboard.js` (Blob `2a11415c79a42d85ff039d5102079e42ed2ee1a2`)  
**Prüfart:** GitHub-Quellcode und SQL-Migrationen; kein Login auf Vercel und keine Abfrage des aktiven Supabase-Migrationsstatus in dieser Runde

Dieses Dokument beschreibt den Stand im Repository. Es unterscheidet implementierten Code von bestätigtem Live-Betrieb.

## Kurzstatus

| Bereich | Stand in `main` |
|---|---|
| Öffentliche Seiten | `index.html`, `hochzeitspaare.html` und `fotografen.html` sind vorhanden. Die Fotografen-Seite bleibt eingefroren. |
| Anmeldung | Supabase Auth für E-Mail/Passwort und Google ist eingebunden. Die Anmeldung fragt keine Rolle ab. Der Nutzer hat Anmeldung und Weiterleitung zuvor als funktionierend bestätigt. |
| Einstieg nach Login | `dashboard.html` prüft die Auth-Sitzung. Unvollständige Konten beginnen dort mit der Profilanlage; die Rolle wird als erster Profilschritt gewählt. |
| Hochzeitspaar-Profil | Strukturierte Angaben zu Bundesland, gewünschter Begleitung und Bildstilen liegen samt Migration vor. Der Abschluss verlangt ein gemeinsames Foto oder je ein Foto für beide Personen. |
| Fotografen-Profil | Strukturierte Einsatzgebiete, Erfahrung, Stile, Begleitungsumfang, Galerie, Vergütung, Vorstellung und optionale Links sind im Code abgebildet. |
| Galerie | Bis zu 20 normale Fotografenfotos, maximal 2 MB pro Foto. Kein Highlight-Stern und keine Highlight-Auswahl in der aktuellen Oberfläche. Fotos können angesehen, zugeschnitten, ersetzt und gelöscht werden. |
| Profilfoto des Kontos | Upload, Zuschnitt/Ausrichtung und Entfernen über den Konto-Dialog sind implementiert. |
| Eigene Profilansicht | Nach Profilabschluss zeigt das Dashboard das vollständige eigene Profil mit Galerie. Die Galerie lädt Bilder schrittweise/lazy. |
| Bearbeitung | Profilentwürfe werden in der Bearbeitung automatisch gespeichert. Navigation und Konto-/Einstellungsdialoge sind im Dashboard vorhanden. |
| Entdecken, Likes, Matches, Nachrichten | Eine Datenbankmigration für Likes liegt vor. Die vollständigen Discover-, Like-, Match- und Nachrichtenabläufe sind in dieser Prüfung nicht als nutzbarer End-to-End-Flow bestätigt; die entsprechenden Bereiche bleiben gesperrt. |
| Supabase-Live-Status | Nicht geprüft. Eine Migration im Repository beweist nicht, dass sie auf dem verbundenen Supabase-Projekt ausgeführt wurde. |

## Ablauf und Profile

Die Anmeldung ist für alle gleich und rollenfrei. Nach erfolgreicher Authentifizierung führt der Einstieg zu `dashboard.html`. Wenn noch keine Rolle gespeichert ist, startet die Profilanlage mit der Auswahl „Hochzeitspaar“ oder „Fotograf“. Die Rolle ist der erste Schritt des Profils, nicht der Anmeldung.

Der Hochzeitsprofil-Code enthält strukturierte Felder für österreichisches Bundesland, Begleitungsumfang und Bildstile einschließlich Boho. Der Profilabschluss prüft Vornamen beider heiratenden Personen, Datum, Ort, Gästezahl, strukturierte Angaben, Beschreibung und Bildnutzungspräferenz. Für Fotos ist entweder ein gemeinsames Foto oder je ein Foto pro Person erforderlich. Gemeinsame und einzelne Fotos können zugeschnitten und ausgerichtet werden.

Das Fotografenprofil enthält strukturierte Einsatzgebiete und Stile, Erfahrungsangaben, Begleitungsumfang, persönliche Vorstellung, optionale Instagram-/Website-Angaben sowie die Vergütungsauswahl „Unentgeltlich“ oder „Fixbetrag“. Bei Fixbetrag ist ein Betrag erforderlich. Die Galerie erlaubt bis zu 20 Fotos mit 2-MB-Grenze je Foto; die SQL-Storage-Konfiguration erlaubt größere Objekte, deshalb ist die Client-Grenze gesondert zu beachten.

Im abgeschlossenen Dashboard ist das eigene vollständige Profil die zentrale Ansicht. Konto-Profilfoto und Kontoeinstellungen liegen in Dialogen. Änderungen im Profilbearbeitungsmodus werden automatisch gespeichert. Nicht angemeldete Besucher werden vom Dashboard zur Anmeldung geleitet.

## Zentrale Codepfade

- Auth und öffentliche Einstiege: `index.html`, `assets/js/wedconnect-auth.js`
- Dashboard, Profilanlage, Galerie und eigene Profilansicht: `dashboard.html`, `assets/js/wedconnect-dashboard.js`
- Öffentliche Seiten: `index.html`, `hochzeitspaare.html`, `fotografen.html`
- Supabase-Konfiguration: `assets/js/supabase-config.js` (nur öffentliche URL und Publishable Key; niemals Service-Role-Key im Browser)
- Datenbankänderungen: `supabase/migrations/` sowie die dort referenzierte Migration `20261014100000_profile_public_intro.sql` im Repository-Root

## Datenbank und Migrationen

Die Migrationsdateien im Repository umfassen Profilanlage, rollenabhängige Felder, schrittweises Speichern, Vergütung, Fotografenabdeckung, Galerie/Foto-Crop und -Löschung, Likes, Konto-Profilfotos sowie strukturierte Hochzeitsprofilfelder und Entwürfe. Die vollständige geordnete Dateiliste steht in [supabase/README.md](../supabase/README.md).

Die ältere Migration `20261013200000_portfolio_highlight_star.sql` bleibt aus Datenbank-Historiegründen vorhanden. Die aktuelle Oberfläche und das aktuelle Dashboard-JS verwenden keine Highlight-Markierung; die Produktentscheidung sind bis zu 20 normale Galeriefotos. Eine Bereinigung alter Schemafelder wäre eine gesondert zu prüfende Migration und ist nicht Teil dieses Statusupdates.

Der private Bucket `wedconnect-profile-photos` ist laut SQL auf JPEG, PNG und WebP sowie bis zu 10 MB je gespeicherter Datei eingerichtet. Die Fotografenoberfläche setzt zusätzlich 2 MB je Bild durch. Für ein bestehendes Supabase-Projekt den tatsächlich ausgeführten Migrationsverlauf prüfen; Dateien weder blind erneut ausführen noch aus dem Repository-Stand auf Live-Schema schließen.

## Verifikation und Grenzen

- Der Code wurde auf GitHub-`main` geprüft; die frühere lokale Arbeitskopie war veraltet und ist keine Referenz für diesen Stand.
- Der zuletzt vom Nutzer bestätigte Login-Ablauf bleibt als Nutzerbeobachtung dokumentiert; in dieser Runde erfolgte kein erneuter Google- oder E-Mail-Test.
- Vercel-Deployment, Produktionsverhalten und aktive Supabase-Migrationen wurden in dieser Prüfung nicht live verifiziert.
- Die öffentliche Fotografen-Seite wurde nicht verändert. Es wurden keine App-Dateien oder Datenbankdateien geändert.

## Bei jeder künftigen Umsetzung aktualisieren

- betroffene Funktion, Route und Dateien
- zugehörige Migration(en) und separat bestätigter Ausführungsstatus in Supabase
- Status von Auth, Profilanlage, Fotos, Entdecken, Likes, Matches und Nachrichten
- Verifikation: lokal, Preview oder Produktion samt Commit/Deployment
- Abweichungen zwischen Produktentscheidung, Code und Live-System

