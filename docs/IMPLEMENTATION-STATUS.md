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
| Übersicht | Startet nach Profilabschluss mit Begrüßung, offenen eingegangenen Likes und beidseitigen Matches ohne erste Nachricht. Abschnitte ohne Inhalte bleiben verborgen. App-Neuigkeiten und Partnerangebote werden rollenbezogen angezeigt. Zusätzlich ist derzeit eine klar markierte, statische Testanzeige von Shira Rachel Photography für alle Rollen eingeblendet. Angebotskarten öffnen eine interne Detailseite mit Website-Link. Der Kontobereich bietet jetzt einen eigenen Einstieg in Partnerangebote. |
| Eigene Profilansicht | Vollständiges eigenes Profil mit Galerie unter „Profil“. Hochzeitspaare sehen Key Facts für Datum, Ort und Bildnutzungspräferenz. |
| Hochzeitspaarfotos | Je ein eigenes Foto pro Person erforderlich, gemeinsames Foto optional; 2-MB-Grenze, Vorname(n) links unten als nicht-destruktive Ansichtseinblendung. |
| Matches und Nachrichten | Chats aktualisieren offene Gespräche automatisch alle fünf Sekunden und beim Zurückkehren in den Browser-Tab. Nachrichten können mit einem Herz markiert werden; jede Person kann ihr eigenes Herz wieder entfernen. Dazu ist die Migration `20261016090000_profile_message_reactions.sql` erforderlich. Likes lassen sich auf der Übersicht beantworten; gegenseitige Likes werden als Matches angezeigt. Neue Matches können direkt angeschrieben werden; bestehende Nachrichten erscheinen in der Nachrichtenansicht mit Profilfoto des Gegenübers und der letzten Nachricht; ein Klick auf die gesamte Unterhaltungskarte öffnet den Chat. Das Menü Matches hat oben Tabs für Matches und erhaltene offene Likes, jeweils mit Anzahl. Hinweistexte und Leerzustände sprechen Hochzeitspaare mit „ihr/euch“ und Fotografen mit „du/dir“ an. Likes können dort beantwortet werden. Ein Klick auf die gesamte Karte öffnet das vollständige Profil im Dashboard. Die Like-Profilansicht nutzt denselben Profil-Renderer und dieselbe Galerie wie das eigene Profil; Inhalte verwenden die Ich-Perspektive des angezeigten Profils. Like-/Dislike- und Chat-Aktionen bleiben separat. Die Matches-Navigation bleibt aktiv, Zurück führt zur Matchliste; Chat bleibt separat. |
| E-Mail-Einstellungen | Ereignisbezogene Präferenzen für Likes, Matches, Nachrichten, App-Neuigkeiten und Partnerangebote werden in Supabase gespeichert. Ein Versanddienst, der diese Einstellungen auswertet, ist nicht angeschlossen. |
| Bearbeitung | Profilentwürfe werden in der Bearbeitung automatisch gespeichert. Navigation und Konto-/Einstellungsdialoge sind im Dashboard vorhanden. |
| Entdecken | Lädt vollständige Profile der jeweils anderen Rolle. Gesendete Likes werden in `profile_likes` gespeichert; ein gegenseitiges Like erzeugt ein Match. „Überspringen“ wird privat in `profile_skips` gespeichert und blendet das Profil künftig aus. Das bloße Ansehen oder ein offenes eingehendes Like entfernt ein Profil nicht aus dem Feed; die aktive Profilkarte bleibt innerhalb der Sitzung erhalten. „Nein danke“ bei einem erhaltenen Like speichert ein dauerhaftes Überspringen. Das Matches-Navigationsbadge zählt offene eingehende Likes und aktualisiert sich alle 15 Sekunden sowie nach Rückkehr in den Tab. Der Live-End-to-End-Test steht noch aus. |
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

## Ganze Chats aus der eigenen Nachrichtenübersicht entfernen (16. Oktober 2026)

