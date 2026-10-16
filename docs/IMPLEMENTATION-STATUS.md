# WedConnect · Implementierungsstand

**Version:** 2.2  
**Stand der Prüfung:** 16. Oktober 2026  
**Geprüfte Referenz:** GitHub `Supersheriff1/WedConnect_new`, `main` (`7807fba70dbcf413ef4605429136729a56525e09`)  
**Geprüfte Dateien:** Dashboard, Dashboard-JavaScript, Support- und Nachrichtenmigrationen, Supabase Edge Function, Supabase-Setup sowie Projekt-, App-Design- und Ideen-Bibles  
**Prüfart:** Quellcode und SQL geprüft; JavaScript-Syntax geprüft; kein Live-End-to-End-Test; aktiver Supabase-Migrationsstatus nicht geprüft

Dieses Dokument beschreibt den Stand im Repository. Es unterscheidet implementierten Code von bestätigtem Live-Betrieb.

## Kurzstatus

| Bereich | Stand in `main` |
|---|---|
| Öffentliche Seiten | `index.html`, `hochzeitspaare.html` und `fotografen.html` sind vorhanden. Die Fotografen-Seite bleibt eingefroren. |
| Anmeldung | Supabase Auth für E-Mail/Passwort und Google ist eingebunden. Die Anmeldung fragt keine Rolle ab. Der Nutzer hat Anmeldung und Weiterleitung zuvor als funktionierend bestätigt. |
| Einstieg nach Login | `dashboard.html` prüft die Auth-Sitzung. Unvollständige Konten beginnen dort mit der Profilanlage; die Rolle wird als erster Profilschritt gewählt. |
| Hochzeitspaar-Profil | In `main`: Trauungsart als Pflichtauswahl, Ort der Hochzeit plus getrennte optionale Locations für Trauung und Feier, strukturierte Begleitung und geführter Ablauf mit bis zu sieben Programmpunkten. Bildstil und Bildwünsche sind aus der Oberfläche entfernt; die Nutzungspräferenz bleibt. Die neue SQL-Migration liegt bei, ist aber nicht live verifiziert. |
| Fotografen-Profil | Strukturierte Einsatzgebiete, Erfahrung, Stile, Begleitungsumfang, Galerie, Vergütung, Vorstellung und optionale Links sind im Code abgebildet. |
| Galerie | Bis zu 20 normale Fotografenfotos, maximal 2 MB pro Foto. Kein Highlight-Stern und keine Highlight-Auswahl in der aktuellen Oberfläche. Fotos können angesehen, zugeschnitten, ersetzt und gelöscht werden. |
| Profilfoto des Kontos | Upload, Zuschnitt/Ausrichtung und Entfernen über den Konto-Dialog sind implementiert. |
| Übersicht | Startet nach Profilabschluss mit Begrüßung, offenen eingegangenen Likes und beidseitigen Matches ohne erste Nachricht. Abschnitte ohne Inhalte bleiben verborgen. App-Neuigkeiten und Partnerangebote werden rollenbezogen nur bei veröffentlichten Einträgen angezeigt. |
| Eigene Profilansicht | Vollständiges eigenes Profil mit Galerie unter „Profil“. Hochzeitspaare sehen Key Facts für Datum, Ort und Bildnutzungspräferenz. |
| Hochzeitspaarfotos | Je ein eigenes Foto pro Person erforderlich, gemeinsames Foto optional; 2-MB-Grenze, Vorname(n) links unten als nicht-destruktive Ansichtseinblendung. |
| Matches und Nachrichten | Chats aktualisieren offene Gespräche automatisch alle fünf Sekunden und beim Zurückkehren in den Browser-Tab. Nachrichten können mit einem Herz markiert werden; jede Person kann ihr eigenes Herz wieder entfernen. Dazu ist die Migration `20261016090000_profile_message_reactions.sql` erforderlich. Likes lassen sich auf der Übersicht beantworten; gegenseitige Likes werden als Matches angezeigt. Neue Matches können direkt angeschrieben werden; bestehende Nachrichten erscheinen in der Nachrichtenansicht mit Profilfoto des Gegenübers und der letzten Nachricht; ein Klick auf die gesamte Unterhaltungskarte öffnet den Chat. Das Menü Matches hat oben Tabs für Matches und erhaltene offene Likes, jeweils mit Anzahl. Hinweistexte und Leerzustände sprechen Hochzeitspaare mit „ihr/euch“ und Fotografen mit „du/dir“ an. Likes können dort beantwortet werden. Ein Klick auf die gesamte Karte öffnet das Profil im Dashboard; Like-/Dislike- und Chat-Aktionen bleiben separat. Die Matches-Navigation bleibt aktiv, Zurück führt zur Matchliste; Chat bleibt separat. |
| E-Mail-Einstellungen | Ereignisbezogene Präferenzen für Likes, Matches, Nachrichten, App-Neuigkeiten und Partnerangebote werden in Supabase gespeichert. Ein Versanddienst, der diese Einstellungen auswertet, ist nicht angeschlossen. |
| Bearbeitung | Profilentwürfe werden in der Bearbeitung automatisch gespeichert. Navigation und Konto-/Einstellungsdialoge sind im Dashboard vorhanden. |
| Entdecken | Lädt vollständige Profile der jeweils anderen Rolle. Gesendete Likes werden in `profile_likes` gespeichert; ein gegenseitiges Like erzeugt ein Match. „Überspringen“ wird privat in `profile_skips` gespeichert und blendet das Profil künftig aus. Der Live-End-to-End-Test steht noch aus. |
| Supabase-Live-Status | Nicht geprüft. Eine Migration im Repository beweist nicht, dass sie auf dem verbundenen Supabase-Projekt ausgeführt wurde. |

