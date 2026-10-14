# WedConnect · Referenzmodule der eingefrorenen Oberfläche

**Dokumentversion:** 1.0  
**Erfasst am:** 14. Oktober 2026  
**Code-Referenz:** Baseline-Commit `5ecfad72804a597b01cbca9e9133606175f7d38b`  
**Status:** Codeaufnahme; visuelle Referenzaufnahmen und vollständige End-to-End-Prüfung stehen noch aus  
**Zweck:** Diese fünf fortgeschrittenen Bereiche sind die verbindlichen Referenzen für spätere Arbeit. Dieses Dokument ändert oder erweitert das Produkt nicht.

Die aktuelle Website und App bleiben unverändert. Die Fotografen-Seite ist ausdrücklich eingefroren. Screenshots in mehreren Viewports ergänzen diesen Katalog später, ohne die Referenzoberfläche umzubauen.

## Gemeinsame Arbeitsregel

Bei einer später ausdrücklich beauftragten Änderung dienen die bestehenden Ansichten als Ausgangspunkt. Gestaltung, Abstände, Texte und Verhalten werden nur im beauftragten Umfang geändert. Wo Code und ältere Produktdokumente voneinander abweichen, beschreibt diese Aufnahme den Code am Baseline-Commit; offene Testfragen werden ausdrücklich markiert.

**Statusbegriffe**

- **Im Baseline-Code:** durch den Quellcode am oben genannten Commit belegt.
- **Produktentscheidung:** vom Projektinhaber festgelegt und für künftige Arbeit maßgeblich.
- **Noch zu prüfen:** tatsächlicher Ablauf oder Darstellung braucht einen Testbeleg.
- **Geplant/nicht umgesetzt:** darf nicht als live verfügbar beschrieben werden.

## 1. Öffentliche Seite „Für Fotografen“

**Status:** eingefrorene Referenzseite. Nur nach ausdrücklichem Auftrag ändern.  
**Datei:** `fotografen.html`  
**Designreferenz:** [Öffentliche Design Bible](DESIGN-BIBLE.md)

Die Seite erklärt den Nutzen für Fotografen mit einer eigenständigen redaktionellen Erzählung: Ausgangslage und Portfolio-Lücke, Weg zum Match, Honorar und Nutzungsrechte, FAQ und Einstieg zur Registrierung. Sie ist der festgelegte visuelle Master der öffentlichen Website. Inhalt und Illustrationen bleiben seitenspezifisch.

Die Seite enthält einen rollenneutralen Registrierungsdialog mit E-Mail/Passwort und Google. Die Texte im Dialog sagen, dass die Rolle erst später beim Profil festgelegt wird. Der CTA startet die Kontoerstellung, keine Fotografen-Rollenzuweisung.

**Für spätere Dokumentation sichern:** Desktop- und Mobilansicht der Seite, Navigation, FAQ auf/zu, Registrierungsdialog in Registrierungs- und Anmeldemodus sowie Dialogfehler. Diese Aufnahmen sind noch nicht Teil dieses Commits.

## 2. Anmeldung und Registrierung

**Dateien:** `assets/js/wedconnect-auth.js`, Auth-Dialog in den öffentlichen HTML-Seiten, `assets/js/supabase-config.js`  
**Status:** gemeinsamer, rollenneutraler Codepfad; echte Anmeldeabläufe nochmals systematisch prüfen.

### Verbindlicher Ablauf

1. Alle Einstiege öffnen denselben Anmelde- oder Registrierungsdialog. Beim Login und Sign-up wird keine Rolle abgefragt.
2. Unterstützt sind E-Mail/Passwort, Google, Wechsel zwischen Registrierung und Anmeldung sowie Passwort-Wiederherstellung.
3. Nach verfügbarer Sitzung führt der App-Einstieg nach `dashboard.html`. Beim Google-OAuth führt die Rückkehr zunächst über die Startseite; die Rückkehr wird erkannt und bei vorhandener Sitzung zum Dashboard fortgesetzt.
4. Die Rollenwahl gehört zum anschließenden Profilstart im Dashboard.

**Codebeleg:** `wedconnect-auth.js` verwendet eine gemeinsame Supabase-Client-Instanz, setzt eine Google-Rückkehrmarkierung, behandelt die Rückkehr über `?auth=google` und leitet bei erkannter Sitzung zum Dashboard. Registrierung und E-Mail-Bestätigung besitzen einen eigenen Rückkehrzustand.

**Noch zu prüfen:** neuer Google-Account, vorhandener Google-Account, E-Mail-Registrierung inklusive etwaiger Bestätigung, bestehender Login, Passwort-Wiederherstellung, Abmeldung und erneuter Einstieg. Pro Durchlauf sind Ziel-URL und Zahl der Anmeldeschritte festzuhalten. Die Codeaufnahme allein ersetzt keinen echten Test mit Supabase.

## 3. Dashboard

