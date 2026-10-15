# WedConnect · Implementierungsstand

**Version:** 1.3  
**Stand der Prüfung:** 15. Oktober 2026  
**Geprüfte Referenz:** GitHub `Supersheriff1/WedConnect_new`, Feature-Branch `feature/couple-wedding-timeline-20261015`, Basis `main` bei `0cf33004efaacfdf8715c0bd45293d919a3e4b66`  
**Geprüfte Dateien:** Dashboard, Onboarding-JavaScript, Hochzeitsprofil- und Aktivitätsmigrationen sowie Projekt- und App-Design-Bibles auf dem Feature-Branch  
**Prüfart:** Quellcode und SQL geprüft; keine Live-Prüfung von Vercel oder dem aktiven Supabase-Migrationsstatus

Dieses Dokument beschreibt den Stand im Repository. Es unterscheidet implementierten Code von bestätigtem Live-Betrieb.

## Kurzstatus

| Bereich | Stand im Feature-Branch |
|---|---|
| Öffentliche Seiten | `index.html`, `hochzeitspaare.html` und `fotografen.html` sind vorhanden. Die Fotografen-Seite bleibt eingefroren. |
| Anmeldung | Supabase Auth für E-Mail/Passwort und Google ist eingebunden. Die Anmeldung fragt keine Rolle ab. Der Nutzer hat Anmeldung und Weiterleitung zuvor als funktionierend bestätigt. |
| Einstieg nach Login | `dashboard.html` prüft die Auth-Sitzung. Unvollständige Konten beginnen dort mit der Profilanlage; die Rolle wird als erster Profilschritt gewählt. |
| Hochzeitspaar-Profil | Auf dem Feature-Branch: Trauungsart als Pflichtauswahl, Ort der Hochzeit plus getrennte optionale Locations für Trauung und Feier, strukturierte Begleitung und geführter Ablauf mit bis zu sieben Programmpunkten. Bildstil und Bildwünsche sind aus der Oberfläche entfernt; die Nutzungspräferenz bleibt. Die neue SQL-Migration liegt bei, ist aber nicht live verifiziert. |
| Fotografen-Profil | Strukturierte Einsatzgebiete, Erfahrung, Stile, Begleitungsumfang, Galerie, Vergütung, Vorstellung und optionale Links sind im Code abgebildet. |
| Galerie | Bis zu 20 normale Fotografenfotos, maximal 2 MB pro Foto. Kein Highlight-Stern und keine Highlight-Auswahl in der aktuellen Oberfläche. Fotos können angesehen, zugeschnitten, ersetzt und gelöscht werden. |
| Profilfoto des Kontos | Upload, Zuschnitt/Ausrichtung und Entfernen über den Konto-Dialog sind implementiert. |
| Übersicht | Startet nach Profilabschluss mit Begrüßung, offenen eingegangenen Likes und beidseitigen Matches ohne erste Nachricht. Abschnitte ohne Inhalte bleiben verborgen. App-Neuigkeiten und Partnerangebote werden rollenbezogen nur bei veröffentlichten Einträgen angezeigt. |
| Eigene Profilansicht | Vollständiges eigenes Profil mit Galerie unter „Profil“. Hochzeitspaare sehen Key Facts für Datum, Ort und Bildnutzungspräferenz. |
| Hochzeitspaarfotos | Je ein eigenes Foto pro Person erforderlich, gemeinsames Foto optional; 2-MB-Grenze, Vorname(n) links unten als nicht-destruktive Ansichtseinblendung. |
| Matches und Nachrichten | Likes lassen sich auf der Übersicht beantworten; gegenseitige Likes werden als Matches angezeigt. Neue Matches können direkt angeschrieben werden; bestehende Nachrichten erscheinen in der Nachrichtenansicht. End-to-End-Live-Test steht aus. |
| E-Mail-Einstellungen | Ereignisbezogene Präferenzen für Likes, Matches, Nachrichten, App-Neuigkeiten und Partnerangebote werden in Supabase gespeichert. Ein Versanddienst, der diese Einstellungen auswertet, ist nicht angeschlossen. |
| Bearbeitung | Profilentwürfe werden in der Bearbeitung automatisch gespeichert. Navigation und Konto-/Einstellungsdialoge sind im Dashboard vorhanden. |
| Entdecken | Bleibt bis zur Umsetzung des Browse-/Discover-Flows gesperrt. |
| Supabase-Live-Status | Nicht geprüft. Eine Migration im Repository beweist nicht, dass sie auf dem verbundenen Supabase-Projekt ausgeführt wurde. |

## Ablauf und Profile

Die Anmeldung ist für alle gleich und rollenfrei. Nach erfolgreicher Authentifizierung führt der Einstieg zu `dashboard.html`. Wenn noch keine Rolle gespeichert ist, startet die Profilanlage mit der Auswahl „Hochzeitspaar“ oder „Fotograf“. Die Rolle ist der erste Schritt des Profils, nicht der Anmeldung.

