# WedConnect · Design Bible

**Version:** 1.1  
**Stand:** 10. Oktober 2026  
**Status:** verbindlicher visueller Standard ab diesem Stand  
**Geltungsbereich:** öffentliche Website, App-Demo und alle neuen WedConnect-Oberflächen  
**Designsystem:** Pairing · Dark Editorial · Gold

Diese Fassung ersetzt die bisherige Design Bible mit Cream-&-Gold-Vorgaben vollständig. Sie dokumentiert den freigegebenen Pairing-Stand der aktuellen WedConnect-Demo. Neue Screens und Änderungen folgen dieser Bible. Eine Abweichung braucht eine bewusste, dokumentierte Produkt- und Designentscheidung.

## 1. Designziel und Markenerlebnis

WedConnect verbindet zwei eigenständige Seiten: Hochzeitspaare und Fotografen. Die Oberfläche soll diese Verbindung zeigen und dabei modern, technisch kompetent und hochwertig wirken. Die Hochzeitswelt bleibt durch echte Emotion, sorgfältige Bildauswahl und menschliche Sprache erkennbar. Sie wird nicht durch typische Hochzeitsromantik dekoriert.

Das Erlebnis ist:

- **hochwertig und präzise:** klare Hierarchie, saubere Abstände, kontrollierte Details
- **digital und vertrauenswürdig:** nachvollziehbare Zustände, strukturierte Informationen, verlässliche Interaktionen
- **menschlich und zurückhaltend romantisch:** Wärme entsteht durch Fotografie und Begegnung, nicht durch Klischees
- **ausgewogen:** Paar und Fotograf erhalten gleichwertigen Raum und gleich klare Handlungswege

### Verbindliche visuelle Richtung

Der aktuelle Stil heißt **Pairing**. Zwei Seiten werden durch ein sichtbares, zentriertes Verbindungselement zusammengeführt. Dunkle Flächen schaffen Tiefe und Fokus; Gold markiert Aktionen, aktive Zustände und die Verbindung. Karten wirken präzise und hochwertig, mit klaren Kanten und moderaten Radien.

### Nicht Teil des aktuellen Stils

- Cream-&-Gold-Seitenflächen als Grundgestaltung
- romantische Bögen, Spitzen, Blumenornamente oder kalligrafische Schriften
- sehr weiche, stark gerundete Buttons oder übermäßig pillenförmige Karten
- starke Verläufe, Glitzer, überladene Herzmotive oder dekorative Hochzeitsklischees
- unleserliche Mikrotexte, schwache Kontraste und beliebige UI-Verzierungen

Gold bleibt ein gezielter Akzent. Romantik zeigt sich durch Inhalt, Bildsprache und die Bedeutung der Begegnung.

## 2. Farbpalette und Design-Tokens

| Token | Wert | Verwendung |
|---|---|---|
| `canvas` | `#25242B` | Haupthintergrund und tiefe Flächen |
| `surface-subtle` | `#2B2A31` | Sekundäre Bereiche, Navigation und Chatfläche |
| `surface` | `#302F38` | Karten, Dialoge, Eingaben und zentrale Panels |
| `surface-raised` | `#34323A` | Zurückhaltend hervorgehobene Infobereiche |
| `surface-hover` | `#3C3943` | Hover, Chips, Tags und sekundäre aktive Flächen |
| `text-primary` | `#F5F2EC` | Überschriften und primärer Text |
| `text-secondary` | `#E3DFE2` | Fließtext und unterstützende Inhalte |
| `text-muted` | `#C2BDC3` | Metadaten und weniger wichtige Hinweise; weiterhin gut lesbar |
| `accent-gold` | `#D5B67A` | Primäre Aktionen, aktive Zustände, Verbindungselemente |
| `success` | `#A4C5A8` | Erfolg und bestätigte Zustände |
| `alert` | `#E3A09A` | Fehler und wichtige Warnungen, sparsam eingesetzt |
| `border` | `#514E59` | Karten-, Eingabe- und Trennlinien |
| `shadow` | `0 20px 50px #09090B55` | Tiefe unter wichtigen Ebenen, sparsam |

