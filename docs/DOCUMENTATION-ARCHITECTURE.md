# WedConnect · Dokumentationsstruktur und spätere Automationen

**Ziel:** eine belastbare, modulare Projektdokumentation, ohne den eingefrorenen Produktstand zu verändern.

## Dokumentationsprinzip

Eine große Bibel wird schnell widersprüchlich. Viele kleine Bibles ohne klare Zuständigkeit ebenfalls. Empfohlen wird ein kurzer Index und eine überschaubare Reihe spezialisierter Dokumente. Jede Regel bekommt genau eine zuständige Quelle; andere Dateien verweisen auf sie.

## Vorgeschlagene Quellen

| Dokument | Zuständigkeit | Ausgangslage |
|---|---|---|
| Projektstatus und Baseline | Commit, Deployment, vorhandene Funktionen, bekannte Lücken | Mit `FROZEN-BASELINE-2026-10-14.md` begonnen |
| Product Bible | Zielgruppe, Rollen, Regeln, Profilfelder, Matching, Rechte, Freigaben | Vorhandene Projektbibeln zusammenführen und Widersprüche markieren |
| Public Website Design Bible | Farben, Typografie, Raster, Komponenten der öffentlichen Seiten | Bestehend: `docs/DESIGN-BIBLE.md` |
| App Design Bible | Dashboard, Onboarding, Account, Dialoge, Uploads und mobile Zustände | Neu erstellen; aktuelle App zuerst dokumentieren, nicht umbauen |
| Brand Voice & Content Bible | Schreibstil, Begriffe, Tonalität, UI-Wörter, CTA und exakte Seitentexte | Neu erstellen; Seiteninhalte aus dem eingefrorenen Commit übernehmen |
| UX- und Ablaufkatalog | Login, Profilanlage, Bearbeitung, Fotos, Rollenwechsel und Fehlerzustände | Aus den tatsächlich implementierten Abläufen ableiten |
| Technical Architecture & Data Dictionary | Auth, Tabellen, RLS, Storage, SQL-Migrationen, Redirects und Grenzen | Bestehende Migrationen und Supabase-Anleitungen als Grundlage |
| Asset- und Icon-Katalog | Logos, Illustrationen, Bilder, Inline-SVGs, Lizenz, Einsatz und Dateiformat | Inventar fehlt; noch keine Assets verschieben oder ersetzen |
| Änderungsprotokoll | Auftrag, betroffene Oberfläche, Commit, Test und Deployment | Ab dieser Baseline für jede freigegebene Änderung führen |

## GitHub als dauerhafte Quelle

Ja: Projektcode und Projektdokumente gehören gemeinsam in GitHub. So sind Inhalt, Änderungen und technische Umsetzung an Commits gebunden. Die Baseline wird über einen unveränderlichen Commit und künftig zusätzlich über einen Release-Tag referenziert. Der Baseline-Commit darf nicht überschrieben werden.

Empfohlener Ablauf nach Freigabe:

- `main` ist der geschützte, produktive Stand.
- Jede beauftragte Änderung beginnt auf einem Branch.
- Änderungen werden erst nach Vergleich, Test und Dokumentationsupdate in `main` übernommen.
- Production-Deployments werden dem Commit zugeordnet.
- Ein Versions- oder Release-Eintrag verweist auf passende Projekt-, Design- und Content-Versionen.

Branch Protection, Releases und eine Änderung des Deployment-Ablaufs sind Repository-/Hosting-Einstellungen. Sie sind Empfehlungen und werden nicht im Rahmen dieser Dokumentationsaufnahme verändert.

## SVG- und Icon-Strategie

Im aktuellen Repository liegt kein vollständiger Katalog unter `assets/icons/`; zahlreiche UI-Symbole sind Inline-SVG. Das ist als aktueller Zustand zu dokumentieren, nicht sofort zu refaktorieren.

Für eine spätere, ausdrücklich freigegebene Ordnung erfassen wir:

- WedConnect-Wortmarke und Logo als eigenständige Vektorquelle, falls vorhanden
- Navigation und Account-Aktionen
- Like, Zurück, Schließen, Löschen, Zuschneiden, Vollbild und Status
- Social-Links und externe Verweise
- öffentliche Website-Illustrationen getrennt von funktionalen Icons
- Herkunft, Lizenz, ViewBox, Strichstärke, Farbe, Größe und zugänglicher Name
- ob ein SVG inline bleiben muss (Zustands-/Farbänderung) oder als Datei verwendet werden kann

Es werden keine bestehenden Inline-SVGs verschoben, ersetzt oder neu gestaltet, solange kein konkreter Icon-Auftrag vorliegt.

## Kundenfeedback und FAQ-Automation

Eine spätere Automatisierung soll FAQ-Vorschläge vorbereiten, nicht ungeprüft veröffentlichen:

1. Feedback kommt über einen festgelegten Kanal mit Einwilligung und Zweckhinweis.
2. Personenbezogene Daten werden vor Analyse minimiert oder anonymisiert.
3. Rückmeldungen werden nach Thema und Häufigkeit gruppiert.
4. Das System erstellt einen **Entwurf** mit Belegstellen aus wiederkehrendem Feedback und markiert Unsicherheit oder Widersprüche.
5. Eine zuständige Person prüft Inhalt, Datenschutz, rechtliche Aussagen und Tonalität.
6. Erst nach manueller Freigabe wird ein FAQ-Eintrag veröffentlicht.
7. FAQ-Einträge erhalten Version, Freigabedatum, Quelle und Änderungsverlauf.

Automatische Veröffentlichung, das ungeprüfte Trainieren mit Kundeninhalten oder die Übernahme personenbezogener Details sind nicht Teil des Vorschlags. Vor einer Umsetzung müssen Datenquelle, Einwilligung, Aufbewahrung, Zugriff, Löschung und technische Kosten geklärt werden.

## Nächste Dokumentationsschritte

1. Diesen Baseline-Snapshot samt bekannter offener Punkte fertigstellen.
2. Screenshot-Matrix und Inhaltsinventar aufnehmen.
3. App Design Bible aus dem Live-Code und tatsächlichen Ansichten dokumentieren.
4. Brand Voice & Content Bible mit den exakten aktuellen Texten erstellen.
5. Product Bible gegen Code und Nutzerentscheidungen abgleichen; veraltete Aussagen als ersetzt kennzeichnen.
6. Migrationen, Supabase Storage und Policies inventarisieren.
7. Icons und Illustrationen katalogisieren, ohne sie zu verändern.
8. Erst danach Automationen planen; die Produkt-Baseline bleibt bis zu einem ausdrücklichen Auftrag unangetastet.
