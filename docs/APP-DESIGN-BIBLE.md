# WedConnect · App Design Bible

**Version:** 0.1  
**Stand:** 14. Oktober 2026  
**Status:** App-Baseline aus freigegebenen Entscheidungen und Codeprüfung  
**Geltungsbereich:** Dashboard, Profil-Onboarding, Profilverwaltung und eingeloggte Ansichten

## Verhältnis zur öffentlichen Design Bible

Die öffentliche Website hat mit [`DESIGN-BIBLE.md`](DESIGN-BIBLE.md) einen eigenen eingefrorenen Standard. Diese App-Bible übernimmt dessen Pairing-Farbwelt und Schriftfamilien, legt aber eigene App-Komponenten und Verhalten fest. Eine App-Änderung darf nicht automatisch eine öffentliche Seite verändern.

Diese Fassung friert keine neuen Gestaltungsideen ein. Sie dokumentiert bestätigte Produktentscheidungen und die App-Baseline; Code-Abweichungen stehen in [`IMPLEMENTATION-STATUS.md`](IMPLEMENTATION-STATUS.md). Bestehende Ansichten, Texte und Abläufe bleiben eingefroren, solange Ali keine konkrete Änderung freigibt.

## Visuelle Grundregeln

- Dunkle Pairing-Oberfläche: Canvas `#25242B`, Navigation `#2B2A31`, Flächen `#302F38` / `#34323A`, Gold `#D5B67A`, helle Texte und gut erkennbare Grenzen.
- Manrope für UI und Fließtext; IBM Plex Mono nur für kurze Kennzeichnungen, Fortschritt und Metadaten.
- Klare Ausrichtung, moderate Rundungen, dünne Grenzen und sparsame Schatten. Keine dekorativen Rahmen, die Fotos nicht sauber einschließen.
- Dashboard-Texte sind knapp und selbsterklärend. Lange Hilfen stehen in einem eigenen Hilfebereich.
- Fotos sind ein Hauptbestandteil der Profile. Sie dürfen weder abgeschnitten noch durch unpassende Containerformate, Hintergrundstreifen oder überlagerte Bilder verfälscht erscheinen.
- Kein Zoom der ganzen Seite auf Mobilgeräten. Die Foto-Bedienung ist davon getrennt und darf die Oberfläche nicht versehentlich verschieben.

## Navigation und Layout

- Desktop: feste linke Hauptnavigation; Konto-/Einstellungszugang unten.
- Mobil: Navigation am unteren Bildschirmrand; Inhalt bleibt innerhalb der Viewport-Breite.
- Navigation bleibt verfügbar, wenn Profile betrachtet oder bearbeitet werden. Ein Wechsel zwischen Übersicht, Profil und anderen Bereichen ersetzt die Ansicht vollständig.
- Nach der neutralen Anmeldung führt der Einstieg ins Dashboard. Ist noch kein Profil angelegt, beginnt dort zuerst die Rollenwahl und danach das rollenabhängige Onboarding. Das vollständige Dashboard wird erst nach Profilabschluss freigeschaltet.
- Der erste Dashboard-Schritt bei fehlendem Profil ist die Profilerstellung. Nach Abschluss steht das eigene Profil mit der Galerie als zentrale Ansicht im Dashboard.

## Profile und Fotos

### Profilansicht

- Der vollständige Profilinhalt wird in einer Ansicht gezeigt; es gibt keine separate Highlight-Vorschau gegenüber einer versteckten Detailansicht.
- Fotografenname und relevante Kurzinfos sind geordnet beim Profilinhalt platziert. Vergütung und Erfahrung sind gut auffindbar.
- Ein vorhandener Instagram- oder Website-Link wird als gleich großes, rechtsbündig eingeordnetes Symbol in der Informationszeile angezeigt.
- Die Galerie bleibt responsiv, mittig und ohne abgeschnittene Ränder. Anzahl und aktuelle Bildposition liegen dezent innerhalb des Bildbereichs.
- Bei Bedarf öffnet ein kleiner Vollbildknopf die Galerie. Im Vollbild wird das Original so groß wie möglich dargestellt, ohne Verzerrung oder Beschnitt; Navigation und Bildzähler bleiben am sichtbaren Foto ausgerichtet. Ein klares Schließen-Symbol führt zurück.