## Ablauf und Profile

Die Anmeldung ist für alle gleich und rollenfrei. Nach erfolgreicher Authentifizierung führt der Einstieg zu `dashboard.html`. Wenn noch keine Rolle gespeichert ist, startet die Profilanlage mit der Auswahl „Hochzeitspaar“ oder „Fotograf“. Die Rolle ist der erste Schritt des Profils, nicht der Anmeldung.

Der Hochzeitsprofil-Code enthält in `main` eine Pflichtauswahl zur Trauungsart (standesamtlich, kirchlich oder frei), österreichisches Bundesland, Ort der Hochzeit und separate optionale Locations für Trauung und Feier, strukturierten Begleitungsumfang und einen geführten Tagesablauf mit bis zu sieben Programmpunkten, jeweils mit ungefährer Uhrzeit und optionalen Hinweisen. Bildstil und separate Bildwünsche werden im Paarformular nicht mehr angezeigt. Die Bildnutzungspräferenz bleibt bestehen. Die SQL-Migration ergänzt `ceremony_type`, `schedule_items`, `wedding_town` und getrennte Felder für Trauungs- und Feierlocation. Vorhandene Ortsangaben werden nach `wedding_town` übernommen; alte Textspalten bleiben zur Kompatibilität erhalten. Für Fotos muss jede Person repräsentiert sein: entweder durch ein gemeinsames Foto oder durch je ein individuelles Foto. Ein gemeinsames Foto kann mit individuellen Fotos kombiniert werden. Nach Auswahl und Zuschnittsbestätigung startet der Upload sofort.

Das Fotografenprofil enthält strukturierte Einsatzgebiete und Stile, Erfahrungsangaben, Begleitungsumfang, persönliche Vorstellung, optionale Instagram-/Website-Angaben sowie die Vergütungsauswahl „Unentgeltlich“ oder „Fixbetrag“. Bei Fixbetrag ist ein Betrag erforderlich. Die Galerie erlaubt bis zu 20 Fotos mit 2-MB-Grenze je Foto. Die Aktivitätsmigration setzt den privaten Foto-Bucket ebenfalls auf maximal 2 MB pro Datei; der Status dieser Migration im Live-Supabase ist nicht geprüft.

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

Die Discover-Migration `20261015200000_profile_skips_for_discover.sql` ergänzt private, kontobezogene Überspringen-Einträge. Sie muss vor dem Discover-Live-Test in Supabase ausgeführt sein. Die neue Aktivitätsmigration setzt die Grenze des privaten Buckets `wedconnect-profile-photos` auf 2 MB pro gespeicherter Datei. Fotografen- und Paaroberfläche begrenzen Uploads ebenfalls auf 2 MB. Für ein bestehendes Supabase-Projekt den tatsächlich ausgeführten Migrationsverlauf prüfen; Dateien nicht blind erneut ausführen.

## Nachrichtenlöschung im Chat

Eigene gesendete Nachrichten können am Handy durch längeres Drücken oder am Desktop über das Nachrichtenmenü für beide Seiten gelöscht werden. Ein Bestätigungsdialog erklärt die Auswirkung. Beim Bestätigen wird der Nachrichtentext in der Datenbank durch einen Löschhinweis ersetzt und die App zeigt an der ursprünglichen Stelle für beide Beteiligten den neutralen Hinweis „Nachricht wurde gelöscht“; vorhandene Herzreaktionen werden entfernt. Dafür muss `supabase/migrations/20261016110000_profile_message_delete_for_everyone.sql` im aktiven Supabase-Projekt ausgeführt werden. Die frühere Migration `20261016100000_profile_message_hidden.sql` bleibt aus Migrationshistorie bestehen, wird von der Oberfläche aber nicht mehr verwendet.

## Kontakt / Feedback

Der Kontobereich bietet Chat mit dem WedConnect-Team. Das Kontaktfenster bleibt bei jedem Einstieg sichtbar und fragt Art der Kontaktaufnahme, Betreff und Nachricht ab. Diese Angaben werden gemeinsam in eine Chatnachricht übernommen und an die bestehende Unterhaltung angehängt; nur beim ersten Kontakt wird ein Support-Thread erstellt. Nach dem Absenden öffnet sich der Chat. Der Betreiber-Eingang ist über `support_operators` zugriffsgeschützt. Support-E-Mail-Versand und Push-Benachrichtigungen sind nicht vorgesehen.