- Am Handy wird ein Chat durch langes Drücken auf die Karte zum Löschen ausgewählt; ein Bestätigungsdialog erklärt die Wirkung. Auf dem Desktop gibt es ein Kartenmenü und das Kontextmenü.
- Das Entfernen gilt nur für die eigene Übersicht. Der Verlauf der anderen Person bleibt erhalten. Neue Nachrichten nach dem Löschzeitpunkt lassen den Chat wieder erscheinen.
- Match-Chats und WedConnect-Supportchats werden unterstützt.
- Voraussetzung: Migration `supabase/migrations/20261016160000_hide_conversations_for_user.sql` muss in Supabase ausgeführt werden.


## Chat blockieren (16. Oktober 2026)

- Persönliche Chats haben im Kopf eine Drei-Punkte-Menüführung mit „Person blockieren“ und nach eigener Sperre „Blockierung aufheben“.
- Ein Bestätigungsfenster erklärt, dass beide keine Nachrichten mehr senden können und der bisherige Verlauf sichtbar bleibt.
- Blockierte Profile verschwinden bei beiden Seiten aus Entdecken, eingehenden Likes und Matches. Bestehende Chats bleiben sichtbar und sind mit „Blockiert“ markiert, damit Sperren aufgehoben werden können.
- Die Chat-Eingabe ist bei einer Sperre deaktiviert; Supabase weist direkte Nachrichten und Likes zwischen blockierten Profilen zusätzlich serverseitig ab. Support-Chats sind nicht betroffen.
- Voraussetzung: Migration `supabase/migrations/20261016170000_profile_blocks.sql` im Supabase SQL Editor ausführen. Live-Ausführung ist nicht verifiziert.


## Testanzeige auf der Übersicht (16. Oktober 2026)

- Eine statische Testanzeige von Shira Rachel Photography erscheint bei allen abgeschlossenen Profilen im Abschnitt „Angebote für dich“, unabhängig von der Rolle.
- Sie ist als „TESTANZEIGE“ gekennzeichnet und verlinkt in einem neuen Tab auf https://shira-rachel.com/.
- Die Karte ist ein vorübergehender UI-Test und benötigt keine Supabase-Migration. Echte Partnerangebote werden weiterhin zusätzlich aus der Datenbank geladen.



## Angebotsdetails auf der Übersicht (16. Oktober 2026)

- Angebotskarten im Abschnitt „Angebote für dich“ lassen sich anklicken und per Tastatur öffnen.
- Eine eigene Dashboard-Detailansicht zeigt Partnername, Titel, Beschreibung und optionale Bedingungen. Ein externer Website-Link wird erst dort angeboten.
- Die Rückkehr führt direkt zur Übersicht. Der kleine, dezente Zurück-Button steht rechts neben der Überschrift „Angebot“. Die Funktion gilt für die Testanzeige und veröffentlichte Partnerangebote; Neuigkeiten behalten ihren direkten Link.



## Partnerangebote im Kontobereich (16. Oktober 2026)

- Im Konto-Dialog oben rechts führt der neue Eintrag „Partnerangebote“ zu einer eigenen Übersicht aller aktuell geladenen Angebote für die jeweilige Rolle.
- Die Angebotsübersicht zeigt aktive veröffentlichte Angebote sowie die temporäre Testanzeige. Jede Karte öffnet die gemeinsame Detailansicht; dort führt der Link aus dem Feld `destination_url` weiter (Affiliate-Link, sofern dort hinterlegt).
- Das Zurückverhalten passt sich dem Einstieg an: Von Partnerangebotsdetails geht es zurück zur Angebotsübersicht, von der Angebotsübersicht zurück zum geöffneten Konto-Menü. Zwischen der Überschrift und dem Einleitungstext sowie zwischen Einleitung und erstem Angebot ist zusätzlicher Abstand ergänzt.



## Konto-Menü-Icons und Profilbildrahmen (16. Oktober 2026)

- Der runde Avatar oben rechts hat einen helleren, dezenten Rahmen, damit er sich auch auf dem dunklen Hintergrund klar abzeichnet.
- Jeder Eintrag im Konto-Menü besitzt jetzt ein einheitliches Linien-Icon passend zur Aktion: Profilfoto, Profil bearbeiten, Rolle wechseln, Einstellungen, Partnerangebote, Kontakt/Feedback und Abmelden.


