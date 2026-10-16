# WedConnect · Project Bible

**Version:** 2.6  
**Stand:** 16. Oktober 2026  
**Status:** maßgebliche Produkt- und Projektentscheidungen

## Zweck und Vorrang

Diese Bible hält fest, was WedConnect ist und welche Produktentscheidungen gelten. Sie beschreibt nicht automatisch, was im Code bereits fertig ist. Dafür ist [`IMPLEMENTATION-STATUS.md`](IMPLEMENTATION-STATUS.md) maßgeblich. Die [`IDEAS-BIBLE.md`](IDEAS-BIBLE.md) enthält ausdrücklich unverbindliche Vorschläge.

Bei Änderungen an eingefrorenen Bereichen braucht es eine ausdrückliche Anweisung von Ali. Brainstorming, technische Dokumentation oder eine Änderung an einer anderen Seite gelten nicht als Freigabe.

## Produkt

WedConnect verbindet Hochzeitspaare mit Fotografen für mögliche TFP-Zusammenarbeiten. Beide Seiten sehen passende Profile und entscheiden selbst, ob sie Interesse zeigen. Ein beidseitiges Interesse ist ein Match und eröffnet ein Gespräch; es ist keine Buchungszusage. Umfang, Gegenleistung, Lieferung und Nutzungsrechte werden vor einer Zusammenarbeit ausdrücklich vereinbart.

## Öffentliche Website

- `fotografen.html` ist der eingefrorene Designmaster der öffentlichen Website. Ohne ausdrückliche Freigabe wird diese Seite nicht verändert.
- `index.html` und `hochzeitspaare.html` übernehmen das freigegebene visuelle System. Ihre Texte sind noch nicht final und dürfen später inhaltlich überarbeitet werden.
- Die aktuelle maßgebliche Spezifikation für die öffentliche Website ist [`DESIGN-BIBLE.md`](DESIGN-BIBLE.md), Version 2.3.
- Dashboard und eingeloggte App haben einen eigenen Standard in [`APP-DESIGN-BIBLE.md`](APP-DESIGN-BIBLE.md).

## Anmeldung, Rollen und Freischaltung

1. Anmeldung und Registrierung sind für alle gleich und rollenfrei. E-Mail/Passwort und Google nutzen denselben Einstieg.
2. Nach erfolgreicher Anmeldung geht es ins Dashboard.
3. Bei der ersten Profilerstellung wählt die Person dort **Hochzeitspaar** oder **Fotograf**.
4. Anschließend wird das passende Profil erstellt. Entdecken, Likes/Interesse, Matches und Nachrichten dürfen erst nach vollständigem Profil freigeschaltet werden.

Die Rolle gehört zum WedConnect-Profil, nicht zum Anmeldeformular. Ein Rollenwechsel darf nicht stillschweigend Informationen des jeweils anderen Rollenprofils vernichten. Der gewünschte Umgang mit gleichzeitig vorhandenen Profilen ist vor einer Änderung an Datenmodell oder Oberfläche gesondert festzulegen.

## Entdecken, Interesse und Matches

- Nach vollständigem Profil können Nutzer:innen vollständige Profile der jeweils anderen Rolle entdecken.
- „Interesse zeigen“ speichert ein Like. Ein Match entsteht erst bei gegenseitigem Interesse.
- „Überspringen“ blendet ein Profil künftig nur für das eigene Konto aus. Die Entscheidung ist privat und benachrichtigt die andere Person nicht.
- Bereits gelikte, gegenseitig gelikte oder übersprungene Profile erscheinen nicht erneut im Discover-Feed. Eingegangene Likes werden in der Übersicht beantwortet.

## Profile

### Hochzeitspaar

Erfasst werden die Vornamen beider heiratenden Personen, Hochzeitsdatum, Bundesland, Ort der Hochzeit, optionale Location der Trauung, optionale Location der Feier und ungefähre Gästezahl, Art der Trauung (standesamtlich, kirchlich oder frei), gewünschter Begleitungsumfang, ein geführter Tagesablauf mit auswählbaren Programmpunkten, ungefähren Uhrzeiten und optionalen Hinweisen sowie die Haltung zur Nutzung der entstandenen Bilder durch den Fotografen. Ein Bildstil und separate Bildwünsche werden im Paarprofil nicht abgefragt.

Beide Personen müssen jeweils mindestens ein eigenes Foto hochladen. Ein gemeinsames Foto kann zusätzlich hochgeladen werden, ersetzt aber keines der beiden Personenfotos. Nach Auswahl wird der Zuschnitt bestätigt und das Foto direkt hochgeladen. Original und angezeigte Fassung werden getrennt behandelt.

### Fotograf

Erfasst werden Vorname, Einsatzgebiet in Österreich (mehrere Bundesländer oder ganz Österreich), Erfahrung in Jahren und/oder Anzahl fotografierter Hochzeiten, Bildstil (einschließlich Boho), gewünschter Begleitungsumfang, persönliche Vorstellung, Galerie und Vergütungswunsch. Instagram und Website sind optional.

Der Begleitungsumfang beschreibt Hochzeitsabschnitte und Reportageformate, die der Fotograf für sein Portfolio gerne umsetzen möchte. Eine Verfügbarkeitsabfrage ist nicht Bestandteil des Fotografenprofils.

