# WedConnect · App Design Bible

**Version:** 1.0  
**Stand:** 14. Oktober 2026  
**Status:** Gestaltungsreferenz für die eingeloggte App  
**Code-Baseline:** `5ecfad72804a597b01cbca9e9133606175f7d38b`  
**Geltungsbereich:** Dashboard, Profil-Onboarding und -bearbeitung, Account-Bereich, Profilgalerie und Profilansicht

Diese Bible dokumentiert die Gestaltung der App. Sie ergänzt die [öffentliche Design Bible](DESIGN-BIBLE.md), die öffentlichen Website-Seiten und deren eingefrorene Inhalte bleiben davon getrennt. Die [Project Bible v1.3](PROJECT-BIBLE-v1.3.md) bestimmt Produktregeln. Die [Referenzmodule](REFERENCE-MODULES-v1.0.md) beschreiben den konkreten Stand der Code-Baseline. Diese Bible allein ändert weder Produkt noch Code.

## 1. Gestaltungsziel

Die App führt Hochzeitspaare und Fotografen durch wenige klare Schritte. Sie soll hochwertig, ruhig, bildorientiert und selbsterklärend sein. Das Designsystem heißt **Pairing · Dark Editorial · Gold**.

- Dunkle Flächen schaffen Ruhe und lenken den Blick auf Bilder und Entscheidungen.
- Gold kennzeichnet zentrale Aktionen, aktive Auswahl und den Gedanken der Verbindung.
- Fotografien sind im öffentlichen Profil das zentrale Element.
- Formulare zeigen nur die nächste sinnvolle Aufgabe und vermeiden lange Erklärtexte.
- Fehler, Ladezustände und gesperrte Bereiche werden eindeutig benannt.
- Hochzeitsromantik entsteht durch echte Bilder und den Anlass, nicht durch dekorative Klischees.

## 2. Visuelle Grundlagen

Die App übernimmt die bestätigten Pairing-Tokens aus der Designreferenz.

| Token | Wert | Verwendung |
|---|---|---|
| Hintergrund | `#25242B` | Hauptfläche |
| Sekundärfläche | `#2B2A31` | Seitenleiste und Navigation |
| Kartenfläche | `#302F38` | Karten, Formulare und Dialoge |
| Erhöhte Fläche | `#34323A` | Infobereiche und sekundäre Elemente |
| Hoverfläche | `#3C3943` | Hover und ausgewählte Chips |
| Primärtext | `#F5F2EC` | Titel und wichtiger Text |
| Fließtext | `#E3DFE2` | Hauptinhalt |
| Metadaten | `#C2BDC3` | unterstützende Angaben |
| Gold | `#D5B67A` | Primäraktion und aktiver Zustand |
| Goldtext auf Gold | `#29262B` | Text auf Goldflächen |
| Rahmen | `#514E59` | Karten, Felder und Trennlinien |

**Schrift:** Manrope für UI und Fließtext; IBM Plex Mono nur für kurze Eyebrows, technische Labels und kompakte Statuscodes.  
**Formen:** Primärbuttons Radius 8 px, Eingabefelder 12 px, Karten üblicherweise 14–18 px. Keine pillenförmigen Primärbuttons.  
**Flächen:** Schatten sparsam und nur zur Ebenentrennung. Keine weißen Popup-Flächen als Standard.  
**Lesbarkeit:** Fließtext mobil mindestens 16 px; Metadaten sind zurückhaltend, aber lesbar. Inaktive Steuerelemente müssen weiterhin klar als solche erkennbar sein.

## 3. App-Rahmen und Navigation

### Desktop und große Tablets

- Feste Seitenleiste links, im aktuellen Code 248 px breit.
- WedConnect-Wortmarke oben, Bereich/Rolle darunter und Hauptnavigation anschließend.
- Kontoaktionen wie Einstellungen und Abmelden am unteren Ende der Seitenleiste.
- Arbeitsbereich mit eigener oberer Leiste und begrenzter Inhaltsbreite.
- Inhalte bleiben in Grid- und Flexlayouts innerhalb ihres Containers; keine horizontale Seitenüberbreite.

