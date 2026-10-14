# WedConnect · Project Bible

**Version:** 1.3  
**Stand:** 14. Oktober 2026  
**Status:** Produktreferenz mit abgeglichenem Umsetzungsstand  
**Code-Baseline:** `5ecfad72804a597b01cbca9e9133606175f7d38b`  
**Geltungsbereich:** Produktziel, Nutzerrollen, Abläufe, Profilinhalte und Produktgrenzen

Diese Fassung hält die bestätigten Produktentscheidungen und den belegbaren Stand am Baseline-Commit auseinander. Sie ersetzt die Project Bible v1.2, wo deren frühere Annahmen abweichen. Sie ist keine Freigabe für Änderungen an der eingefrorenen Website oder App.

## 1. Produktidee

WedConnect bringt Hochzeitspaare und Fotografen für mögliche Zusammenarbeiten rund um echte Hochzeiten zusammen. Beide Seiten erstellen ein Profil, entdecken passende Profile und entscheiden selbst, ob sie Interesse zeigen.

Ein gegenseitiges Interesse ist der Beginn eines Gesprächs. Es ist keine Buchungszusage. Umfang, Honorar, Lieferung und Bildnutzung werden vor einer Zusammenarbeit direkt vereinbart.

**TFP bedeutet nicht automatisch kostenlos.** Fotografen können als gewünschte Vergütung entweder **Unentgeltlich** oder **Fixbetrag** wählen.

## 2. Geltungs- und Statusbegriffe

In diesem Dokument bedeutet:

- **Produktentscheidung:** von Ali festgelegt; maßgeblich für künftige Änderungen.
- **Im Code:** im Repository zum Baseline-Commit vorhanden; das allein belegt keinen erfolgreichen Live-Test.
- **Live geprüft:** am 14. Oktober 2026 direkt im Browser gesehen.
- **Noch zu prüfen:** es fehlt ein Test mit angemeldetem Konto, echten Daten oder anderem Viewport.
- **Geplant / nicht umgesetzt:** gehört nicht zum bestätigten Live-Funktionsumfang.

Für die konkrete Gestaltung und Texte sind die [Referenzmodule](REFERENCE-MODULES-v1.0.md), die [öffentliche Design Bible](DESIGN-BIBLE.md) und künftig eine App Design Bible zuständig. Technische Tabellen, Policies und Migrationen gehören in den [Supabase-Katalog](../supabase/README.md) und das technische Datenwörterbuch.

## 3. Registrierung, Anmeldung und erster Einstieg

### Produktentscheidungen

- Anmeldung und Registrierung sind für alle gleich und fragen **keine Rolle** ab.
- Unterstützte Zugänge in der aktuellen Version: E-Mail/Passwort und Google.
- Apple-Anmeldung und weitere Anbieter sind nicht Teil des bestätigten Umfangs.
- Nach erfolgreicher Anmeldung führt WedConnect in den Dashboard-Bereich.
- Beim ersten Einstieg beginnt dort die Profilerstellung. Die erste Profilfrage ist **Hochzeitspaar** oder **Fotograf**.
- Es gibt deshalb zwei Zustände im Dashboard: den Profilstart für neue oder unvollständige Profile und den freigeschalteten App-Bereich nach dem Profilabschluss.
- Entdecken und weitere gesperrte Bereiche werden erst nach dem Profilabschluss freigeschaltet.

### Stand

- Der rollenneutrale Auth-Dialog wurde am 14. Oktober live geöffnet und geprüft.
- Der direkte Aufruf des Dashboards ohne Sitzung wurde geprüft: Nach dem Ladezustand führt er zur Anmeldung zurück.
- E-Mail- und Google-Anmeldung wurden vom Projektinhaber als funktionierend bestätigt. Eine erneute End-to-End-Prüfung mit Testkonten ist offen.
- Die Startseite enthält noch den Satz, Registrierung und Matching seien nicht produktiv verfügbar. Das widerspricht dem funktionierenden Anmeldeweg und wird als überholter öffentlicher Text dokumentiert. Die Startseite bleibt bis zu einem ausdrücklichen Auftrag unverändert.

## 4. Rollen und Profile

Die Rollen heißen in der Oberfläche **Hochzeitspaar** und **Fotograf**. In UI-Texten wird die gewünschte Schreibweise „Fotograf“ verwendet.