## Konto dauerhaft löschen (16. Oktober 2026)

- In den Einstellungen ist ein eigener Bereich „Konto löschen“ ergänzt. Eine zweite Bestätigungsansicht beschreibt die Folgen; die Schaltfläche bleibt gesperrt, bis exakt `KONTO LÖSCHEN` eingegeben wurde.
- Die Supabase Edge Function authentifiziert den Aufrufer, löscht Dateien aus dem privaten Profilfoto-Bucket und entfernt anschließend den Auth-Nutzer. Verknüpfte Profil-, Like-, Match-, Chat-, Support- und Einstellungsdaten werden über bestehende `ON DELETE CASCADE`-Beziehungen entfernt. Eigene Nachrichten verschwinden auch für die Chatpartner.
- Voraussetzung vor Live-Nutzung: `supabase functions deploy delete-account` im richtigen Supabase-Projekt ausführen. Die erforderlichen Supabase-Standard-Secrets müssen verfügbar sein. Die Ausführung in Produktion wurde noch nicht verifiziert.


## Layout des Konto-Löschdialogs (16. Oktober 2026)

- Einstellungen und der Bestätigungsdialog zur Kontolöschung bleiben bei kleinen und niedrigen Viewports innerhalb der verfügbaren Bildschirmhöhe; ihre Inhalte können bei Bedarf im Dialog gescrollt werden.
- Der Löschbereich ist durch eine deutlich sichtbare, aber semantisch passende Alert-Farbe hervorgehoben.


## Discover-Fotodarstellung (16. Oktober 2026)

- Discover-Profilfotos füllen den Bildrahmen jetzt wie die Galerie im vollständigen Profil; `object-fit: cover` verhindert schwarze Balken. Der Namenszug liegt links unten direkt auf dem Foto über einem leichten Verlauf, der Fotozähler rechts unten auf einer dezenten halbtransparenten Fläche.
- Der Cover-Zuschnitt kann je nach Fotoformat Bildränder abschneiden; die Darstellung folgt dadurch der Vollprofil-Galerie.


## Discover-Bilder auf Mobilgeräten (16. Oktober 2026)

- Mobile Ansicht: Pfeiltasten auf Profilbildern ausgeblendet; stattdessen erscheinen oben segmentierte Fortschrittsbalken, die beim Wischen das aktuelle Foto anzeigen und direkt anwählbar sind.
- Fotozähler unten rechts aktualisiert sich beim Wischen ebenfalls.


- Korrektur: Die mobile Ausblendung der Discover-Pfeile steht nun nach den allgemeinen Pfeilregeln und kann durch diese nicht mehr überschrieben werden.


## Startübersicht: Scroll-Hinweis und schließbare Inhalte (16. Oktober 2026)

- Ein dezenter Hinweis „Weiter unten“ erscheint unten rechts, solange die Übersicht am Seitenanfang steht und weitere Inhalte vorhanden sind. Er verschwindet beim Scrollen, am Seitenende sowie außerhalb der Übersicht.
- Inhalte erhalten keinen einheitlichen Schließen-Button: offene Likes bleiben bis zur Reaktion sichtbar; neue Matches ohne Nachricht bis zum Chatstart. Nicht dringende App-Neuigkeiten können als gelesen markiert oder ausgeblendet werden. Anzeigen und Partnerangebote bleiben ohne Schließen-X sichtbar und werden über Laufzeit, Zielgruppe und Werbeeinstellungen gesteuert.


## Testneuigkeit für alle Profile (16. Oktober 2026)

- Eine statische Beispielneuigkeit „Neuigkeiten bei WedConnect“ erscheint im Neuigkeiten-Abschnitt für alle Profilrollen.
- Sie ist deutlich als „TESTNEUIGKEIT“ gekennzeichnet und ergänzt veröffentlichte Datenbank-Neuigkeiten. Es ist keine Supabase-Migration erforderlich.
- Testinhalt zur Prüfung der Darstellung; vor dem Livegang entfernen oder durch eine echte Ankündigung ersetzen.


