# WedConnect · Project Bible

**Version:** 1.4  
**Stand:** 11. Oktober 2026  

## 1. Ziel des Projekts

WedConnect ist eine Plattform, die Hochzeitspaare mit Hochzeitsfotograf:innen für mögliche TFP-Zusammenarbeiten verbindet. Beide Seiten stellen sich vor, prüfen passende Profile und entscheiden selbst, ob sie Interesse haben.

Ein Match entsteht erst, wenn beide Seiten Interesse zeigen. Es ist der Beginn eines Gesprächs und noch keine Buchungszusage. Umfang, Gegenleistung, Lieferung und Bildrechte werden vor einer Zusammenarbeit ausdrücklich vereinbart.

Das Projekt umfasst eine öffentliche Website, die App für beide Rollen, die technische Plattform dahinter sowie Betrieb, Sicherheit und rechtliche Grundlagen.

## 2. Öffentliche Website

Die Website erklärt WedConnect, bevor sich jemand registriert:

- Idee und Ablauf des gegenseitigen Matchings
- Services für Paare und Fotograf:innen
- Erwartungen und Voraussetzungen für eine TFP-Zusammenarbeit
- Preise, kostenlose Funktionen und Pro-Angebot
- häufige Fragen, Hilfe und Kontakt
- rechtliche Informationen und Datenschutz
- klare Einstiege zur Registrierung und App

Die aktuelle Seite „Für Fotografen“ ist der verbindliche Designmaster für die gesamte öffentliche WedConnect-Website. Alle weiteren öffentlichen Seiten folgen ihrer dunklen Pairing-Gestaltung mit Goldakzenten, Montserrat, klarer Typografie, Ausrichtung, Abständen und redaktionellen Illustrationen, die zum jeweiligen Inhalt passen. Inhaltliche Abschnitte verbinden Überschrift und Erklärung zu einem Textblock mit einer passenden Illustration. Bildposition, Bildgröße, Textbreite und Abstände variieren passend zum Inhalt, damit ein lebendiger redaktioneller Seitenrhythmus entsteht. Auf schmalen Mobilgeräten steht der Text vor der Illustration. Das eingeloggte Dashboard und die App sind von dieser Gestaltungsregel ausgenommen und bleiben im bestehenden Design.

**Umsetzung:** Öffentlich zugängliche, mobiloptimierte Website mit getrennten Informationsseiten und klaren Übergängen zur App. Preise und Pro-Leistungen müssen vor Veröffentlichung festgelegt werden.

## 3. Registrierung und Konten

Bei der Registrierung wählt die Person zuerst eine Rolle:

- Hochzeitspaar
- Fotograf:in

Vorgesehene Anmeldewege:

- E-Mail und Passwort
- Google
- Apple
- weitere verbreitete Anbieter nach Bedarf

Dazu kommen Konto- und Profilverwaltung, Abmeldung, Passwort- beziehungsweise Kontowiederherstellung, Datenschutzinformationen und Kontolöschung.

**Umsetzung:** Authentifizierungsdienst mit verifizierten Konten, sicherer Sitzungsverwaltung und rollenabhängigem Onboarding. Ein Konto muss einer Rolle zugeordnet sein. Ein Rollenwechsel im Demo-Modus ist keine produktive Kontofunktion.

## 4. Onboarding und Profile

### Hochzeitsprofil

Paare geben Informationen an, die Fotograf:innen bei ihrer Auswahl helfen:

- Hochzeitsdatum und zeitlicher Ablauf
- Location, Ort und Region
- Gästezahl und Art der Feier
- gewünschter Umfang der Begleitung
- Stil- und Bildwünsche
- mögliche Motive und besondere Rahmenbedingungen
- Bereitschaft zur Nutzung der entstandenen Bilder durch Fotograf:innen

Die Angaben sollen Fotograf:innen ermöglichen einzuschätzen, ob Location, Paar, Feier und Bildmöglichkeiten zu ihrem Portfolio passen.

### Fotograf:innenprofil

Fotograf:innen präsentieren:

- Name, Profilbild und berufliche Bezeichnung
- Region und mögliche Einsatzgebiete
- Erfahrung und bisherige Hochzeitsarbeit
- Stil und bevorzugte Bildsprache
- Portfolio und Referenzbilder
- Verfügbarkeit und gewünschte Arten von Hochzeiten
- angebotenen Umfang und Erwartungen

Paare sollen besonders Erfahrung, Referenzbilder und Portfolio beurteilen können. Fotograf:innen entscheiden selbst, welche Hochzeiten sie interessieren.