Jedes Profil braucht die Vornamen der beteiligten Personen, weil diese im Produkt persönlich angesprochen werden. Pflichtfelder, Uploads und Profilbereiche unterscheiden sich nach der gewählten Rolle.

### 4.1 Profil für Hochzeitspaare

Das Profil enthält:

- Vornamen beider heiratenden Personen
- Hochzeitsdatum
- Ort oder Location
- ungefähre Gästezahl
- geplanten Ablauf
- gewünschte Begleitung
- Bildstil und konkrete Bildwünsche
- eine grundlegende Präferenz zur späteren Nutzung der Hochzeitsfotos durch den Fotografen
- eine optionale persönliche Vorstellung für das öffentliche Profil

Für die Fotos müssen beide Personen erkennbar vertreten sein: entweder auf einem gemeinsamen Foto oder mit je einem eigenen Foto. Die konkrete Nutzung der bei der Hochzeit entstehenden Bilder wird später separat und ausdrücklich zwischen den Beteiligten vereinbart.

### 4.2 Profil für Fotografen

Das Profil enthält:

- Vorname
- Region und Einsatzgebiet als Mehrfachauswahl: ganz Österreich oder einzelne Bundesländer
- Erfahrung in Jahren und/oder fotografierte Hochzeiten; mindestens eine Erfahrungsangabe
- Bildstil als Mehrfachauswahl, einschließlich **Boho**
- gewünschte Begleitung als Mehrfachauswahl: Pre-Wedding-Shooting, Getting Ready, Trauung, Paarfotos, Empfang/Agape, Essen und Reden, Feier/Party, Halbtagesreportage und Ganztagesreportage
- gewünschte Vergütung: **Unentgeltlich** oder **Fixbetrag**; beim Fixbetrag gehört ein Eurobetrag dazu
- optionale Instagram-Adresse und Website
- optionale persönliche Vorstellung für das öffentliche Profil
- Galerie mit Portfoliofotos

Der Begleitungsumfang beschreibt, welche Teile einer Hochzeit der Fotograf für sein Portfolio noch fotografieren möchte. Eine Auswahl für „individuelle Kombinationen“ ist nicht vorgesehen. **Verfügbarkeit** ist kein Fotografen-Profilfeld; konkrete Termine gehören zu späteren Hochzeits- und Matchingdaten.

Instagram und Website sind optionale Profilangaben. Die Eingabe kann auf eine aufrufbare Adresse normalisiert werden. Das ist keine Bestätigung, dass die Person den jeweiligen Account besitzt.

Eine eigene zusätzliche Vergütung für Nutzungsrechte wird nicht abgefragt. Konkrete Nutzungsrechte werden vor einer Zusammenarbeit separat vereinbart.

## 5. Fotos, Galerie und Profilbild

### Hochzeitspaar

- Das Profil benötigt ein gemeinsames Foto beider Personen oder mindestens je ein Foto pro Person.
- Couple-Fotos akzeptieren JPG/JPEG, PNG und WebP.
- Die Oberfläche setzt für diese Fotos eine Dateigrenze von 10 MB pro Bild.
- Der genaue Bildausschnitt soll vor dem Profilabschluss erkennbar sein.

### Fotograf

- Eine Galerie kann bis zu 20 Portfoliofotos enthalten.
- Mindestens 3 Portfoliofotos sind Voraussetzung für den Profilabschluss.
- Portfoliofotos akzeptieren JPG/JPEG, PNG und WebP; die Oberfläche begrenzt jedes Bild auf 2 MB.
- Alle Portfoliofotos gehören in dieselbe öffentliche Galerie.
- Fotografen können innerhalb dieser Galerie 3 bis 5 Bilder als **Highlights** auswählen. Diese Auswahl ist für die Profilkarte in „Entdecken“ vorgesehen; hervorgehobene Fotos bleiben Teil der Galerie.
- Für Highlights ist in der Profilkarte das Hochformat 4:5 vorgesehen. Der Bildausschnitt soll beim Zuschneiden so erkennbar sein, wie er später angezeigt wird.

### Eigenes Profilfoto

Das optionale persönliche Profilfoto gehört in die Account-/Einstellungen und nicht in die Portfolio-Galerie. Es wird als rundes Bild für Account-Menü und gegebenenfalls Chat verwendet. JPG/JPEG, PNG und WebP, maximal 2 MB; der Nutzer soll den Ausschnitt im Kreis ausrichten und das Foto wieder löschen können.