### Mobile

- Seitenleiste wird ausgeblendet.
- Kompakte obere Leiste mit Wortmarke und Accountzugang.
- Hauptnavigation sitzt als feste untere Navigation mit sicherem Abstand zum Systemrand.
- Der Hauptinhalt erhält links und rechts sichtbaren Außenabstand.
- Die Galerie wird nicht durch seitlich abgeschnittene Karten oder horizontales Seiten-Overflow dargestellt.
- Beim Wechsel eines Menüpunktes wird der vorherige Arbeitsbereich wirklich ersetzt. Alte Ansichten dürfen nicht im Hintergrund stehen bleiben.

Der aktuelle Code wechselt bei 720 px auf die mobile Navigation. Andere Breakpoints sind komponentenabhängig; Zwischenbreiten müssen mitgeprüft werden. Das Dashboard setzt im aktuellen Stand im Viewport-Meta-Tag eine nicht zoomfähige Ansicht. Das ist dokumentierter Codezustand, keine allgemeine Vorgabe für neue oder andere Seiten.

## 4. Login, Ladezustand und Freischaltung

Anmeldung und Registrierung sind für alle Personen gleich und fragen keine Rolle ab. Nach erfolgreicher Authentifizierung wird das Dashboard geöffnet.

- Während Sitzungs- und Profildaten geladen werden, erscheint eine eigene WedConnect-Ladeansicht.
- Die Wortmarke und das zentrale Verbindungsmotiv dürfen ruhig animiert sein. Die Animation vermittelt Fortschritt und blockiert nicht zusätzlich.
- `prefers-reduced-motion` reduziert nicht notwendige Bewegung.
- Ohne Sitzung wird der Login angeboten.
- Ohne Rolle beginnt die Profilerstellung mit der Auswahl **Hochzeitspaar** oder **Fotograf**.
- Ein unvollständiges Profil setzt den Assistenten beim offenen Profil fort.
- Das vollständige Dashboard und Entdecken bleiben bis zum Profilabschluss gesperrt.
- Bei Lade- oder Supabase-Fehlern erscheint eine klare Fehlermeldung mit einem passenden nächsten Schritt.

Die Rolle wird erst nach Login im Profilstart festgelegt. Die ältere Projektbibel v1.0 enthält eine Rollenfrage in der Registrierung; diese alte Regel ist aufgehoben.

## 5. Dashboard-Start

Das Dashboard soll den nächsten konkreten Schritt sichtbar machen, nicht mit Produkttext überladen.

- Bei unvollständigem Profil steht **Profil vervollständigen** als erste Aufgabe im Mittelpunkt.
- Nach vollständigem Profil zeigt die Startansicht das eigene öffentliche Profil in seiner tatsächlichen Darstellungsform.
- Fotografen werden mit ihrem Vornamen begrüßt.
- Die Hauptnavigation bleibt sichtbar und verständlich.
- Nicht verfügbare Bereiche können als vorbereitet oder gesperrt gekennzeichnet werden. Ein Menüpunkt behauptet nicht, dass Matching oder Nachrichten bereits produktiv sind.
- Konto und Einstellungen bündeln persönliche Daten, Profilverwaltung, Profilfoto und Rollenwechsel.

Lange Hilfe- und Erklärungstexte gehören in einen separaten Hilfebereich, nicht in die Dashboard-Startfläche.

## 6. Profil-Onboarding und Bearbeitung

Nach der Rollenwahl führt ein kompakter, rollenabhängiger Assistent durch vier Seiten: **Basisangaben**, **Details**, **Fotos**, **Prüfen und abschließen**.