**Umsetzung:** Rollenabhängige Formulare, Pflichtfelder, Profilstatus, Vorschau und Bearbeitung. Angaben können im Onboarding ergänzt und später aktualisiert werden.

## 5. Foto-Upload und Galerien

Nutzer:innen können mehrere Profil- und Portfoliofotos hochladen.

- Vorschau vor Veröffentlichung
- Bild einpassen oder einen Ausschnitt wählen
- Bildreihenfolge festlegen
- Fotos in Profilen horizontal per Wischgeste durchblättern
- Bedienung zusätzlich über Pfeile und Tastatur
- Bildposition und Galerieposition sichtbar machen
- Profile und Portfoliofotos auf Desktop und Mobilgerät anzeigen

**Bildregel:** In der App wird grundsätzlich der vollständige Bildausschnitt gezeigt. Ein beim Upload gewählter Ausschnitt dient der dafür vorgesehenen Darstellung und darf nicht zu einem unbemerkten Verlust des Originals führen.

**Umsetzung:** Bildspeicher mit getrenntem Original und Darstellungsversionen, Uploadbegrenzungen, Formatprüfung, Größenoptimierung und Galeriekomponente mit contain-Darstellung.

## 6. Entdecken, Suche und Filter

Paare entdecken Fotograf:innen. Fotograf:innen entdecken Hochzeiten.

Die Auswahl kann nach passenden Kriterien eingegrenzt werden, zum Beispiel:

- Region und Einsatzgebiet
- Datum und Verfügbarkeit
- Stil
- Erfahrung
- Gästezahl und Hochzeitsrahmen
- gewünschter Umfang und Interessen

Die Karten zeigen wichtige Eckdaten. Eine Detailansicht bietet mehr Informationen und eine größere Galerie.

**Umsetzung:** Serverseitige Suche und Filter auf veröffentlichten Profilen; nur passende und sichtbare Profile werden angezeigt.

## 7. Interesse, Rückzug und Matching

- Nutzer:innen können Interesse an einem Profil zeigen.
- Eingehendes Interesse ist sichtbar.
- Ein Match entsteht nur durch beidseitiges Interesse.
- Ein bereits gesendetes Interesse kann zurückgezogen werden.
- Vor dem Rückzug erscheint ein Bestätigungsdialog.
- Nach einem Match wird der Chat angeboten.

**Eigene Match-Animation:** Eine kurze, eigenständige Animation mit zwei Bildkarten und einer goldenen Verbindungslinie. Sie soll ruhig und hochwertig wirken und nicht dem bekannten Swipe- oder Tinder-Stil folgen. Bei aktivierter Systemeinstellung zur Bewegungsreduzierung wird sie reduziert.

**Umsetzung:** Match-Zustände werden serverseitig verwaltet. Aktionen müssen wiederholbar und synchron über alle Geräte funktionieren.

## 8. Chat und Vereinbarungen

Nach einem Match können die Beteiligten direkt miteinander schreiben. Der Chat dient dazu, vor einer verbindlichen Zusage mindestens diese Punkte zu klären:

- Dauer und Ablauf
- Bildanzahl und Bildbearbeitung
- Lieferung und Lieferzeit
- Preis oder sonstige Gegenleistung
- Nutzungsrechte
- Portfolio- und Veröffentlichungsfreigabe
- Ausfall- und Änderungsregelungen

**Umsetzung:** Gespräche sind nur für die beiden Match-Konten zugänglich. Die Sicherheitsarchitektur muss sichere Übertragung, Zugriffskontrollen, Speicherung, Backups und Supportzugriffe berücksichtigen. Ende-zu-Ende-Verschlüsselung ist als Architekturentscheidung zu prüfen. Eine absolute Garantie, dass niemand mitlesen kann, sollte nicht behauptet werden; Ziel ist eine nach dem Stand der Technik geschützte Kommunikation.

## 9. Nutzungsrechte

Als Standard erhält das Hochzeitspaar die vollen Nutzungsrechte an den für es erstellten Fotos.

Die Nutzung durch Fotograf:innen, beispielsweise für Portfolio, Website oder soziale Medien, wird davon getrennt und muss ausdrücklich vereinbart werden. Die Zustimmung und ihr Umfang müssen nachvollziehbar dokumentiert sein.

**Umsetzung:** Verständliche Rechteauswahl im Profil und eine verbindliche Rechtevereinbarung vor der Zusammenarbeit. Die rechtlichen Texte müssen für den tatsächlichen Betrieb fachlich geprüft werden.

## 10. Profil- und Kontoverwaltung

Der Kontobereich umfasst:

- Profil ansehen und bearbeiten
- Abmeldung
- Hilfe und Kontakt
- WedConnect empfehlen und Freund:innen einladen
- Pro-Account ansehen und verwalten
- Zahlungsinformationen und Belege
- Impressum und rechtliche Informationen
- Datenschutz
- Kontolöschung

**Umsetzung:** Kontobereich mit rollenabhängigen Profileinstellungen, Datenschutz- und Sicherheitsoptionen, Zahlungsverwaltung und nachvollziehbarem Löschablauf.

## 11. Pro-Account und Zahlungen

Das Pro-Angebot soll in App und Website verständlich darstellen:

- welche Zusatzfunktionen enthalten sind
- Preis und Abrechnungsintervall
- Kündigung und Verlängerung
- Zahlungsarten und Belege

**Umsetzung:** Erst nach Festlegung des Geschäftsmodells wird ein Zahlungsanbieter angebunden. Es gibt derzeit noch keine verbindlich festgelegten Pro-Funktionen oder Preise.

## 12. Benachrichtigungen und Status

Nutzer:innen sehen wichtige Ereignisse und Aufgaben:

- Profil unvollständig
- Interesse gesendet oder erhalten
- Match entstanden
- neue Nachricht
- offene Vereinbarung
- Änderungen am Konto oder Abo

**Umsetzung:** In-App-Mitteilungen; E-Mail- oder Push-Benachrichtigungen nach Einwilligung und Konfiguration.

## 13. Administration und Moderation

Für einen öffentlichen Betrieb braucht WedConnect Werkzeuge zur Verwaltung und zum Schutz der Plattform:

- Profile und Inhalte prüfen
- Meldungen und Beschwerden bearbeiten
- Nutzer:innen sperren oder freischalten
- rechtswidrige oder unzulässige Inhalte entfernen
- Supportfälle nachvollziehbar bearbeiten
- Plattformaktivität und technische Fehler überwachen

**Umsetzung:** Geschützter Administrationsbereich mit Rollen- und Berechtigungskonzept, Protokollierung und klaren Bearbeitungsabläufen.

## 14. Designstandard

Für die öffentliche Website ist die **WedConnect Design Bible v1.4** verbindlich. Designmaster ist `fotografen.html` im Repository `Supersheriff1/WedConnect_new`, Commit `34b62aeb331e8b663e9b0f76d29d786798f19616`. Dashboard und eingeloggte App sind von dieser Festlegung ausgenommen; ihr aktueller visueller Standard bleibt unverändert.

- Öffentliche Website: dunkle Pairing-Flächen mit gezielten Goldakzenten.
- Öffentliche Website: Montserrat für Überschriften, Fließtext, Navigation und Controls; IBM Plex Mono nur für kurze Kennzeichnungen.
- Dashboard und funktionale App-Oberflächen: Manrope; IBM Plex Mono für kompakte Metadaten.
- Öffentliche Textabschnitte erhalten jeweils eine passende Illustration im redaktionellen WedConnect-Stil, angelehnt an die Hero-Illustration.
- Diese erzählerischen Illustrationen bleiben auf der öffentlichen Website. Dashboard-Ansichten verwenden echte Profil- und Portfoliofotos sowie funktionale Icons.
- Buttons und Formulare bleiben kontrastreich und auf Mobilgeräten bequem bedienbar; Primärbuttons mindestens 50 px hoch.
- Mobile Lesetexte mindestens 16 px; Layouts behalten sichtbare Außenabstände.
- Bewegungen beachten `prefers-reduced-motion`.

Neue öffentliche Seiten und Komponenten folgen dem Designmaster „Für Fotografen“ und der Design Bible v1.5. Die Product Bible beschreibt Produktumfang und Verhalten; visuelle Detailregeln der öffentlichen Website stehen ausschließlich in der Design Bible. Dashboard und eingeloggte App werden durch diese Aktualisierung nicht verändert.

## 15. Technische Umsetzung

### Prototyp

Die vorhandene HTML-Demo dient dazu, Gestaltung und Kernabläufe zu zeigen:

- öffentliche Informationsansicht
- Rollenwahl und simulierte Anmeldung
- Paar- und Fotograf:innenansicht
- Demo-Profile, Filter und Portfolio-Galerien
- Interessen und Matches
- Match-Animation
- Nachrichtenbereich
- Profil- und Kontoverwaltung
- lokale Speicherung im Browser

Sie ist kein Produktivsystem. Anmeldung, Datenübertragung, Zahlungen und echte Chat-Sicherheit sind darin nicht angebunden.