## App-Neuigkeiten ausblenden (16. Oktober 2026)

- Jede Neuigkeit in der Startübersicht hat ein eigenes Schließen-X. Beim Schließen wird die Karte sofort entfernt; der folgende Inhalt rückt in der Liste automatisch nach oben.
- Die ausgeblendete Neuigkeit bleibt nur für das jeweilige angemeldete Profil auf demselben Browser verborgen (localStorage). Es ist keine Supabase-Migration erforderlich. Auf einem anderen Gerät kann sie erneut erscheinen.
- Anzeigen und Partnerangebote behalten ihr bisheriges Verhalten und sind nicht über dieses X schließbar.


- Zusätzlich erscheinen zwei statische Testneuigkeiten („Mach dein Profil noch persönlicher“ und „Neue Begegnungen warten auf dich“) für alle Profilrollen. Sie tragen ebenfalls die Kennzeichnung „TESTNEUIGKEIT“ und können einzeln geschlossen werden.


## Werbekennzeichnung für Angebote (16. Oktober 2026)

- Alle Karten im Abschnitt „Angebote für dich“ zeigen rechts oben ein dezentes Label „Werbung“, auf Höhe der oberen Kartenkante. Das Label ist auch bei der Testanzeige sichtbar.
- Neuigkeiten bleiben davon unberührt. Es ist keine Supabase-Migration erforderlich.


## Foto in der Shira-Testanzeige (16. Oktober 2026)

- Die Testanzeige verwendet ein Hochzeitsfoto von der Website shira-rachel.com. Das Motiv wird als linkes, abgerundetes Bildfeld mit `object-fit: cover` dargestellt; auf kleinen Bildschirmen wird es kompakter und der Website-Button rückt darunter.
- Kein Datenbank- oder Storage-Upload erforderlich. Das Bild wird von der Website geladen.


## Werbekennzeichnung in Angebotsdetails (16. Oktober 2026)

- Auch die Detailseite eines Partnerangebots zeigt oben rechts die Kennzeichnung „Werbung“. Das gilt für die Shira-Testanzeige und alle Partnerangebote.
- Die Kennzeichnung bleibt auf Mobilgeräten gut sichtbar und vom Inhalt getrennt.


## News-Sandbox für Vorschau vor Livegang (16. Oktober 2026)

- Der dauerhafte Git-Branch `news-sandbox` dient als Vorschauumgebung für Entwürfe und Änderungen an App-Neuigkeiten. Änderungen auf diesem Branch lösen über die GitHub-Vercel-Verbindung einen Preview-Deployment aus; sie ändern `main) und die öffentliche Version nicht.
- Neuigkeiten dort visuell prüfen und erst nach Freigabe per Pull Request nach `main` übernehmen.
- Einschränkung: Die Preview verwendet weiterhin die verbundene Supabase-Konfiguration. Sie eignet sich für statische Neuigkeiten und Layouttests; keine Profil-, Like- oder Chataktionen in der Sandbox testen. Ein vollständig isolierter Backend-Test erfordert ein separates Supabase-Testprojekt.


## Dezente Fotobalken in allen Profilansichten (16. Oktober 2026)

- Galerie-Fortschrittsbalken in der eigenen Profilansicht, in aufgerufenen Like-/Match-Profilen und in Entdecken verwenden nun dieselbe dezente Darstellung: dünne 2-Pixel-Segmente ohne dunkle, abgerundete Trägerfläche.
- Die Anpassung liegt zunächst auf `news-sandbox` und wird vor dem Livegang auf Mobilgeräten sowie Desktop geprüft. Keine Supabase-Migration.


## Korrektur: kompakte Fotobalken (16. Oktober 2026)

- Die erste Vereinheitlichung zog die Balken über fast die gesamte Bildbreite. Korrigiert: Die Anzeige ist jetzt kurz, zentriert und pro Foto auf 6 Pixel Breite begrenzt, angelehnt an die gewünschte Like-Profilansicht.
- Die kompakte Darstellung gilt für eigene Profile, aufgerufene Like-/Match-Profile, Entdecken und die Galerie im Vollbild.