- Fortschritt ist sichtbar und benennt den aktuellen Schritt.
- Ein Zurück-Button führt zum vorherigen Schritt.
- Pflichtfelder und Auswahlfelder sind klar unterscheidbar.
- Auswahlen wie Bundesländer, Bildstil und Begleitungsumfang erscheinen als strukturierte, gut antippbare Optionen.
- Änderungen an bestehenden Profilen speichern automatisch.
- Beim Verlassen des Profilmenüs erscheint keine unnötige Warnung vor ungespeicherten Änderungen.
- Ein Rollenwechsel liegt im Account-Bereich, nicht wiederholt auf jeder Profilkarte.
- Die gespeicherten Daten der jeweils anderen Rolle dürfen nicht ohne geklärte Regel als gelöscht oder übernommen dargestellt werden.

### Hochzeitspaar

Das Formular fragt die Vornamen beider heiratenden Personen und die für die Vermittlung relevanten Hochzeitsdaten ab. Beide Personen müssen in den Profilfotos gemeinsam oder jeweils einzeln vorkommen. Eingaben und Bildauswahl bleiben mobil gut bedienbar.

### Fotograf

Das Formular umfasst Vorname, Regionen, Erfahrung, Bildstil, gewünschten Begleitungsumfang, Vergütung, optionale Social-Links, Vorstellungstext und Galerie. Verfügbarkeit ist kein Profilfeld. Instagram und Website erscheinen im öffentlichen Profil nur als passende kleine Symbole, sofern Adressen vorhanden sind.

## 7. Fotos, Galerie und Profilansicht

### Galerie im Profil

- Es gibt eine Galerie mit bis zu **20 normalen, gleichwertigen Fotos**.
- Mindestens 3 Portfoliofotos sind für den Fotografen-Profilabschluss vorgesehen.
- Es gibt keine Highlight-Fotos und keine produktseitige Highlight-Auswahl.
- Hochgeladene Bilder bleiben auch beim Hinzufügen weiterer Fotos sichtbar.
- Bildreihenfolge und ausgewähltes Foto sind in der Verwaltung klar erkennbar.
- Zuschneiden, Drehen und Löschen sind als kompakte, verständliche Aktionen angeordnet.
- Löschen verwendet ein gestaltetes Bestätigungsdialogfeld statt des nativen Browserdialogs.
- JPG/JPEG, PNG und WebP; Portfoliofotos maximal 2 MB pro Bild.
- Bildunterschriften, die keinen zusätzlichen Informationswert liefern, werden nicht angezeigt.

### Profilansicht

- Die Galerie steht im Mittelpunkt und bleibt vollständig innerhalb des Profilrahmens.
- Die Bildfläche passt sich an das Foto an; keine darunter sichtbaren Ersatzflächen oder doppelt gestapelten Bilder.
- Name und Rolle stehen oberhalb der Galerie. Erfahrung und Vergütung liegen unter dem Namen; vorhandene Website- und Instagram-Symbole stehen in derselben Metadatenzeile.
- Der Bildzähler ist dezent auf dem Foto platziert. Er ist mittig zur sichtbaren Bildfläche ausgerichtet und verdeckt keine wichtigen Bilddetails.
- Fotos lassen sich in der Galerie wechseln. Für Vollbild wird das Bild so groß wie möglich mit `contain` dargestellt, ohne Verzerrung oder Beschnitt. Ein gut erreichbares X schließt die Ansicht.
- In der normalen Profilansicht gibt es keine Vollbild- oder Querformatdarstellung durch bloßes Drehen des Telefons. Der Vollbildmodus darf die Bildschirmdrehung nutzen.
- Like/Dislike-Aktionen liegen mittig unter dem Bild. Die Anzeige eines erwiderten Likes soll verständlich, aber unaufdringlich sein.
- Die Profilansicht ist eine vollständige erkundbare Ansicht; sie ist keine Kurzvorschau mit separater Detailseite.

### Profilfoto im Account