### Implementierungsabweichung bei Highlights

Die Produktentscheidung lautet **3 bis 5 Highlights** bei höchstens 20 Galerie-Fotos. Die SQL-Migration am Baseline-Commit verlangt mindestens 3 Highlights, lässt technisch aber bis zu 10 zu. Außerdem enthält die Dashboard-JavaScriptdatei am Baseline-Commit keine erkennbare Oberfläche zum Setzen des Feldes `is_highlight`. Damit ist die Highlight-Auswahl nicht als vollständig implementiert oder getestet bestätigt.

Das ist ein dokumentierter Abgleichspunkt für einen ausdrücklich beauftragten technischen Fix. Bis dahin darf die Produktregel nicht mit der Datenbankgrenze gleichgesetzt werden.

## 6. Öffentliche Profilansicht

### Produktentscheidungen

- Das öffentliche Profil ist eine vollständige, erkundbare Profilansicht. Es gibt keine separate Kurzvorschau mit zusätzlicher Profil-Detailseite.
- Die Bilder und die Galerie stehen im Mittelpunkt.
- Name und Rolle, relevante Profilinformationen, Vergütung und Erfahrung sollen klar lesbar sein.
- Instagram und Website werden nur angezeigt, wenn sie angegeben wurden.
- Die Galerie unterstützt mehrere Bilder und die Betrachtung im Vollbild.
- Nutzer können Interesse zeigen und erkennen, wenn Interesse erwidert wurde.

Die genaue Anordnung, responsive Darstellung, Galerie- und Vollbildverhalten gehören in die App Design Bible und Referenzaufnahmen.

### Umsetzungsstand

- Die öffentliche Profilvorschau und Galeriebedienung sind im Dashboard-Code vorhanden.
- Eine Datenbankmigration für Like-Aktionen ist vorhanden.
- Eine gegenseitige Like-Beziehung, die produktive Match-Entstehung und Chat/Nachrichten sind am Baseline-Commit nicht als abgeschlossene End-to-End-Funktion bestätigt.
- Die sichtbare Navigation zu einem Bereich bedeutet nicht, dass dieser Bereich bereits produktiv ist.

## 7. Rollenwechsel und Kontobereich

Der Kontobereich bündelt persönliche Einstellungen und Profilverwaltung. Der Rollenwechsel soll dort stattfinden, nicht als wiederholter Button auf jeder Profilseite.

**Produktentscheidung:** Ein Rollenwechsel muss auch nach abgeschlossenem Profil möglich sein.

Im Baseline-Code sind ein Rollenwechsel-Einstieg im Account-Bereich und Datenbankfunktionen für Rollenänderungen vorhanden. Noch offen und vor einer Abnahme zu klären ist, wie die Daten des bisherigen Rollenprofils bei einem Wechsel erhalten bleiben oder behandelt werden. Diese Dokumentation behauptet weder eine Löschung noch eine sichere Übernahme.

## 8. Zusammenarbeit, Honorar und Bildrechte

- Ein Match eröffnet die Möglichkeit, die Zusammenarbeit direkt zu besprechen.
- Ein Match ist keine Buchungszusage.
- TFP ist nicht gleichbedeutend mit unentgeltlicher Arbeit.
- Umfang, Honorar, Lieferung und Nutzungsrechte müssen vor der Zusammenarbeit ausdrücklich vereinbart werden.
- Das Paar gibt im Profil nur eine grundlegende Präferenz zur späteren Bildnutzung an. Diese Angabe ist keine verbindliche Rechtefreigabe.
- Fotografen können kein zusätzliches Honorar für Nutzungsrechte in einem separaten Profilfeld ansetzen; dieses frühere Zusatzfeld ist aus dem Produktumfang entfernt.
- Aussagen zu Verträgen, Speicherfristen oder gesetzlichen Ansprüchen sind fachlich zu prüfen. Diese Bible ersetzt keine Rechtsprüfung.

## 9. Öffentliche Website und eingefrorene Bereiche

Die öffentlichen Seiten sind Startseite, „Für Hochzeitspaare“ und „Für Fotografen“.

