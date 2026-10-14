# WedConnect · Eingefrorener Projektstand

**Stichtag:** 14. Oktober 2026  
**Status:** Referenz für den aktuellen Produktstand  
**Produktänderungen:** keine  
**GitHub-Repository:** `Supersheriff1/WedConnect_new`  
**Baseline-Commit:** `5ecfad72804a597b01cbca9e9133606175f7d38b`  
**Vercel-Deployment:** `dpl_8Uigy2ujUfmpBXcA66Tt86FbzKSs` · Production · READY  
**Deployment-URL:** https://wedconnect-396chv0kz-supersheriff1.vercel.app

Diese Datei hält fest, welcher Stand geschützt wird. Sie ist keine Freigabe, Inhalte, Design oder Verhalten zu ändern. Abweichungen brauchen einen ausdrücklichen Auftrag von Ali.

## 1. Was diese Baseline schützt

Der Referenzstand umfasst den gesamten im Repository enthaltenen Produkt- und Website-Stand:

- Texte, Gestaltung, Layout und Navigation der öffentlichen Seiten
- die Fotografen-Seite als zuvor eingefrorene Seite
- Anmeldung und Registrierung über E-Mail sowie Google
- rollenneutrale Anmeldung und die spätere Rollenwahl im Profilstart
- Dashboard, Profil-Onboarding und Account-Bereich
- Formulare, Validierungen, Dialoge, Uploads, Fotovorschau und Zuschnitt
- Animationen, responsive Darstellung und Zustände für Mobilgeräte
- vorhandene Datenbankmigrationen und die dafür vorgesehenen Supabase-Abläufe
- sämtliche Illustrationen, Bilder, SVGs und sonstigen statischen Dateien

Der Quellcode dieses Commits ist die maßgebliche technische Momentaufnahme. Die konkrete Darstellung wird zusätzlich durch Screenshots und Text-/Asset-Inventare ergänzt, wenn diese Dokumentationsarbeit fortgeführt wird.

## 2. Projektstruktur am Stichtag

Öffentliche Seiten:

- `index.html`
- `hochzeitspaare.html`
- `fotografen.html`

App:

- `dashboard.html`
- `assets/js/wedconnect-auth.js`
- `assets/js/wedconnect-dashboard.js`
- `assets/js/supabase-config.js`

Dokumentation:

- `docs/PROJECT-BIBLE.md`
- `docs/PROJECT-BIBLE-v1.1.md`
- `docs/PROJECT-BIBLE-v1.2.md`
- `docs/DESIGN-BIBLE.md`
- `supabase/README.md`

Visuelle Dateien liegen derzeit unter `assets/illustrations/`. Ein eigenes, vollständiges Icon-Verzeichnis ist im Repository noch nicht etabliert.

## 3. Funktionaler Stand

### Im aktuellen Stand enthalten

- Gemeinsamer Anmeldeweg ohne Rollenfrage beim Anmelden oder Registrieren.
- Nach dem Login führt der Weg zur Profilanlage im Dashboard.
- Die Person wählt dort zuerst Hochzeitspaar oder Fotograf.
- Der Profil-Assistent speichert Schritte und zeigt rollenabhängige Felder.
- Fotografenprofile enthalten unter anderem Einsatzgebiete, Erfahrung, Bildstil, Vergütung, optionale Social-Links, Vorstellungstext und Galerie.
- Die Galerie unterstützt bis zu 20 Fotos; 3 bis 5 davon können als Highlights markiert werden.
- Für Galerie- und Profilfotos bestehen Vorschau-, Lösch-, Anordnungs- oder Zuschnittabläufe je nach Oberfläche.
- Das persönliche Account-Profilfoto wird im Account-Bereich verwaltet. Der Zuschnitt ist rund; die Oberfläche zeigt unterstützte Formate und das 2-MB-Limit.
- Profilfoto-Fehler sollen im Dialog mit verständlichem Grund erscheinen. Dieser Uploadpfad braucht noch echte Tests mit mehreren Bildformaten und Größen.