### Farbregeln

- Standardtext auf dunklen Flächen verwendet `text-primary` oder `text-secondary`.
- Goldtext wird nur dort eingesetzt, wo er sich deutlich vom Hintergrund abhebt. Auf Goldflächen steht dunkler Text, derzeit `#29262B`.
- `success` und `alert` sind Statusfarben, keine zusätzlichen Markenfarben.
- Inaktive Elemente bleiben erkennbar und lesbar. Deaktiviert wird zusätzlich über Zustand, Form oder Erklärung vermittelt, nicht nur durch eine Farbänderung.
- Keine flächige Verwendung von Creme, Sand oder warmem Weiß. Eine helle inverse Fläche ist nur für klar begründete Einzelkomponenten wie Toasts zulässig.
- Über Bildern liegende Texte erhalten eine ausreichend deckende Fläche oder werden außerhalb des Bildes platziert.

### Kontrastreferenz

Die aktuellen Kernfarbpaare erreichen folgende Kontrastwerte:

| Vordergrund / Hintergrund | Verhältnis | Einsatz |
|---|---:|---|
| `#F5F2EC` / `#25242B` | 13.76:1 | Haupttext auf Canvas |
| `#F5F2EC` / `#302F38` | 11.83:1 | Haupttext auf Karten |
| `#E3DFE2` / `#25242B` | 11.65:1 | Fließtext auf Canvas |
| `#C2BDC3` / `#25242B` | 8.32:1 | Metadaten auf Canvas |
| `#25242B` / `#D5B67A` | 7.91:1 | Buttontext auf Gold |
| `#D5B67A` / `#302F38` | 6.80:1 | Goldakzent auf Karte |
| `#A4C5A8` / `#25242B` | 8.15:1 | Erfolgsstatus auf Canvas |
| `#E3A09A` / `#25242B` | 7.15:1 | Warnstatus auf Canvas |

Diese Werte gelten für deckende Farbpaare. Transparenz, Bildhintergründe, Verläufe und neue Farben müssen im gerenderten Zustand erneut geprüft werden.

## 3. Typografie

| Einsatz | Schriftfamilie | Gewicht |
|---|---|---|
| Überschriften, UI, Fließtext, Navigation, Buttons und Formulare | **Manrope** | 400 bis 800; Titel meist 600 bis 800 |
| Eyebrows, Nummerierungen, technische Kurzlabels und kompakte Statuscodes | **IBM Plex Mono** | 400 bis 600 |
| Fallback | Arial, sans-serif | Browserstandard |

Manrope ist die einheitliche Hauptschrift. Libre Caslon Text und Montserrat gehören nicht mehr zum aktiven Pairing-System. IBM Plex Mono unterstützt die technische, strukturierte Note und bleibt auf kurze Labels beschränkt.

### Größen und Hierarchie

- Desktop-Fließtext: in der Regel 15 bis 17 px.
- Mobiler Fließtext: mindestens 16 px.
- Hero-Headline: fließend von ungefähr 40 bis 68 px auf großen Ansichten; mobil passend zum Viewport, ohne erzwungene Zeilenumbrüche.
- Seitentitel und Abschnittstitel: responsiv, klar nachrangig zur Hero-Headline.
- Buttons und wichtige Formulare auf Mobilgeräten: 16 px.
- Metadaten: in der Regel mindestens 12 px. Kleine rein dekorative Nummern dürfen darunter liegen, wenn sie keine notwendige Information tragen.
- Zeilenhöhe für längere Texte: mindestens 1.55; kurze Überschriften kompakter.

Die Hauptheadline kann zweifarbig sein: Haupttext in `text-primary`, ein inhaltlich bedeutender Teil in `accent-gold`. Die Hervorhebung soll die Aussage strukturieren und nicht als dekorativer Effekt eingesetzt werden.

### Lesbarkeit

