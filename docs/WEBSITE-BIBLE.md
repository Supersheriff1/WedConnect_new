# WedConnect · Website Bible

**Version:** 1.0  
**Stand:** 24. Oktober 2026  
**Status:** Arbeitsgrundlage für Inhalte und Struktur der öffentlichen Website  
**Geltungsbereich:** öffentliche, nicht eingeloggte Website  
**Nicht enthalten:** Dashboard, eingeloggte App, Matching- und Chatlogik, Datenbankverhalten

Diese Datei beschreibt den aktuellen Stand der öffentlichen Website und macht redaktionelle Änderungen unabhängig von der App planbar. Sie ist die inhaltliche und strukturelle Ergänzung zur eingefrorenen [Design Bible](DESIGN-BIBLE.md); sie ersetzt oder überschreibt deren visuelle Regeln nicht.

## Quellen und Vorrang

- [Project Bible](PROJECT-BIBLE.md) enthält verbindliche Produktentscheidungen.
- [Design Bible](DESIGN-BIBLE.md), Version 2.3, enthält den eingefrorenen visuellen Standard der öffentlichen Website.
- [App Design Bible](APP-DESIGN-BIBLE.md) gilt für Dashboard und eingeloggte App und ist nicht Bestandteil dieser Website Bible.
- [Implementierungsstand](IMPLEMENTATION-STATUS.md) beschreibt den zuletzt dokumentierten Code-/Datenbankstand. Er kann hinter `main` oder Produktion zurückliegen.
- Der aktuelle HTML-Code der unten aufgeführten Seiten ist der konkrete Umsetzungsstand. Vor jeder Änderung ist er erneut zu prüfen.

Bei widersprüchlichen Angaben wird die Abweichung sichtbar festgehalten und nicht stillschweigend entschieden.

## Unabhängige Bearbeitung

Texte, Reihenfolge und Inhalte der öffentlichen Seiten können in dieser Bible separat von der App besprochen und angepasst werden. Eine redaktionelle Freigabe ist keine Freigabe für App-, Datenbank- oder Auth-Änderungen.

Der visuelle Standard bleibt in `DESIGN-BIBLE.md`. Für Änderungen an Layout, Farben, Typografie, Bildsprache, Komponenten oder Animationen ist die dortige Freigaberegel maßgeblich. Die öffentliche Seite `fotografen.html` bleibt gemäß Project Bible und Start Here eingefroren und wird nur auf ausdrückliche Anweisung verändert.

## Seitenübersicht

| Seite | Datei | Zweck | Inhaltlicher Status |
|---|---|---|---|
| Startseite | `index.html` | WedConnect erklären und Besucher:innen zu Paar- oder Fotografeninformationen führen | Texte bearbeitbar; aktuelle Aussagen vor Änderung gegen Produkt- und Live-Stand prüfen |
| Für Hochzeitspaare | `hochzeitspaare.html` | Nutzen, Ablauf und häufige Fragen für Paare erklären | Texte bearbeitbar; laut Project Bible noch nicht final |
| Für Fotografen | `fotografen.html` | Fotograf:innen informieren und zur Registrierung führen | Eingefroren; Änderungen nur auf ausdrückliche Anweisung |

Alle drei Seiten enthalten Navigation zwischen den öffentlichen Seiten sowie einen Einstieg „Konto erstellen“. Vor Änderungen an Registrierung, Authentifizierung oder Zielseiten zuerst die tatsächlichen Verknüpfungen im Code und das aktuelle App-Verhalten prüfen.

## Aktueller Inhalt

### Startseite — `index.html`

**Seitentitel:** „WedConnect — Wenn Hochzeiten und Bildsprachen zusammenfinden“

**Aktuelle Abschnittsfolge:**

1. Hero: „Wenn Hochzeiten und Bildsprachen zusammenfinden.“
2. Perspektive Hochzeitspaar: „Ein Tag mit eigener Geschichte“
3. Perspektive Fotograf: „Ein Blick mit eigener Handschrift“
4. Zusammenarbeit: „Nicht irgendein Auftrag. Eine Zusammenarbeit, die passt.“
5. Zwei rollenbezogene Einblicke: „Zeigt, was euren Hochzeitstag besonders macht.“ und „Entdeckt Hochzeiten, die eure Arbeit weiterbringen.“
6. Einstieg zum Matching: „Ein guter Match beginnt mit einem guten Gefühl.“
7. Ablauf: „Von der ersten Vorstellung zum Gespräch.“
8. Drei Prozessschritte: Beide Seiten zeigen sich; jede Seite wählt selbst; ein Gespräch kann beginnen.
9. Klare Vereinbarungen zu einer möglichen Zusammenarbeit
10. Abschluss-CTA: „Finde heraus, ob WedConnect zu dir passt.“ / „Konto erstellen“

**Kernbotschaft im aktuellen Code:** WedConnect bringt Hochzeitspaare und Hochzeitsfotografen für mögliche TFP-Zusammenarbeiten zusammen. Beide Seiten entscheiden selbst, ob sie Interesse zeigen. Ein Match eröffnet ein Gespräch und ist noch keine Buchungszusage.

**Zu prüfender Hinweis:** Der aktuelle Homepage-Code enthält außerdem die Aussage, WedConnect befinde sich im Aufbau und Registrierung sowie Matching seien noch nicht produktiv verfügbar. Das kann dem derzeitigen produktiven App-Status widersprechen. Vor einer redaktionellen Veröffentlichung den öffentlichen Live-Text und den tatsächlichen Registrierungs-/Matching-Status prüfen. Diese Bible autorisiert keine automatische Textänderung.

