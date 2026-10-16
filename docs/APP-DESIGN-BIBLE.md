# WedConnect · App Design Bible

**Version:** 0.4  
**Stand:** 15. Oktober 2026  
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

## Übersicht, Matches und Benachrichtigungen
- In der Match-Liste öffnen Klicks auf Profilfoto oder Namen eine eigene Profilansicht innerhalb des Dashboards. Die Matches-Navigation bleibt aktiv; eine Zurück-Schaltfläche führt zur Matchliste. Das Profil ersetzt die Liste und liegt nicht darüber. Der Chat bleibt separat.

- Die Übersicht ist der Startbildschirm nach dem Login. Sie ergänzt die Hauptnavigation und dupliziert nicht Profil-, Match- oder Nachrichtenlisten.
- Oben stehen eingegangene, noch unbeantwortete Likes mit den Aktionen „Zurückliken“ und „Nein danke“. Ein Zurücklike erzeugt bei Gegenseitigkeit ein Match.
- Darunter erscheinen gegenseitige Matches, bei denen noch niemand eine Nachricht gesendet hat. Die erste Nachricht kann direkt begonnen werden.
- Die Bereiche bleiben verborgen, solange es keine passenden Einträge gibt. App-Neuigkeiten und Partnerangebote sind rollenbezogen, Partnerangebote deutlich gekennzeichnet und erscheinen nur, wenn sie veröffentlicht und aktuell sind.
- Unter „Einstellungen“ können E-Mails für neue Likes, Matches, Nachrichten, App-Neuigkeiten und Partnerangebote getrennt gesteuert werden. Hinweise in der App bleiben unabhängig davon sichtbar. Sicherheits- und wichtige Konto-E-Mails sind davon ausgenommen.
- Voreinstellung: transaktionale Match-Ereignisse aktiviert; App-Neuigkeiten und Partnerangebote deaktiviert. Der E-Mail-Versand muss diese gespeicherten Einstellungen berücksichtigen.

## Entdecken und Profilaktionen

- Entdecken zeigt jeweils ein vollständiges Profil der anderen Rolle mit Fotos, Eckdaten und Vorstellung.
- Die Aktion „Interesse zeigen“ speichert ein Like; gegenseitige Likes ergeben ein Match.
- „Überspringen“ ist eine private, dauerhaft gespeicherte Entscheidung des eigenen Kontos. Sie wird der anderen Person nicht angezeigt und erzeugt kein Match.
- Profile, die das eigene Konto bereits gelikt oder übersprungen hat, erscheinen nicht erneut im Feed. Neue eingegangene Likes werden in der Übersicht beantwortet.

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