**Dateien:** `dashboard.html`, `assets/js/wedconnect-dashboard.js`  
**Designreferenz:** eigenständige App-Oberfläche; die öffentliche Design Bible gilt laut eigener Geltungsbereichsdefinition nicht für das eingeloggte Dashboard.  
**Status:** Grundgerüst und rollenabhängiger Profilstart sind im Baseline-Code vorhanden; produktive Matchingbereiche sind nicht bestätigt.

### Einstieg und Freischaltung

Das Dashboard prüft zuerst die Supabase-Sitzung und das Konto-/Profilstadium:

- Ohne gültige Sitzung: zurück zum Anmeldedialog.
- Ohne Rolle: Profil-Assistent beginnt bei der neutralen Rollenwahl.
- Rolle vorhanden, Profil unvollständig: Assistent öffnet das angefangene Profil.
- Profil vollständig: Profil und Fotos werden geladen und das freigeschaltete Dashboard wird eingerichtet.

Der Ladezustand wird mindestens 1,8 Sekunden gezeigt. Bei Supabase- oder Profilfehlern erscheint ein eigener Fehlerzustand.

### Informationsarchitektur

Die App hat eine linke Hauptnavigation, auf schmalen Bildschirmen eine angepasste Navigation und einen Account-Bereich. Account-/Einstellungsaktionen sind vom Hauptarbeitsbereich getrennt. Die verfügbare Navigation enthält auch noch gesperrte oder vorbereitete Bereiche; eine sichtbare Navigation ist kein Beleg für bereits verfügbare Matching- oder Nachrichtenfunktionen.

Die Startansicht zeigt das eigene öffentliche Profil als zentrale Profilansicht. Für Fotografen ist die Begrüßung mit Vorname vorgesehen. Das Profil enthält eine navigierbare Galerie und Informationen zum Profil. Ein Like-/Dislike- bzw. Interesselement gehört zur Profilansicht; die produktive Daten- und Matchinglogik ist gesondert zu verifizieren.

### Responsive Referenz

Die mobile Navigation, Profilgalerie und Vollbild-Fotobetrachtung sind wichtige Referenzzustände. Das Dashboard setzt `maximum-scale=1, user-scalable=no` im Viewport-Meta-Tag. Das ist der aktuelle Codezustand, kein allgemeiner Auftrag, Zoomverhalten anderer Bereiche zu ändern.

**Noch zu prüfen:** Desktop, Tablet und schmale/breite mobile Viewports; Navigation beim Wechsel zwischen Profil und Übersicht; Erstaufruf mit unvollständigem Profil; vollständiges Profil; Avatar-Dialog; Galerie mit Hoch- und Querformat; Vollbild hochkant und quer.

## 4. Profilverwaltung und Onboarding

**Datei:** `assets/js/wedconnect-dashboard.js`; Oberfläche in `dashboard.html`; Datenbankregeln in `supabase/migrations/`  
**Status:** mehrstufiger Assistent, Draft-/Edit-Verhalten und Upload-Oberflächen sind im Code angelegt. End-to-End-Speichern und Storage-Rechte sind getrennt zu testen.

### Gemeinsamer Ablauf

Die Anmeldung bleibt neutral. Danach startet bei einem neuen Profil die Rollenwahl **Hochzeitspaar** oder **Fotograf**. Der Assistent hat vier Profilseiten nach der Rollenwahl: Basisangaben, Details, Fotos und Prüfung/Abschluss. Ein Zurück-Button führt zwischen den Schritten. Der vollständige App-Bereich wird erst bei `profile_status = complete` geöffnet. Beim Bearbeiten vorhandener Profile sind automatische Speicherung und direkter Wechsel aus dem Profil vorgesehen.

### Hochzeitspaar

Das Formular erfasst die Vornamen beider heiratenden Personen, Datum, Ort/Location und ungefähre Gästezahl. Dazu kommen Vorstellung, Ablauf, gewünschte Begleitung, Bildstil, Bildwünsche und eine grundlegende Präferenz zur späteren Nutzung durch den Fotografen. Für die Fotos ist ein gemeinsames Paarfoto oder je ein Foto beider Personen vorgesehen.

### Fotograf

Das Formular erfasst Vorname, mehrfach auswählbare Einsatzgebiete inklusive Ganz Österreich, Erfahrung in Jahren und/oder fotografierten Hochzeiten, Bildstil (einschließlich Boho), Vergütung (unentgeltlich oder Fixbetrag) sowie gewünschten Begleitungsumfang. Der Begleitungsumfang beschreibt, welche Hochzeitsabschnitte der Fotograf für das eigene Portfolio noch fotografieren möchte. Instagram und Website sind optional; der Code normalisiert die Eingabe zu einem Link und bietet eine Vorschau zum Öffnen.