### Noch nicht als produktiv bestätigt oder im Repository als nicht umgesetzt beschrieben

- Vollständiges Matching und Nachrichten/Chat.
- Produktive Suche mit echten, freigegebenen Profilen.
- Kundenfeedback-zu-FAQ-Automation.
- Vollständiges Icon- und SVG-Inventar.
- Fachlich geprüfte rechtliche Texte und Betriebsprozesse.

Eine Migration oder UI-Komponente im Repository bedeutet nicht automatisch, dass der komplette Ablauf produktiv, sicherheitsgeprüft oder durchgetestet ist. Solche Aussagen werden erst nach einem dokumentierten Test als bestätigt markiert.

## 4. Design- und Inhaltsspezifikationen

- `docs/DESIGN-BIBLE.md` ist der visuelle Standard für die öffentliche Website. Ihr eigener Geltungsbereich schließt Dashboard und eingeloggte App ausdrücklich aus.
- Das Dashboard besitzt einen separaten dunklen Pairing-Stil im Quellcode. Eine passende, eigenständige App-Design-Spezifikation ist noch zu dokumentieren.
- `docs/PROJECT-BIBLE.md` enthält Produktentscheidungen, aber einzelne Abschnitte beschreiben noch geplante Funktionen. Die Datei ist deshalb nicht allein ein Abbild der implementierten Funktionen.
- Die vom Projektinhaber bereitgestellten Bibeln `02-WedConnect-project-bible-v1.0.md` und `WedConnect-Design-Bible-v1.1.md` sind historische Projektquellen. Neuere Repository-Dokumente und der Baseline-Commit beschreiben spätere Entscheidungen.

Bei Konflikten gilt für den eingefrorenen Ist-Stand: Baseline-Commit und Deployment zeigen, was tatsächlich ausgeliefert ist. Produktentscheidungen und visuelle Regeln werden in den passenden, versionierten Spezifikationen gepflegt.

## 5. Bekannte offene Punkte am Stichtag

- Der Account-Profilfoto-Upload wurde zuletzt um verständlichere Fehlerzustände ergänzt. Es wurde berichtet, dass nicht jedes Bild erfolgreich hochgeladen wird. Der Ablauf gilt daher nicht als abschließend verifiziert.
- Originalfotos für spätere Avatar-Zuschnittänderungen werden zusätzlich gespeichert. Der Zusatzspeicher kann aufgrund von Storage-Berechtigungen scheitern; der sichtbare Avatar-Upload soll dann weiterhin funktionieren.
- Die automatische FAQ-Erstellung, Chat/Messaging und produktives Matching sind Ausbaupunkte, keine abgeschlossenen Funktionen.
- Icons liegen teils direkt als Inline-SVG im HTML oder JavaScript. Eine verbindliche Liste, Quelle und Lizenz aller Symbole muss noch erfasst werden.

Diese Punkte sind festgehalten, damit spätere Arbeiten sie gezielt aufnehmen. Die Baseline selbst ändert sie nicht.

## 6. Verifikation und spätere Snapshots

Für eine vollständige visuelle Sicherung ergänzen wir später Screenshots mindestens dieser Bereiche in schmaler mobiler, breiter mobiler, Tablet- und Desktopansicht:

1. Startseite
2. Hochzeitspaare-Seite
3. Fotografen-Seite
4. Anmeldung und Registrierung
5. Account-Popup und Profilfoto-Dialog
6. Rollenwahl und jedes Onboarding
7. Profilzusammenfassung und Dashboard-Start
8. Fehler-, Lade-, Leer- und Erfolgszustände

Jeder Snapshot erhält Datum, Viewport, URL, Commit und Deployment. Screenshots sind Vergleichsreferenzen; der Baseline-Code bleibt die vollständige, ausführbare Version.