Der Hochzeitsprofil-Code enthält auf dem Feature-Branch eine Pflichtauswahl zur Trauungsart (standesamtlich, kirchlich oder frei), österreichisches Bundesland, Ort der Hochzeit und separate optionale Locations für Trauung und Feier, strukturierten Begleitungsumfang und einen geführten Tagesablauf mit bis zu sieben Programmpunkten, jeweils mit ungefährer Uhrzeit und optionalen Hinweisen. Bildstil und separate Bildwünsche werden im Paarformular nicht mehr angezeigt. Die Bildnutzungspräferenz bleibt bestehen. Die SQL-Migration ergänzt `ceremony_type`, `schedule_items`, `wedding_town` und getrennte Felder für Trauungs- und Feierlocation. Vorhandene Ortsangaben werden nach `wedding_town` übernommen; alte Textspalten bleiben zur Kompatibilität erhalten. Für Fotos ist je mindestens ein eigenes Foto pro Person erforderlich; ein gemeinsames Foto ist optional. Nach Auswahl und Zuschnittsbestätigung startet der Upload sofort.

Das Fotografenprofil enthält strukturierte Einsatzgebiete und Stile, Erfahrungsangaben, Begleitungsumfang, persönliche Vorstellung, optionale Instagram-/Website-Angaben sowie die Vergütungsauswahl „Unentgeltlich“ oder „Fixbetrag“. Bei Fixbetrag ist ein Betrag erforderlich. Die Galerie erlaubt bis zu 20 Fotos mit 2-MB-Grenze je Foto; die SQL-Storage-Konfiguration erlaubt größere Objekte, deshalb ist die Client-Grenze gesondert zu beachten.

Nach Profilabschluss führt das Dashboard zur Übersicht; die vollständige eigene Profilansicht liegt unter „Profil“. Eingehende Likes können beantwortet und Matches direkt angeschrieben werden. Konto-Profilfoto und Kontoeinstellungen liegen in Dialogen. Änderungen im Profilbearbeitungsmodus werden automatisch gespeichert. Nicht angemeldete Besucher werden vom Dashboard zur Anmeldung geleitet.

## Zentrale Codepfade

- Auth und öffentliche Einstiege: `index.html`, `assets/js/wedconnect-auth.js`
- Dashboard, Profilanlage, Galerie und eigene Profilansicht: `dashboard.html`, `assets/js/wedconnect-dashboard.js`
- Öffentliche Seiten: `index.html`, `hochzeitspaare.html`, `fotografen.html`
- Supabase-Konfiguration: `assets/js/supabase-config.js` (nur öffentliche URL und Publishable Key; niemals Service-Role-Key im Browser)
- Datenbankänderungen: `supabase/migrations/` sowie die dort referenzierte Migration `20261014100000_profile_public_intro.sql` im Repository-Root

## Datenbank und Migrationen

Die Migrationsdateien umfassen Profilanlage, rollenabhängige Felder, schrittweises Speichern, Vergütung, Fotografenabdeckung, Galerie/Foto-Crop und -Löschung, Likes, Nachrichten, Benachrichtigungspräferenzen, veröffentlichte App-Neuigkeiten und Partnerangebote, Konto-Profilfotos sowie strukturierte Hochzeitsprofilfelder und Entwürfe. Die vollständige geordnete Dateiliste steht in [supabase/README.md](../supabase/README.md).

Die ältere Migration `20261013200000_portfolio_highlight_star.sql` bleibt aus Datenbank-Historiegründen vorhanden. Die aktuelle Oberfläche und das aktuelle Dashboard-JS verwenden keine Highlight-Markierung; die Produktentscheidung sind bis zu 20 normale Galeriefotos. Eine Bereinigung alter Schemafelder wäre eine gesondert zu prüfende Migration und ist nicht Teil dieses Statusupdates.

Die neue Aktivitätsmigration setzt die Grenze des privaten Buckets `wedconnect-profile-photos` auf 2 MB pro gespeicherter Datei. Fotografen- und Paaroberfläche begrenzen Uploads ebenfalls auf 2 MB. Für ein bestehendes Supabase-Projekt den tatsächlich ausgeführten Migrationsverlauf prüfen; Dateien nicht blind erneut ausführen.

## Verifikation und Grenzen

- Der aktuelle Umsetzungsstand wurde auf `feature/couple-wedding-timeline-20261015` gegen die GitHub-Dateien geprüft; JavaScript-Syntax wurde lokal geparst. Der Branch enthält Profil-, Aktivitäts- und Einstellungsänderungen, ist aber nicht mit `main` zusammengeführt.
- Der zuletzt vom Nutzer bestätigte Login-Ablauf bleibt als Nutzerbeobachtung dokumentiert; in dieser Runde erfolgte kein erneuter Google- oder E-Mail-Test.
- Vercel-Deployment, Produktionsverhalten und aktive Supabase-Migrationen wurden nicht live verifiziert. Für Aktivitätsansicht, 2-MB-Grenze und Einstellungen sind die neuen Hochzeitsprofil- und Aktivitätsmigrationen erforderlich.
- Ein Verwaltungsbildschirm zum Erstellen/Planen von Neuigkeiten und Partnerangeboten existiert nicht; veröffentlichte Inhalte können erst nach einer separaten Admin-Funktion gepflegt werden.
- Die öffentliche Fotografen-Seite wurde nicht verändert. Die Änderung betrifft Dashboard, JavaScript, zwei SQL-Migrationen und Dokumentation.

## Bei jeder künftigen Umsetzung aktualisieren

- betroffene Funktion, Route und Dateien
- zugehörige Migration(en) und separat bestätigter Ausführungsstatus in Supabase
- Status von Auth, Profilanlage, Fotos, Entdecken, Likes, Matches und Nachrichten
- Verifikation: lokal, Preview oder Produktion samt Commit/Deployment
- Abweichungen zwischen Produktentscheidung, Code und Live-System

