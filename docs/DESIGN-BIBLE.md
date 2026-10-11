# WedConnect · Design Bible

**Version:** 1.3  
**Stand:** 11. Oktober 2026  
**Status:** verbindlicher visueller Standard ab diesem Stand  
**Geltungsbereich:** öffentliche WedConnect-Website. Dashboard und eingeloggte App sind ausdrücklich ausgenommen.  
**Designsystem:** Öffentlicher Website-Master · Dark Editorial · Gold · redaktionelle Illustrationen

Diese Fassung legt die aktuelle „Für Fotografen“-Seite als verbindlichen Designmaster für die gesamte öffentliche WedConnect-Website fest. Alle weiteren öffentlichen Seiten übernehmen deren Farbwelt, Typografie, Layoutprinzipien, Komponenten, Ausrichtung, Abstände und Illustrationsstil. Inhalte und Illustrationen werden passend zur jeweiligen Seite gestaltet. Das eingeloggte Dashboard und die App sind von dieser Festlegung ausgenommen; ihr bestehender visueller Standard bleibt unverändert.

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

Die öffentliche Marketing-Website folgt der Schriftwirkung des freigegebenen Screenshots: eine prägnante, geometrische Sans-Schrift mit klarer Hierarchie. Website und Dashboard behalten getrennte typografische Rollen.

| Oberfläche / Einsatz | Schriftfamilie | Gewicht |
|---|---|---|
| Öffentliche Website: Überschriften, UI, Fließtext, Navigation, Buttons und Formulare | **Montserrat** | 400 bis 800; Hero-Titel meist 700 bis 800 |
| Dashboard und funktionale App-Oberflächen | **Manrope** | 400 bis 800; Titel meist 600 bis 800 |
| Eyebrows, Nummerierungen, technische Kurzlabels und kompakte Statuscodes | **IBM Plex Mono** | 400 bis 600 |
| Fallback | Arial, sans-serif | Systemfallback |

Montserrat prägt die öffentliche Website und die großen, kräftigen Headlines im Referenzscreenshot. Manrope bleibt für funktionale Dashboard- und App-Flächen reserviert. IBM Plex Mono bleibt auf kurze Kennzeichnungen beschränkt. Libre Caslon Text ist kein Bestandteil der aktuellen Pairing-Website-Typografie.

### Größen und Hierarchie

- Desktop-Fließtext: in der Regel 16 bis 18 px.
- Mobiler Fließtext: mindestens 16 px.
- Website-Hero-Headline: ungefähr 48 bis 88 px auf großen Ansichten; mobil fließend passend zum Viewport.
- Seitentitel und Abschnittstitel: responsiv und klar nachrangig zur Hero-Headline.
- Buttons und wichtige Formulare auf Mobilgeräten: 16 px.
- Metadaten: in der Regel mindestens 12 px. Rein dekorative Nummern dürfen kleiner sein, wenn sie keine notwendige Information tragen.
- Zeilenhöhe für längere Texte: mindestens 1.55; kurze Überschriften kompakter.

Die Hauptheadline kann zweifarbig sein: Haupttext in `text-primary`, ein inhaltlich bedeutender Teil in `accent-gold`. Die Hervorhebung strukturiert die Aussage und ist kein bloßer Effekt.

### Lesbarkeit

- Headlines passen sich über verfügbare Breite und Schriftgröße an. Keine starren `<br>`-Umbrüche, die bei Zwischenbreiten unnatürlich wirken.
- Lange Absätze erhalten eine begrenzte Lesebreite.
- Fließtext bleibt auch auf Mobilgeräten deutlich lesbar.
- Großbuchstaben und Monospace sind kurze UI-Marker, keine langen Lesetexte.

## 4. Layout, Raster und Abstände