- Headline-Länge wird über verfügbare Breite und Schriftgröße gesteuert. Keine starren `<br>`-Umbrüche, die bei Zwischenbreiten unnatürliche Zeilen erzwingen.
- Lange Absätze erhalten eine begrenzte Lesebreite.
- Fließtext und unterstützende Erklärung bleiben auch auf Mobilgeräten deutlich lesbar.
- Großbuchstaben und Monospace sind kurze UI-Marker, keine langen Lesetexte.

## 4. Layout, Raster und Abstände

- Zentrale Inhaltsfläche: maximal 1240 px einschließlich Innenabständen.
- Seitenränder: fließend mit `clamp(18px, 4vw, 48px)` für allgemeine Seitencontainer.
- Mobile App-Inhalt: mindestens 18 px Abstand zum Viewportrand.
- Grid-Spalten verwenden `minmax(0, 1fr)`, damit Inhalte nicht über ihre Spalte hinausragen.
- Layouts dürfen nicht auf eine einzelne Desktopbreite angewiesen sein. Übergänge zwischen Breakpoints sind genauso wichtig wie die kleinste und größte Ansicht.
- Karten, Formulare und App-Views erhalten `min-width: 0`, wenn sie in Flex- oder Grid-Layouts liegen.
- Horizontales Scrollen der gesamten Seite ist zu vermeiden. Horizontal scrollbare Streifen sind nur für gezielte Inhalte wie eine Portfolio-Galerie zulässig und müssen als solche erkennbar sein.

### Responsive Breakpoints der aktuellen Referenz

| Bereich | Verhalten |
|---|---|
| bis 900 px | Hero wird einspaltig; App-Willkommensbereich und breitere Inhaltsgrids wechseln zu einer geeigneten Tablet-Anordnung |
| bis 820 px | Öffentliche Navigation klappt in ein zugängliches Menü; Inhalte und Controls bleiben innerhalb des Containers |
| bis 720 px | App-Seitenleiste wird durch eine feste mobile Unter-Navigation ersetzt |
| bis 650 px | Hauptgrids werden einspaltig; Hero-Texte und Aktionen werden mobil ausgerichtet; Formulare und Karten passen sich an |
| bis 390 px | Primäraktionen können untereinander stehen; kompakte Paarungsdetails behalten lesbare Abstände |
| bis 340 px | Nur sekundäre Abstände werden reduziert; Außenränder und zentrale Bedienbarkeit bleiben erhalten |

Breakpoints sind Startwerte der Referenz, keine Erlaubnis für abrupte oder fehlerhafte Zwischenlayouts. Neue Komponenten müssen flexibel auf die tatsächliche verfügbare Breite reagieren.

## 5. Bildsprache

Bilder bringen echte Hochzeitserfahrung und fotografische Qualität in die Oberfläche. Die Gestaltung bleibt dokumentarisch, modern und glaubwürdig.

- Bevorzugt werden echte Hochzeitsreportagen und nachvollziehbare Portfolioarbeiten.
- Illustrationen sind zulässig, wenn sie redaktionell, hochwertig und zurückhaltend wirken. KI-Bilder werden als solche gekennzeichnet.
- Bildauswahl zeigt echte Menschen und Arbeitskontexte, keine inszenierten Hochzeitsklischees.
- Keine Bögen oder Fensterformen als Bildmaske, kein dekorativer Rahmen, der die Bildwirkung dominiert.
- Zuschnitte erhalten Gesichter, wichtige Gesten und fotografische Aussage. Wo ein vollständiger Bildausschnitt wichtig ist, wird kein `cover`-Zuschnitt erzwungen.
- Bildunterschriften, Nummern und erklärende Angaben stehen bevorzugt in einer ausgerichteten Zeile unter dem Bild. Sie werden nicht über das Motiv gelegt, wenn sie dort nicht klar lesbar sind.
- Hero-Motive erhalten Raum, aber keine losgelösten Badges oder Texte, die an Bild- oder Viewporträndern kleben.

## 6. Komponenten

### Navigation

