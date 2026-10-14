# WedConnect · Änderungs- und Freeze-Regeln

**Status:** verbindliche Arbeitsregel ab 14. Oktober 2026  
**Geschützt durch:** `docs/FROZEN-BASELINE-2026-10-14.md`

## Grundsatz

Der aktuelle Produktstand bleibt unverändert. Es werden keine Änderungen an Design, Texten, Verhalten, Navigation, Formularen, Daten oder Abläufen vorgenommen, bis Ali die jeweilige Änderung ausdrücklich beauftragt.

Ein Screenshot, eine Idee, ein Brainstorming oder eine Bitte um Einschätzung ist keine Freigabe zur Umsetzung. Ein klarer Auftrag wie „setz das um“, „ändere …“ oder „fixe …“ ist die Freigabe für genau diesen Umfang.

## Sicherer Änderungsablauf

1. Den aktuellen Baseline-Commit und das betroffene Deployment prüfen.
2. Den Auftrag einer konkreten Oberfläche und Funktion zuordnen.
3. Änderungen isoliert auf einem eigenen Branch ausführen. Die eingefrorene Fotografen-Seite bleibt unangetastet, sofern Ali sie nicht ausdrücklich einbezieht.
4. Nur den beauftragten Umfang ändern. Notwendige technische Anpassungen dürfen dazugehören, wenn sie für genau diesen Umfang erforderlich sind.
5. Vorher/Nachher mit den relevanten Viewports und dem betroffenen Ablauf prüfen.
6. Die zugehörige Spezifikation und Änderungsnotiz aktualisieren.
7. Ergebnis und Deployment zur Prüfung bereitstellen. Der geschützte Ausgangs-Commit bleibt erhalten.

## Änderungen an Daten und Supabase

- Migrationen bleiben versioniert, geordnet und nachvollziehbar.
- Bestehende Daten werden nicht stillschweigend gelöscht oder umgedeutet.
- Jede Migration wird vor Ausführung mit ihren Auswirkungen dokumentiert.
- Produktänderungen dürfen nicht ausschließlich durch eine UI-Sperre abgesichert werden, wenn dafür eine Server- oder Datenbankregel erforderlich ist.
- Zugangsdaten, Service-Role-Schlüssel und personenbezogene Daten gehören nicht in Git oder öffentliche Logs.

## Dokumentationsstatus

Jede Entscheidung und Funktion erhält einen Status:

- **Eingefroren:** Bestandteil der freigegebenen Baseline.
- **Live:** im Deployment vorhanden und praktisch getestet.
- **Implementiert, nicht vollständig getestet:** im Code vorhanden, aber Testbeleg fehlt.
- **Geplant:** entschieden, jedoch noch nicht umgesetzt.
- **Entwurf:** Idee oder Formulierung zur Diskussion, noch keine Entscheidung.
- **Ersetzt:** historisch, nicht mehr gültig; auf Nachfolger verweisen.

Texte und Produktregeln werden nicht mehrfach in verschiedenen Dokumenten unabhängig voneinander kopiert. Ein Dokument ist jeweils die zuständige Quelle; andere Dokumente verlinken darauf.