### Fotografengalerie

- Bis zu 20 reguläre Galeriefotos, ohne Highlight-Markierung oder Stern.
- Die Fotos werden in einer konsistenten Galerie angeordnet; beim Hochladen kann jedes Foto zugeschnitten und ausgerichtet werden.
- JPG, PNG und WebP; die angestrebte Grenze beträgt 2 MB je Fotografenfoto. Alte Texte oder UI mit Highlight-Anforderungen sind kein aktueller Produktstandard.
- Vorhandene Fotos bleiben beim weiteren Upload sichtbar; Fotos können zugeschnitten und mit einem gestalteten Bestätigungsdialog gelöscht werden.

### Hochzeitspaarfotos

- Ein gemeinsames Foto genügt; alternativ kann für jede Person ein eigenes Foto hochgeladen werden.
- Jedes Bild lässt sich vor der Speicherung zuschneiden und ausrichten. Das Ergebnis und der sichtbare Ausschnitt müssen der späteren Darstellung entsprechen.
- Für Einzel- und gemeinsame Fotos werden verständliche Upload-Fehler angezeigt.

### Profilfoto des Kontos

- Ein separates Foto für das Konto wird über das Profilbild-Icon rechts oben verwaltet.
- Hinzufügen und Ausrichten geschehen in einem gestalteten Dialog mit kreisförmiger Vorschau. Ein Klick auf das Foto öffnet den Ausrichtungsdialog. Löschen erfolgt über ein Papierkorb-Symbol und ein kurzes Bestätigungs-Popup.
- Uploadfehler nennen den Grund. Vergrößern, Verkleinern, Drehen, Abbrechen und Übernehmen müssen sichtbar aktiv wirken.

## Eingaben und Onboarding

- Die Registrierung fragt keine Rolle ab. Die Rollenwahl ist der erste Onboarding-Schritt nach dem Login.
- Hochzeits- und Fotografenformulare speichern Zwischenschritte; Profiländerungen sollen automatisch gespeichert werden.
- Zurück-Navigation zwischen den Einrichtungsschritten bleibt vorhanden.
- Fotografen: Einsatzgebiete sind strukturierte Mehrfachauswahl (Bundesländer oder Ganz Österreich), Erfahrung in Jahren und/oder Zahl der Hochzeiten, Stil als Auswahl inklusive Boho, Umfang als Auswahl, Vergütung Unentgeltlich oder Fixbetrag. Website und Instagram sind optional. Verfügbarkeit und separate Zusatzvergütung für Nutzungsrechte werden nicht abgefragt.
- Hochzeitspaar: Vornamen beider Personen, Datum, Ort/Region, Gästezahl, Ablauf, gewünschter Begleitungsumfang, Stil, Bildwünsche und Foto beider Personen.
- Profilabschluss ist erforderlich, bevor Entdecken oder Matching-Funktionen benutzbar sind.

## Interaktionsqualität und Barrierefreiheit

- Klickbare Elemente sehen aktiv aus; deaktivierte Navigation kommuniziert verständlich, wann sie verfügbar wird.
- Alle Foto-Aktionen haben zugängliche Namen und ausreichende Trefferflächen, besonders auf Mobilgeräten.
- Fokuszustände sind sichtbar; Fehler stehen nahe an der betroffenen Eingabe.
- Animationen sind ruhig und respektieren `prefers-reduced-motion`.
- Keine Browser-Standardbestätigung für destruktive Aktionen, wenn dafür ein WedConnect-Dialog vorgesehen ist.

## Änderungsregel

Eine konkrete Nutzeranweisung ist erforderlich, um freigegebene App-Ansichten, Formulierungen, Bilddarstellungen oder Abläufe zu ändern. Wird im Code eine Abweichung gefunden, kommt sie zunächst in den Implementierungsstatus. Sie wird nicht dadurch zum neuen Soll, dass sie im Code existiert.