Die Galerie unterstützt laut Code bis zu 20 Fotos, mindestens 3 sind für den Abschluss vorgesehen, und 3 bis 5 Fotos können als Highlights markiert werden. Die Auswahl und Anzeige der Highlightmarkierung gehört in die Galerieansicht. Verfügbarkeit ist keine Profilangabe. Fotos sind JPG/JPEG, PNG und WebP; Portfoliofotos sind auf 2 MB pro Datei begrenzt. Der Profilfoto-Upload ist eine separate Account-Funktion mit rundem Zuschnitt.

### Wichtiger Abgleich mit älteren Dokumenten

`PROJECT-BIBLE-v1.2.md` enthält an mehreren Stellen frühere Planungswerte und Regeln (u. a. Verfügbarkeit, mindestens 10 Portfoliofotos, 10-MB-Angabe und eine nicht wechselbare Rollenvergabe). Diese Aussagen stimmen nicht mit den späteren Nutzerentscheidungen und dem Baseline-Code überein. Sie sind als historische/ersetzte Spezifikation zu behandeln und dürfen nicht als aktueller Funktionsumfang übernommen werden. Eine bereinigte Product Bible ist ein eigener nächster Dokumentationsschritt.

**Noch zu prüfen:** Rollenwechsel-Auswirkungen auf das jeweils andere Rollenprofil; ob bestehende Daten erhalten bleiben; Schritt-für-Schritt-Speichern; Reload und Fortsetzen; Rollen- und Abschluss-RPCs; Foto-Upload, Löschen, Reihenfolge, Zuschnitt, Highlights und Profile-Completion mit den tatsächlich eingesetzten Supabase-Policies.

## 5. Öffentliches Profil

**Datei:** `assets/js/wedconnect-dashboard.js` (Profilvorschau und Galerie), Profil- und Fotodaten aus Supabase  
**Status:** profilartige, bilderzentrierte Vorschau ist im Code vorhanden; Anzeige und echte Sichtbarkeit müssen mit vollständigen Testdaten geprüft werden.

### Gestaltungsprinzipien der Referenz

- Das Foto bzw. die Galerie ist der Mittelpunkt; der Bildbereich bleibt innerhalb des Profilrahmens.
- Name und Rolle stehen über dem Fotobereich; profilrelevante Informationen stehen darunter.
- Galeriebedienung und dezente Anzeige des aktuellen Bildes gehören auf das Bild bzw. direkt an die Galerie.
- Die Galerie lässt sich mit Bedienelementen und Tastatur wechseln. Bilder laden verzögert.
- Unter dem Namen sind Erfahrung und Vergütungsangabe platziert. Instagram- und Website-Symbole erscheinen dort nur, wenn Links gespeichert sind, und folgen der Größe/Optik der Metadaten-Icons.
- Der Vollbildmodus zeigt das Bild so groß wie möglich ohne Verzerrung oder Beschnitt; Hoch- und Querformat sind zu berücksichtigen. Das Schließen erfolgt über ein X.
- Die öffentliche Profilansicht enthält Interesse/Like-Aktion und soll sichtbar machen, wenn die andere Person ebenfalls Interesse gezeigt hat. Keine dieser UI-Entscheidungen behauptet, dass Matching oder Nachrichten bereits produktiv umgesetzt sind.

**Noch zu prüfen:** Bildreihenfolge und Bildanzahl, Ladefehler und Signed-URL-Erneuerung, Bildrundungen ohne durchscheinende Unterlage, mittige Galerie auf Mobilgeräten, Vollbild in Hoch-/Querformat, Like-Zustand mit realen Daten und Sichtbarkeit des eigenen Profils für andere angemeldete Konten.

## Screenshot- und Testmatrix (offen)

Die fünf Referenzmodule werden nach Möglichkeit mit realen Testkonten und neutralisierten Beispieldaten aufgenommen. Keine Kundendaten oder privaten Profilfotos in Dokumentations-Screenshots verwenden.

| Modul | Beleg, der noch fehlt |
|---|---|
| Für Fotografen | Desktop und mobil; FAQ geöffnet/geschlossen; rollenneutraler Auth-Dialog |
| Anmeldung | E-Mail, Google, Rückkehr, Fehler, Wiederherstellung; Start- und Ziel-URL |
| Dashboard | Profil unvollständig/vollständig; Desktop, Tablet, mobile Navigation; leere/Fehlerzustände |
| Profilverwaltung | Rolle, alle 4 Schritte pro Rolle, Zurück, Speichern/Fortsetzen, Galerie-/Avatar-Dialoge |
| Öffentliches Profil | mehrere Fotos, Likes, Metadaten, mobile Ansicht und Vollbild hochkant/quer |

Zu jedem Beleg: Datum, Baseline-Commit, Deployment/URL, Viewport und Testzustand ergänzen. Bis diese Matrix ausgefüllt ist, bleiben visuelle Aussagen **Code- und Entscheidungsreferenz**, keine vollständige Geräteabnahme.