Der Vergütungswunsch für die fotografische Leistung hat nur die Optionen **Unentgeltlich** und **Fixbetrag** (mit Betrag). Ein separates Feld für zusätzliche Vergütung der Nutzungsrechte ist nicht vorgesehen.

Die Galerie besteht aus bis zu 20 normalen Fotos. Es gibt keine Highlight-Auswahl oder Stern-Markierung. Fotos können zugeschnitten, ausgerichtet, angesehen und gelöscht werden. Mindestanforderungen für den Profilabschluss sind in Oberfläche und Datenbank konsistent zu halten.

### Ansprache und Vorstellung

Alle beteiligten Personen werden im Produkt mit Vornamen angesprochen. Profile enthalten eine persönliche Vorstellung, sofern das jeweilige Onboarding sie vorsieht. Kontaktdaten und soziale Links bleiben optional und werden nur als passende Symbole angezeigt, wenn sie hinterlegt sind.

## Entdecken, Interesse und Kommunikation

- Paaren werden Fotografenprofile gezeigt; Fotografen sehen Hochzeitsprofile.
- Fotos stehen im Mittelpunkt des öffentlichen Profils. Details sind darunter übersichtlich angeordnet.
- Interesse ist keine Buchung. Nur beidseitiges Interesse erzeugt ein Match.
- Nach einem Match können die Beteiligten offene Fragen zu Ablauf, Umfang, Vergütung, Lieferung und Bildrechten klären.

Matching, Like-Status, Chat und Benachrichtigungen gelten erst dann als umgesetzt, wenn der aktuelle Implementierungsstand sowohl die Oberfläche als auch die Datenflüsse bestätigt.

## Übersicht und E-Mail-Benachrichtigungen

Die Übersicht ist der Startbildschirm nach dem Login. Sie zeigt offene eingegangene Likes, gegenseitige Matches ohne erste Nachricht und, sofern vorhanden, rollenbezogene App-Neuigkeiten sowie klar gekennzeichnete Partnerangebote. Inhalte ohne aktuelle Einträge werden nicht angezeigt. Der Menüpunkt „Profil“ bleibt die vollständige eigene Profilansicht; „Matches“ enthält gegenseitige Likes.

Nutzer:innen steuern in den Einstellungen pro Ereignis, ob WedConnect E-Mails zu Likes, Matches, Nachrichten, App-Neuigkeiten und Partnerangeboten schicken darf. In-App-Hinweise bleiben davon unberührt. Wichtige Sicherheits- und Konto-E-Mails können weiterhin versendet werden.

## Konto und Hilfe

Der Bereich **Konto und Einstellungen** ist der erweiterbare Ort für Kontodaten, Profilfoto, Rollenverwaltung, Hilfe und spätere Einstellungen. Die Hauptnavigation bleibt während der Profilbearbeitung erreichbar. Erklärungen im Dashboard sind kurz und selbsterklärend; ausführliche Hilfetexte gehören in einen eigenen Hilfe-Bereich.

### Kontakt und Feedback

- Der Kontobereich bietet ausschließlich Chat mit dem WedConnect-Team. Push-Benachrichtigungen und Support-E-Mail-Versand sind nicht vorgesehen.
- Das Kontaktfenster bleibt bei jedem Einstieg sichtbar und fragt Art der Kontaktaufnahme, Betreff und Nachricht ab.
- Die drei Angaben werden gemeinsam in eine Chatnachricht übernommen und an die bestehende Support-Unterhaltung angehängt; nur beim ersten Kontakt wird ein Thread angelegt.
- Nach dem Absenden öffnet sich der Chat im normalen Nachrichtenbereich.
- Betreiber:innen beantworten Supportanfragen über einen geschützten Support-Eingang.
- Beim Löschen einer eigenen Chat-Nachricht für beide Seiten bleibt ein Löschhinweis an der ursprünglichen Position. Er steht rechts bei einer eigenen gesendeten Nachricht und links bei einer empfangenen Nachricht.

## Arbeits- und Änderungsregeln

- Vor einer Änderung zuerst den betroffenen Code und den Implementierungsstand prüfen.
- Bei einer Abweichung zwischen gewünschtem Stand und Code die Abweichung dokumentieren; nicht stillschweigend eine der beiden Quellen umdeuten.
- Eingefrorene Seite, Texte oder Interaktionen nur auf ausdrückliche Anweisung verändern.
- Neue Ideen bleiben in der Ideen-Bible, bis sie ausdrücklich entschieden und in diese Bible oder eine Design-Bible übernommen wurden.
- Zu jeder umgesetzten Funktionsänderung gehören ein aktualisierter Implementierungsstand und gegebenenfalls eine passende Migration.

## Dokumentenübersicht

| Dokument | Zuständigkeit |
|---|---|
| `PROJECT-BIBLE.md` | Produktregeln und verbindliche Entscheidungen |
| `DESIGN-BIBLE.md` | Eingefrorene öffentliche Website |
| `APP-DESIGN-BIBLE.md` | Design- und Interaktionsregeln der eingeloggten App |
| `IMPLEMENTATION-STATUS.md` | Code, Datenbank, Verifikation und Abweichungen |
| `IDEAS-BIBLE.md` | Unverbindliche Ideen |
| `START-HERE.md` | Übergabe und Einstieg in einen neuen Chat |