Das eigene Profilfoto wird getrennt von der Portfolio-Galerie im Account-Bereich hinzugefügt. Ein Dialog erlaubt Upload, kreisförmigen Zuschnitt, Zoom, Drehung, Abbruch und Übernahme des Zuschnitts. Der Nutzer kann das Foto durch Klick zur erneuten Ausrichtung öffnen und über ein Papierkorb-Icon mit gestalteter Bestätigung löschen. Fehler zeigen den Grund des Uploadproblems.

### Bekannte Abweichung in der eingefrorenen Code-Baseline

Die Produktentscheidung lautet: **keine Highlights**. Das Dashboard-JavaScript der Baseline enthält keine Highlight-Auswahl- oder Anzeigelogik. Im HTML stehen noch nicht verwendete CSS-Selektoren für Stern-Buttons und Highlight-Badges; eine ältere Migration bewahrt zusätzlich ein Datenbankfeld. Diese technischen Reste sind keine Produktfunktion und werden hier nicht als gewünschtes Gestaltungselement geführt. Der eingefrorene Produktcode wurde bei der Dokumentationsarbeit nicht geändert. Eine Bereinigung der Reste wäre ein eigener Produktfix.

## 8. Texte und Bedienzustände

- UI-Texte sind kurz, direkt und selbsterklärend.
- Pro Ansicht gibt es eine klare Hauptaktion.
- Labels benennen das Feld, Hilfetext erklärt nur tatsächlich unklare Anforderungen.
- Fehlermeldungen sagen, was fehlgeschlagen ist und was die Person als Nächstes tun kann.
- Dialogaktionen verwenden konkrete Verben, z. B. „Abbrechen“, „Foto löschen“ oder „Zuschnitt übernehmen“.
- Erfolgs- und Ladezustände ersetzen keine dauerhafte Rückmeldung bei wichtigen Änderungen.

Jede zentrale Komponente hat erkennbare Zustände für Standard, Hover, Fokus, Aktiv, Deaktiviert, Laden, Erfolg und Fehler. Status wird nicht ausschließlich durch Farbe vermittelt.

## 9. Responsive Gestaltung und Barrierefreiheit

- Mindestens schmale Mobile-, breite Mobile-, Tablet- und Desktopansicht prüfen.
- Auch Ansichten direkt ober- und unterhalb der Breakpoints testen.
- Kein abgeschnittener Inhalt, kein horizontaler Overflow und keine überlappenden Navigationen.
- Touchziele sind mindestens 44 × 44 px; primäre mobile Buttons mindestens 50 px hoch.
- Tastaturfokus ist deutlich sichtbar.
- Bilder erhalten passende Alt-Texte, Bedienelemente verständliche zugängliche Namen.
- Bewegungen respektieren `prefers-reduced-motion`.
- Browser-Zoom nicht für neue Oberflächen deaktivieren; bestehende globale Einschränkung bleibt als technische Abweichung dokumentiert, bis sie separat geprüft wird.

## 10. Status und Pflege

Diese Version ist eine Gestaltungsreferenz und kein Nachweis einer vollständigen visuellen oder funktionalen Abnahme. Der dokumentierte Browser-Check deckt bisher öffentliche Seiten und den nicht angemeldeten Dashboard-Einstieg ab. Die eingeloggten App-Ansichten müssen mit neutralen Testdaten in den relevanten Viewports als Screenshot- und Testmatrix ergänzt werden.

Bei Konflikten gilt:

1. Die [Project Bible](PROJECT-BIBLE-v1.3.md) bestimmt bestätigte Produktregeln.
2. Diese App Design Bible bestimmt die Gestaltungsregeln der eingeloggten App.
3. Die [Referenzmodule](REFERENCE-MODULES-v1.0.md) halten den belegten Code- und Prüfstand fest.
4. Die [Change-Control-Regeln](CHANGE-CONTROL.md) schützen den eingefrorenen Produktcode.

Änderungen an Texten, Layouts, Verhalten oder Assets brauchen einen ausdrücklichen Auftrag und werden mit Commit, betroffenen Viewports sowie Testergebnis dokumentiert.