- Zentrale Inhaltsfläche: maximal 1240 px einschließlich Innenabständen.
- Seitenränder: fließend mit `clamp(18px, 4vw, 48px)` für allgemeine Seitencontainer.
- Mobile App-Inhalt: mindestens 18 px Abstand zum Viewportrand.
- Grid-Spalten verwenden `minmax(0, 1fr)`, damit Inhalte nicht über ihre Spalte hinausragen.
- Layouts dürfen nicht auf eine einzelne Desktopbreite angewiesen sein. Übergänge zwischen Breakpoints sind genauso wichtig wie die kleinste und größte Ansicht.
- Karten, Formulare und App-Views erhalten `min-width: 0`, wenn sie in Flex- oder Grid-Layouts liegen.
- Horizontales Scrollen der gesamten Seite ist zu vermeiden. Horizontal scrollbare Streifen sind nur für gezielte Inhalte wie eine Portfolio-Galerie zulässig und müssen als solche erkennbar sein.
- Öffentliche redaktionelle Abschnitte ordnen Überschrift, erklärenden Text und Illustration in einem stabilen Raster. Bei schmalen Breiten stapeln sie sich mit dem Text vor der Illustration.

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
- Öffentliche Marketingseiten verwenden für jeden inhaltlichen Abschnitt eine passende redaktionelle Illustration. Motiv und Aussage unterstützen den jeweiligen Text konkret; generische Wiederholungen sind zu vermeiden.
- Die WedConnect-Hero-Illustration mit Hochzeitspaar und Fotograf ist die visuelle Stilreferenz für neue Website-Illustrationen. Die Motive sollen sich als zusammenhängende Serie lesen.
- KI-Illustrationen werden als Symbol- oder Konzeptmotive gekennzeichnet und nicht als echte Hochzeitsreportage ausgegeben.
- Diese erzählerischen Illustrationen gehören zur öffentlichen Website. Im Dashboard werden sie nicht eingesetzt; dort stehen echte Profil-/Portfolioaufnahmen und funktionale Icons im Vordergrund.
- Bildauswahl zeigt echte Menschen und Arbeitskontexte, keine inszenierten Hochzeitsklischees.
- Keine Bögen oder Fensterformen als Bildmaske, kein dekorativer Rahmen, der die Bildwirkung dominiert.
- Zuschnitte erhalten Gesichter, wichtige Gesten und fotografische Aussage. Wo ein vollständiger Bildausschnitt wichtig ist, wird kein `cover`-Zuschnitt erzwungen.
- Bildunterschriften, Nummern und erklärende Angaben stehen bevorzugt in einer ausgerichteten Zeile unter dem Bild. Sie werden nicht über das Motiv gelegt, wenn sie dort nicht klar lesbar sind.
- Hero-Motive erhalten Raum, aber keine losgelösten Badges oder Texte, die an Bild- oder Viewporträndern kleben.
- Jeder erklärende Website-Abschnitt verbindet Text und Motiv als ausgerichtete Komposition. Kurze Conversion-Zeilen, Navigation, Formulare und rechtliche Hinweise benötigen keine erzählerische Illustration.
- Illustrationen werden als optimierte Projektassets eingebunden. Wenn die HTML-Datei unabhängig von einem lokalen Asset-Ordner als Einzeldatei geteilt oder in einen Editor kopiert wird, verwenden die Bildpfade erreichbare absolute Projekt-URLs statt relativer Pfade. Alternativtexte beschreiben das Motiv; `object-fit: cover` ist nur für passend komponierte Illustrationen zulässig und darf keine relevante Handlung abschneiden.

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

Diese WedConnect Design Bible ist ab Version 1.3 der verbindliche visuelle Standard für alle öffentlichen Website-Seiten. Sie ersetzt für diese Seiten frühere Designvorgaben. Das eingeloggte Dashboard und die App sind nicht Teil dieses Geltungsbereichs.

Diese Bible definiert ausschließlich das visuelle System von WedConnect. Produktumfang, Funktionsregeln und Markenstimme werden in den dafür vorgesehenen Projektunterlagen separat neu festgelegt. Ältere inhaltliche Quellen sind keine Grundlage für Änderungen am hier dokumentierten visuellen Standard.

Der maßgebliche visuelle Master ist `fotografen.html` im Repository `Supersheriff1/WedConnect_new`, Stand Commit `519b6b727139ef99bd0681b4aa89dd6c2d53c2de`. Er definiert das Erscheinungsbild und den Seitenaufbau der öffentlichen Website. Neue öffentliche Seiten übernehmen diese Gestaltung; ihre Texte, Beispiele und Illustrationen werden für den jeweiligen Inhalt passend ausgearbeitet. Änderungen am Master werden zuerst in dieser Bible und danach konsistent auf den öffentlichen Seiten umgesetzt. Dashboard und eingeloggte App folgen weiterhin ihrem eigenen, hier nicht veränderten Standard.

## 10. Referenzstatus

`fotografen.html` ist der freigegebene Designmaster für die öffentliche Website: dunkles Pairing-System, Montserrat, IBM Plex Mono für kurze Labels, Goldakzente, klare Karten und die redaktionelle WedConnect-Illustrationsserie. Die öffentliche Startseite, die Seite für Hochzeitspaare und weitere öffentliche Informationsseiten richten sich nach diesem Stand. Das eingeloggte Dashboard und die App sind ausdrücklich ausgenommen und bleiben im derzeitigen Designsystem mit Manrope und funktionalen Portfoliofotos.

Die HTML-Datei ist visuell und funktional ein Prototyp. Echte Authentifizierung, persistente Profile, serverseitige Matches, produktive Nachrichten und Rechteverwaltung sind nicht implementiert. Die Responsive-Regeln dienen als verbindliche Gestaltungsleitlinie; neue Komponenten sind bei den relevanten schmalen, mittleren und breiten Viewports praktisch zu prüfen.