- Desktop: klare Hauptnavigation mit gut unterscheidbaren aktiven Zuständen.
- Tablet und Mobile: ein sichtbarer Menüschalter mit `aria-expanded` und `aria-controls`; Menüeinträge bleiben erreichbar.
- App Mobile: feste untere Navigation mit Textlabel und Icon, sicherem Abstand zum Bildschirmrand und aktivem Zustand.
- Navigation bleibt kompakt, aber nicht auf Kosten der Lesbarkeit oder Touchgröße.

### Buttons und Aktionen

Buttons wirken präzise und modern, nicht verspielt. Der Standardradius beträgt **8 px**. Pillenformen sind für Chips und kompakte Filter vorgesehen, nicht für primäre Aktionen.

- **Primär:** Goldfläche, dunkler Text, klare Beschriftung und eindeutiger Hover-, Fokus- und Aktivzustand.
- **Sekundär:** dunkle Kartenfläche mit sichtbarem Rand und hellem Text.
- **Dezent:** leicht angehobene dunkle Fläche für ergänzende Aktionen.
- Mindesthöhe: 48 px am Desktop, 50 px auf Mobilgeräten.
- Mobile Touchziele sollen mindestens 44 × 44 px erreichen.
- Aktionen verwenden konkrete Verben und bleiben verständlich, auch wenn sie allein in einer Karte stehen.

### Karten und Panels

- Standardradius: 18 px.
- Flächen: `surface` oder eine klar abgegrenzte dunklere Ebene.
- Rand: 1 px `border`; Schatten nur zur Ebenentrennung.
- Innenabstände werden nach Inhalt und Viewport skaliert. Karten dürfen nicht zu dicht oder zu weitläufig wirken.
- Inhalt, Überschrift, Status und Aktion folgen einer stabilen Reihenfolge.

### Pairing-Karte

Die Pairing-Karte ist das zentrale visuelle Muster:

1. Bild in einer klar begrenzten, rechteckigen Fläche mit moderatem Radius.
2. Bildindex und Bildhinweis in einer lesbaren, links und rechts sauber ausgerichteten Zeile unter dem Motiv.
3. Paar- und Fotografeninformationen als zwei gleichwertige Seiten.
4. Verbindungszeichen exakt in der Mitte der beiden Spalten, mit eigenem Abstand zu beiden Textblöcken.
5. Match- oder Interessenstatus unterhalb der Informationen, nicht über Bild oder Namen gelegt.

Bei schmalen Breiten werden die zwei Seiten mittig und lesbar ausgerichtet. Das Verbindungszeichen bleibt in der eigenen Mittelspalte und darf nicht an einen Namen oder Beschreibungstext stoßen.

### Formulare

- Eingabefelder verwenden eine dunkle Kartenfläche, gut sichtbaren Rand und hellen Text.
- Standardradius: 12 px.
- Labels bleiben sichtbar, auch wenn ein Feld ausgefüllt ist. Platzhalter ersetzen keine Labels.
- Fokus erhält einen klar sichtbaren Goldrahmen und zusätzlichen Fokusindikator.
- Fehler enthalten eine verständliche Erklärung und ein zusätzliches visuelles Signal.
- Auf Mobilgeräten sind Eingaben mindestens 50 px hoch und vermeiden Text unter 16 px.

### Badges, Tags und Status

- Tags und Chips dürfen pillenförmig sein, wenn es die kompakte Filterfunktion unterstützt.
- Aktive Chips verwenden `surface-hover`, `border` und Goldtext.
- Statusfarben werden sparsam und semantisch eingesetzt.
- Status darf nicht allein durch Farbe verständlich sein; Text oder Icon ergänzt ihn.

### Nachrichten

- Gesprächsfläche: dunkle, ruhige Panel-Fläche.
- Eingehende Nachricht: `surface-hover` mit hellem Text.
- Eigene Nachricht: Goldfläche mit dunklem Text.
- Nachrichtengruppen sind klar getrennt und bequem lesbar.
- Eingabe und Senden bleiben auf Mobilgeräten erreichbar, ohne den Verlauf zu verdecken.
- Ein Hinweis zur Verschlüsselung darf nur den tatsächlichen technischen Schutz beschreiben. Die Demo kennzeichnet den Chat als nicht produktiv beziehungsweise nicht Ende-zu-Ende-verschlüsselt.