Gelöschte Chat-Nachrichten behalten den ursprünglichen Absender. Der Hinweis „Nachricht wurde gelöscht“ wird rechts für eigene bzw. links für empfangene Nachrichten ausgerichtet.

## Verifikation und Grenzen

- Der Kontakt-/Feedback-Stand und die Ausrichtung der Nachrichtenlöschvermerke wurden auf einem Feature-Branch gegen `main` geprüft. Das Dashboard-JavaScript wurde syntaktisch geparst. Der Branch enthält Profil-, Aktivitäts- und Einstellungsänderungen, ist aber nicht mit `main` zusammengeführt.
- Der zuletzt vom Nutzer bestätigte Login-Ablauf bleibt als Nutzerbeobachtung dokumentiert; in dieser Runde erfolgte kein erneuter Google- oder E-Mail-Test.
- Der PR meldet den automatischen Vercel-Preview-Build als „Ready“ und der Vercel-Statuscheck ist erfolgreich. Der geschützte Preview-Inhalt ließ sich über die verbundene Vercel-Verbindung nicht abrufen; ein UI-End-to-End-Test fand daher nicht statt. Nachträgliche Korrekturen am Profilabschluss und an der Foto-Regel liegen auf dem Branch und benötigen einen neuen Preview-Build. Produktionsverhalten und aktive Supabase-Migrationen bleiben ungeprüft; für Aktivitätsansicht, 2-MB-Grenze und Einstellungen sind die neuen Hochzeitsprofil- und Aktivitätsmigrationen erforderlich.
- Ein Verwaltungsbildschirm zum Erstellen/Planen von Neuigkeiten und Partnerangeboten existiert nicht; veröffentlichte Inhalte können erst nach einer separaten Admin-Funktion gepflegt werden.
- Die öffentliche Fotografen-Seite wurde nicht verändert. Die Änderung betrifft Dashboard, JavaScript, zwei SQL-Migrationen und Dokumentation.

## Bei jeder künftigen Umsetzung aktualisieren

- betroffene Funktion, Route und Dateien
- zugehörige Migration(en) und separat bestätigter Ausführungsstatus in Supabase
- Status von Auth, Profilanlage, Fotos, Entdecken, Likes, Matches und Nachrichten
- Verifikation: lokal, Preview oder Produktion samt Commit/Deployment
- Abweichungen zwischen Produktentscheidung, Code und Live-System



## Änderungen dieses Feature-Branches

- Kontaktbereich: Chatformular mit Art der Kontaktaufnahme, Betreff und Nachricht; die Angaben stehen gemeinsam in der Chatnachricht.
- Nachrichten: weitere Supportnachrichten werden an die bestehende Unterhaltung angehängt. Das Kontaktformular bleibt davor sichtbar.
- Datenbank: Support-Threads, Nachrichten, Betreiber-Allowlist, RLS-Regeln und RPC zum atomaren Erstellen eines Threads.
- E-Mail-Support und Push-Benachrichtigungen sind nicht Bestandteil der Funktion.
- Nachrichtenlöschung: Anzeige bleibt auf der ursprünglichen Absenderseite.
- Die Support-Migration und Betreiberfreischaltung müssen im Supabase-Projekt erfolgen. Eine Live-DB-Migration wurde nicht getestet.


## Nachrichten: Lesestatus und Ungelesen-Zähler (16. Oktober 2026)

- Persönliche Unterhaltungen und Support-Chats speichern pro lesender Person den Zeitpunkt der zuletzt gelesenen Nachricht.
- In der Nachrichtenübersicht wird die letzte eigene Nachricht als „Gesendet“ oder „Gelesen“ markiert.
- Der Nachrichtenpunkt in der Navigation zeigt die Summe ungelesener Nachrichten aus Match-Unterhaltungen und Support-Chats. Der Zähler wird alle 15 Sekunden aktualisiert, solange das Dashboard sichtbar ist.
- Das Öffnen eines Chats markiert die bis dahin geladenen eingehenden Nachrichten als gelesen; neue Nachrichten werden während eines geöffneten Chats ebenfalls als gelesen erfasst.
- Voraussetzung: Migration `supabase/migrations/20261016150000_message_read_receipts.sql` muss in Supabase ausgeführt werden. Bis dahin bleibt die bestehende Nachrichtenfunktion nutzbar; Lesestatus und Zähler erscheinen erst nach der Migration.

- Nachrichtenübersicht: Chats mit ungelesenen Nachrichten werden farblich hervorgehoben, erhalten einen Zähler und erscheinen vor gelesenen Chats. Beim Zurückkehren in den Tab wird der Status sofort aktualisiert; zusätzlich läuft die Hintergrundprüfung im geöffneten Dashboard weiter.
