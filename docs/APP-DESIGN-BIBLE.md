# WedConnect · App Design Bible

**Version:** 0.9  
**Stand:** 16. Oktober 2026  
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
- Der erste Dashboard-Schritt bei fehlendem Profil ist die Profilerstellung. Nach Abschluss startet die App in der Übersicht. Das eigene vollständige Profil liegt unter dem eigenen Menüpunkt „Profil“.

## Profile und Fotos

### Profilansicht

- Der vollständige Profilinhalt wird in einer Ansicht gezeigt. Fotograf:innen erhalten keine Highlight-Auswahl. Beim Hochzeitspaar stehen Hochzeitsdatum, Ort und Bildnutzungspräferenz als drei Key-Fact-Chips im selben Stil wie die Fotografen-Highlights.
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

- Jede Person muss mindestens ein eigenes Foto hochladen. Ein gemeinsames Foto ist optional und ersetzt keines der Personenfotos. Nach Auswahl und Zuschnittsbestätigung wird das Foto sofort hochgeladen.
- Paarfotos sind auf 2 MB je Original begrenzt; die Storage-Grenze wird ebenfalls auf 2 MB gesetzt.
- Namen erscheinen je nach Fotoart links unten als zugängliche, nicht in die Bilddatei eingebrannte Einblendung: bei Einzelbildern der jeweilige Vorname, bei gemeinsamen Fotos beide Vornamen.
- Jedes Bild lässt sich vor der Speicherung zuschneiden und ausrichten. Das Ergebnis und der sichtbare Ausschnitt müssen der späteren Darstellung entsprechen.
- Für Einzel- und gemeinsame Fotos werden verständliche Upload-Fehler angezeigt.

### Profilfoto des Kontos

- Ein separates Foto für das Konto wird über das Profilbild-Icon rechts oben verwaltet.
- Hinzufügen und Ausrichten geschehen in einem gestalteten Dialog mit kreisförmiger Vorschau. Ein Klick auf das Foto öffnet den Ausrichtungsdialog. Löschen erfolgt über ein Papierkorb-Symbol und ein kurzes Bestätigungs-Popup.
- Uploadfehler nennen den Grund. Vergrößern, Verkleinern, Drehen, Abbrechen und Übernehmen müssen sichtbar aktiv wirken.

## Konto-Menü und Unterseiten

Das Konto-Menü ist als Hauptansicht mit klaren Bereichen aufgebaut:

- **Profil:** Profilfoto, Profil bearbeiten und Rollenwechsel. Der Rollenwechsel liegt innerhalb dieses Profilbereichs und erfordert vor der Änderung eine ausdrückliche Bestätigung.
- **Entdecken & Profile:** Öffnet die Sortierkriterien direkt; eine zusätzliche Zwischenseite entfällt.
- **Angebote und Hilfe:** Partnerangebote sowie Kontakt / Feedback.
- **Konto verwalten:** Öffnet direkt die Einstellungen, ohne zusätzliche Zwischenseite.
- Im Kontokopf stehen der Profilname und die Rolle. Die Anmelde-E-Mail wird nicht im Menü wiederholt. Darunter zeigen kompakte Aktivitätswerte offene Likes, Matches und ungelesene Nachrichten.
- **Abmelden:** bleibt direkt im Hauptmenü.
- **Konto dauerhaft löschen:** bleibt als deutlich hervorgehobene Aktion in den Einstellungen.

Jede Unteransicht hat eine einheitlich positionierte Zurück-Aktion zur unmittelbar vorherigen Ansicht. „Zurück“ steht links oben, der Schließen-Button rechts oben; beide sind kontrastreich, gut erreichbar und haben ausreichend große Trefferflächen. Dialoge kehren zur passenden Konto-Unterseite zurück. Beim Wechsel eines Hauptmenüpunkts der App wird die neue Ansicht am Seitenanfang geöffnet; beim Wechsel der Konto-Unterseite beginnt deren Inhalt ebenfalls oben.

**Umsetzungsstatus:** Die gruppierte Kontonavigation, Zurück-Aktionen, direkte Einstellungen, Rollenwechsel-Bestätigung und Scroll-Reset sind im Dashboard-Code umgesetzt. Der Implementierungsstatus dokumentiert die Code- und Live-Prüfung.

## Übersicht, Matches und Benachrichtigungen
- Oben in „Matches“ schalten Tabs zwischen gegenseitigen Matches und erhaltenen, noch offenen Likes um; beide zeigen die Anzahl. Like-Antworten bleiben im Tab „Erhaltene Likes“ verfügbar. Hinweise und Leerzustände nutzen für Hochzeitspaare „ihr/euch“ und für Fotografen „du/dir“; als Rollenbezeichnung wird „Fotografen“ verwendet.
- Ein Klick auf die gesamte Match-Karte öffnet das Profil innerhalb des Dashboards. Like-/Dislike- und Chat-Aktionen bleiben separat; eine Zurück-Schaltfläche führt zur Liste.