### Für Hochzeitspaare — `hochzeitspaare.html`

**Seitentitel:** „Für Hochzeitspaare | WedConnect“

**Aktuelle Abschnittsfolge:**

1. Hero: „Findet Fotografen, deren Blick zu eurer Hochzeit passt.“
2. Hochzeit und persönliche Geschichte beschreiben
3. Wahlmöglichkeiten für Umfang und Art der Zusammenarbeit
4. Einzelne Momente oder Reportage
5. Umfang, Gegenleistung und Nutzungsrechte gemeinsam klären
6. WedConnect ist für Paare kostenlos
7. Ablauf vom Profil bis zum Gespräch
8. FAQ
9. Abschluss-CTA: „Macht eure Hochzeit für passende Fotografen sichtbar.“ / „Konto erstellen“

**Redaktioneller Status:** Inhalte sind noch nicht final. Änderungen müssen die Produktgrundlage berücksichtigen: Ein Match ist kein Buchungsvertrag; Details wie Umfang, mögliche Vergütung, Lieferung und Bildrechte werden vor einer Zusammenarbeit ausdrücklich vereinbart. Paare stimmen grundsätzlich der Verwendung ausgewählter Bilder zu, die Veröffentlichung erfolgt erst nach ihrer Freigabe. Paare können außerdem angeben, ob sie abhängig von Umfang und Angebot einen reduzierten Betrag zahlen würden.

### Für Fotografen — `fotografen.html`

**Seitentitel:** „Für Fotografen | WedConnect“

**Aktuelle Abschnittsfolge:**

1. Hero: „Baue das Portfolio auf, das du wirklich zeigen willst.“
2. Fotografenprofil und Hochzeitspaar als Beispiele
3. Herausforderung: fotografierte Hochzeiten spiegeln sich noch nicht im Portfolio
4. Echte Hochzeiten, Styled Shoots und selbst organisierte Projekte
5. Ablauf: Hochzeit entdecken, Passung prüfen, Interesse zeigen, Kontakt aufnehmen
6. Honorar und Bildrechte: „Deine Arbeit. Dein Honorar. Deine Bildrechte.“
7. FAQ
8. Abschluss-CTA: „Finde Hochzeiten, die zu deiner Bildsprache passen.“ / „Konto erstellen“

**Status:** Diese Seite ist der eingefrorene öffentliche Designmaster. Auch inhaltliche Änderungen benötigen eine ausdrückliche Anweisung. Als verbindliche Grenze für Inhalte gelten die Entscheidungen der Project Bible: Fotograf:innen können kostenlos (TFP), zu einem reduzierten Preis oder beides anbieten. Ein konkreter Betrag wird nicht pauschal durch WedConnect festgelegt; Umfang und Vergütung werden im Gespräch vereinbart. Ausgewählte Fotos werden dem Paar vor Veröffentlichung zur Freigabe vorgelegt.

## Gemeinsame Inhaltsregeln

- Die Website spricht Hochzeitsfotograf:innen und Hochzeitspaare klar und respektvoll an.
- WedConnect vermittelt mögliche Kooperationen. Ein Match ist gegenseitiges Interesse und eröffnet ein Gespräch; es verspricht weder Buchung noch konkrete Leistung.
- Umfang, Gegenleistung, Bildlieferung und Bildrechte sollen als Punkte beschrieben werden, die die Beteiligten miteinander vereinbaren.
- Keine Formulierung darf den Eindruck erwecken, dass ein konkreter Preis, eine Buchung oder eine automatische Veröffentlichung garantiert ist.
- Aussagen über Registrierung, Verfügbarkeit, Matching oder Live-Funktionen müssen gegen den aktuellen Live-Stand geprüft werden.
- Vorhandene Texte oder öffentliche Seiten nicht stillschweigend als endgültige Produktentscheidung behandeln.

## Bearbeitungsstatus und Ablauf

Statuswerte:

- **Eingefroren:** keine Änderung ohne ausdrückliche Anweisung.
- **Bearbeitbar:** Text/Struktur kann redaktionell überarbeitet werden, sofern Produktentscheidungen und Designstandard eingehalten werden.
- **Zu prüfen:** tatsächliche Live-Funktion oder Aussage vor Veröffentlichung verifizieren.
- **Außerhalb des Geltungsbereichs:** App, Dashboard, Backend oder Datenbank.

Vor einer Änderung:

1. Betroffene HTML-Datei und aktuellen Branch prüfen.
2. Diese Website Bible, Project Bible und Design Bible abgleichen.
3. Veraltete oder widersprüchliche Aussagen als Abweichung markieren.
4. Nur den beauftragten öffentlichen Website-Bereich ändern.
5. Links, mobile Darstellung und CTA-Ziel der geänderten Seite prüfen.
6. Bei abgeschlossener Umsetzung diese Bible aktualisieren, wenn sich Zweck, Abschnittsfolge, Kernaussagen oder Status geändert haben.

## Dokumentenübersicht

| Dokument | Zuständigkeit |
|---|---|
| `PROJECT-BIBLE.md` | Verbindliche Produktentscheidungen |
| `WEBSITE-BIBLE.md` | Inhalt und Struktur der öffentlichen Website |
| `DESIGN-BIBLE.md` | Eingefrorener visueller Standard der öffentlichen Website |
| `APP-DESIGN-BIBLE.md` | Eingeloggte App und Dashboard |
| `IMPLEMENTATION-STATUS.md` | Dokumentierter Code-, Datenbank- und Verifikationsstand |
| `IDEAS-BIBLE.md` | Unverbindliche Ideen |
| `START-HERE.md` | Einstieg und Schutzregeln für neue Arbeit |