- **„Für Fotografen“ ist eingefroren** und dient als visueller Master der öffentlichen Website.
- Startseite und Hochzeitspaare-Seite wurden als später redaktionell zu überarbeiten festgehalten. Bis zu einem ausdrücklichen Auftrag bleiben auch sie Teil der eingefrorenen Baseline.
- Die [Design Bible](DESIGN-BIBLE.md) gilt für die öffentliche Website. Das Dashboard und die eingeloggte App haben eine eigene Gestaltungsreferenz.
- Die Fotografen-Seite enthält einen neutralen Auth-Dialog. Ihre Seite, Texte und Illustrationen dürfen nur auf ausdrücklichen Auftrag geändert werden.

## 10. Nicht bestätigter Umfang / spätere Planung

Folgendes ist nicht als fertige Produktfunktion zu beschreiben:

- produktives Entdecken mit passenden echten Profilen und vollständigen Filtern
- beidseitiges Matching als durchgängiger Ablauf
- Chat oder Nachrichten
- Benachrichtigungen per In-App, E-Mail oder Push
- Zahlungen, Abos und Pro-Funktionen
- Admin- und Moderationsbereich
- Veröffentlichung oder Freigabe von Profilen durch Admins
- automatische Erstellung von FAQ aus Kundenfeedback

Eine spätere FAQ-Automation soll allenfalls Entwürfe vorbereiten, die eine verantwortliche Person prüft. Das ist eine Planungsnotiz, keine beschlossene oder implementierte Funktion.

## 11. Statusübersicht am 14. Oktober 2026

| Bereich | Stand |
|---|---|
| Öffentliche Seite „Für Fotografen“ | Live im Browser geprüft; eingefroren |
| Öffentlicher Auth-Dialog | Live geöffnet; E-Mail/Passwort und Google sichtbar, keine Rollenfrage |
| E-Mail- und Google-Anmeldung | Vom Projektinhaber als funktionierend bestätigt; vollständige Wiederholungsprüfung offen |
| Dashboard ohne Sitzung | Live geprüft; leitet nach der Ladeanimation zur Anmeldung |
| Rollenwahl und Profilassistent | Im Code und in Datenbankmigrationen vorhanden; Speichern/Abschluss mit Testkonten offen |
| Hochzeitspaarfelder und Fotoanforderung | Im Code/Migrationen vorhanden; End-to-End-Prüfung offen |
| Fotografenfelder und Galerielimits | Im Code/Migrationen vorhanden; End-to-End-Prüfung offen |
| Highlight-Auswahl | Produktentscheidung 3–5; Code/SQL am Baseline-Commit widersprechen einander |
| Account-Profilfoto | Code und Datenbankmigration vorhanden; Upload mit unterschiedlichen Dateien noch zu verifizieren |
| Like-Aktionen | Datenbankmigration vorhanden; vollständiger Match-Ablauf offen |
| Matching, Chat, Payments und Admin | Geplant oder nicht umgesetzt |

Eine Live-Prüfung der öffentlichen Seite ist keine vollständige Geräte- oder Funktionsabnahme der eingeloggten App.

## 12. Änderungen und Versionen

Der geschützte Produktstand ist der Commit `5ecfad72804a597b01cbca9e9133606175f7d38b`. Dokumentationsarbeit erfolgt getrennt auf `docs/frozen-baseline-2026-10-14`.

Jede spätere Produktänderung braucht einen ausdrücklichen Auftrag. Sie wird isoliert umgesetzt, am betroffenen Ablauf und Viewport geprüft und mit Code-Commit, Teststatus und aktualisierter Spezifikation dokumentiert. Für die bisherigen Freeze-Regeln siehe [CHANGE-CONTROL.md](CHANGE-CONTROL.md).

## 13. Abgelöste Aussagen aus v1.2

Die nachfolgenden älteren Angaben gelten nicht mehr als aktuelle Produktentscheidung:

- „Fotografenverfügbarkeit“ als Pflichtfeld
- mindestens 10 Portfoliofotos
- 10 MB als pauschales Fotolimit für alle Arten von Bildern
- eine nicht mehr änderbare Rollenzuordnung
- bereits produktiv vorhandenes Matching und Chat
- fest eingeplante Pro-Funktionen und Zahlungen

Die ältere Datei `PROJECT-BIBLE-v1.2.md` bleibt zur Historie im Repository; diese Version ist für den aktuellen Produktumfang maßgeblich.