- Die Übersicht ist der Startbildschirm nach dem Login. Sie ergänzt die Hauptnavigation und dupliziert nicht Profil-, Match- oder Nachrichtenlisten.
- In der Nachrichtenansicht zeigt jede Unterhaltung das Profilfoto des Gegenübers und die letzte Nachricht; ein Klick auf die gesamte Karte öffnet den Chat.
- Oben stehen eingegangene, noch unbeantwortete Likes mit den Aktionen „Zurückliken“ und „Nein danke“. Ein Zurücklike erzeugt bei Gegenseitigkeit ein Match.
- Darunter erscheinen gegenseitige Matches, bei denen noch niemand eine Nachricht gesendet hat. Die erste Nachricht kann direkt begonnen werden.
- Die Bereiche bleiben verborgen, solange es keine passenden Einträge gibt. App-Neuigkeiten und Partnerangebote sind rollenbezogen, Partnerangebote deutlich gekennzeichnet und erscheinen nur, wenn sie veröffentlicht und aktuell sind.
- Unter „Einstellungen“ können E-Mails für neue Likes, Matches, Nachrichten, App-Neuigkeiten und Partnerangebote getrennt gesteuert werden. Hinweise in der App bleiben unabhängig davon sichtbar. Sicherheits- und wichtige Konto-E-Mails sind davon ausgenommen.
- Voreinstellung: transaktionale Match-Ereignisse aktiviert; App-Neuigkeiten und Partnerangebote deaktiviert. Der E-Mail-Versand muss diese gespeicherten Einstellungen berücksichtigen.

### Kontakt / Feedback

- Der Kontobereich bietet ausschließlich Chat mit dem WedConnect-Team. Push-Benachrichtigungen und Support-E-Mail-Versand gibt es nicht.
- Das Kontaktfenster bleibt bei jedem Einstieg sichtbar und fragt die Art der Kontaktaufnahme, Betreff und Nachricht ab.
- Thema, Betreff und Nachricht werden zusammen in eine Chatnachricht übernommen. Sie wird an die bestehende Unterhaltung angehängt; nur beim ersten Kontakt wird ein Support-Chat angelegt.
- Nach dem Absenden öffnet sich der Chat unter „Nachrichten“.
- Der geschützte Support-Eingang steht ausschließlich eingetragenen WedConnect-Betreiberkonten zur Verfügung.
- Gelöschte Chat-Nachrichten behalten ihren ursprünglichen Absender und stehen deshalb rechts für eigene bzw. links für empfangene Nachrichten.

## Entdecken und Profilaktionen

- Entdecken zeigt jeweils ein vollständiges Profil der anderen Rolle mit Fotos, Eckdaten und Vorstellung.
- Die Aktion „Interesse zeigen“ speichert ein Like; gegenseitige Likes ergeben ein Match.
- „Überspringen“ ist eine private, dauerhaft gespeicherte Entscheidung des eigenen Kontos. Sie wird der anderen Person nicht angezeigt und erzeugt kein Match.
- Profile, die das eigene Konto bereits gelikt oder bewusst übersprungen hat, erscheinen nicht erneut im Feed. Das bloße Ansehen entfernt ein Profil nicht. Ein noch offenes eingehendes Like blendet das Profil ebenfalls nicht aus Entdecken aus; es erscheint zusätzlich unter „Erhaltene Likes“ in Matches. Die Aktion „Nein danke“ im Tab „Erhaltene Likes“ speichert ebenfalls ein dauerhaftes Überspringen.
- Das Badge bei „Matches“ zeigt die Anzahl der offenen eingegangenen Likes und aktualisiert sich automatisch, während die App geöffnet ist.

## Eingaben und Onboarding

- Die Registrierung fragt keine Rolle ab. Die Rollenwahl ist der erste Onboarding-Schritt nach dem Login.
- Hochzeits- und Fotografenformulare speichern Zwischenschritte; Profiländerungen sollen automatisch gespeichert werden.
- Zurück-Navigation zwischen den Einrichtungsschritten bleibt vorhanden.
- Fotografen: Einsatzgebiete sind strukturierte Mehrfachauswahl (Bundesländer oder Ganz Österreich), Erfahrung in Jahren und/oder Zahl der Hochzeiten, Stil als Auswahl inklusive Boho, Umfang als Auswahl, Vergütung Unentgeltlich oder Fixbetrag. Website und Instagram sind optional. Verfügbarkeit und separate Zusatzvergütung für Nutzungsrechte werden nicht abgefragt.
- Hochzeitspaar: Vornamen beider Personen, Datum, Bundesland, Ort der Hochzeit, separate optionale Locations für Trauung und Feier sowie Gästezahl, Art der Trauung (standesamtlich, kirchlich oder frei), gewünschter Begleitungsumfang und geführter Tagesablauf mit auswählbaren Programmpunkten, ungefährer Uhrzeit und optionalen Hinweisen. Bildstil und separate Bildwünsche entfallen. Die Haltung zur Nutzung der entstandenen Bilder durch den Fotografen bleibt Teil des Profils. Foto beider Personen bleibt erforderlich.
- Profilabschluss ist erforderlich, bevor Entdecken oder Matching-Funktionen benutzbar sind.

## Interaktionsqualität und Barrierefreiheit

- Klickbare Elemente sehen aktiv aus; deaktivierte Navigation kommuniziert verständlich, wann sie verfügbar wird.
- Alle Foto-Aktionen haben zugängliche Namen und ausreichende Trefferflächen, besonders auf Mobilgeräten.
- Fokuszustände sind sichtbar; Fehler stehen nahe an der betroffenen Eingabe.
- Animationen sind ruhig und respektieren `prefers-reduced-motion`.
- Keine Browser-Standardbestätigung für destruktive Aktionen, wenn dafür ein WedConnect-Dialog vorgesehen ist.

## Änderungsregel

Eine konkrete Nutzeranweisung ist erforderlich, um freigegebene App-Ansichten, Formulierungen, Bilddarstellungen oder Abläufe zu ändern. Wird im Code eine Abweichung gefunden, kommt sie zunächst in den Implementierungsstatus. Sie wird nicht dadurch zum neuen Soll, dass sie im Code existiert.