### Dialoge und Hinweise

- Dialoge liegen über einem abgedunkelten Hintergrund, haben klare Überschrift, Erklärung und nachvollziehbare Aktionen.
- Schließen ist erreichbar und visuell eindeutig.
- Erfolgsmeldungen verwenden kurzlebige Toasts, ohne wichtige Information ausschließlich darin unterzubringen.

## 7. Bewegung und Interaktion

- Animationen unterstützen Orientierung oder geben verständliches Feedback.
- Übergänge sind kurz, ruhig und nicht blockierend.
- Die Match-Animation darf die beidseitige Verbindung hervorheben, bleibt aber hochwertig und kontrolliert. Kein übermäßiger Konfetti- oder Herzregen.
- Hover-Zustände verändern sich subtil und verschieben keine Inhalte.
- Tastaturfokus ist immer sichtbar.
- `prefers-reduced-motion: reduce` reduziert nicht notwendige Bewegung und schaltet dekorative Animationen ab.

## 8. Barrierefreiheit und Qualitätsprüfung

Vor der Freigabe jeder Seite und Komponente:

1. Auf typischen schmalen, mittleren und breiten Viewports prüfen, besonders direkt ober- und unterhalb der Breakpoints.
2. Sicherstellen, dass links und rechts ein sichtbarer Außenabstand bleibt und kein Inhalt am Viewportrand klebt.
3. Auf horizontales Overflow, überlappende Texte, abgeschnittene Headlines und Buttons prüfen.
4. Die tatsächlichen gerenderten Kontraste prüfen. Text verwendet mindestens 4.5:1, großer Text mindestens 3:1 als Zielwert.
5. Navigation, Buttons, Dialoge und Formulare vollständig per Tastatur bedienen.
6. `:focus-visible`, Hover, pressed, active, disabled, success und error prüfen.
7. Touchziele und mobile Textgrößen prüfen.
8. Bildtext und Captions auf Lesbarkeit und Ausrichtung prüfen; wichtige Inhalte nicht über unruhige Bildbereiche legen.
9. Reduzierte Bewegung testen.
10. Produktwahrheit prüfen: gegenseitiges Interesse, Rechteklärung und Demo-Status werden nicht missverständlich dargestellt.

## 9. Source of Truth und Pflege

Diese WedConnect Design Bible ist ab Version 1.1 die aktuelle visuelle Referenz. Sie ersetzt die frühere Design Bible und deren Cream-&-Gold-Vorgaben.

Diese Bible definiert ausschließlich das visuelle System von WedConnect. Produktumfang, Funktionsregeln und Markenstimme werden in den dafür vorgesehenen Projektunterlagen separat neu festgelegt. Ältere inhaltliche Quellen sind keine Grundlage für Änderungen am hier dokumentierten visuellen Standard.

Der maßgebliche visuelle Referenzstand ist `wedconnect-komplett-pairing-v1.html` (Pairing-Stand vom 10. Oktober 2026). Änderungen an Tokens, Typografie, Bildregeln oder Komponenten werden zuerst in dieser Bible dokumentiert und anschließend konsistent umgesetzt.

## 10. Referenzstatus der aktuellen Demo

Die Referenz-HTML zeigt das dunkle Pairing-System, Manrope, IBM Plex Mono, Goldakzente, eckigere Buttons, Karten und das zentrierte Verbindungselement. Die Layoutregeln enthalten eine fließende Seitenkante und responsive Navigation.

Die HTML-Datei ist visuell und funktional ein Prototyp. Echte Authentifizierung, persistente Profile, serverseitige Matches, produktive Nachrichten und Rechteverwaltung sind nicht implementiert. Die Responsive-Regeln dienen als verbindliche Gestaltungsleitlinie; neue Komponenten sind bei den relevanten schmalen, mittleren und breiten Viewports praktisch zu prüfen.
