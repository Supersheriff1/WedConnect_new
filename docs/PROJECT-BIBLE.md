# WedConnect · Project Bible

**Version:** 2.1  
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

Die Seite „Für Fotografen“ ist der verbindliche Designmaster für die öffentliche WedConnect-Website. Startseite und Hochzeitspaare-Seite sind visuell an diesen Stand angeglichen und übernehmen Gestaltung, Typografie, Außenrahmen und Abstände. Ihr Design ist freigegeben; ihre Texte sind noch frühe Entwürfe und ausdrücklich nicht eingefroren. Die jeweils gültigen visuellen Regeln stehen in der aktuellen Design Bible unter `docs/DESIGN-BIBLE.md`. Das eingeloggte Dashboard und die App folgen ihrem eigenen Designstandard.\n\nDer Abschnitt „Der Ausgangspunkt“ erklärt, warum erfahrene Fotografen oft zu wenige veröffentlichbare Bilder im Portfolio haben. Die Illustration `assets/illustrations/fotografen-portfolio-gap.webp` zeigt eine leicht frustrierte Fotografin mit einem nahezu frontal ausgerichteten Album. Auf der linken Seite ist genau ein großes, aufrecht stehendes Hochzeitsfoto im Hochformat zu sehen; die rechte Albumseite bleibt leer. Keine verdrehten oder schräg liegenden Fotos. Im gemeinsamen Panel stehen Styled Shoots, Workshops und echte Hochzeiten als drei icon-geführte Alternativen mit ihren jeweiligen Hürden. Die Icons bewegen sich mit gut wahrnehmbarer, aber ruhiger Animation und versetztem Rhythmus; bei aktivierter Betriebssystemeinstellung für reduzierte Bewegung bleibt die Animation aus. Auf Desktop verbindet das Bild den Einstiegstext visuell mit der Alternativenreihe; auf kleinen Ansichten stehen Bild und Inhalte untereinander.

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

Für die öffentliche Website gilt die aktuelle Design Bible `docs/DESIGN-BIBLE.md`, Version 2.3. Der eingefrorene Designmaster ist „Für Fotografen“. Startseite und Hochzeitspaare-Seite übernehmen den visuellen Stand einschließlich des gemeinsamen Außenrahmens. Ihre Texte bleiben bis zu einer gesonderten Freigabe Entwürfe. Das Dashboard und die eingeloggte App sind von diesem Website-Designstandard ausgenommen.

## 15. Technische Umsetzung

### Aktueller Implementierungsstand

- Die öffentlichen Seiten `index.html`, `fotografen.html` und `hochzeitspaare.html` sind statische HTML-Seiten.
- Das Design von Startseite und Hochzeitspaare-Seite ist an den eingefrorenen Fotografen-Master angeglichen.
- Die Texte auf der Startseite und der Seite für Hochzeitspaare sind frühe Entwürfe und nicht Teil des eingefrorenen Designstands.
- Supabase Auth, Datenbanktabellen, Profil-Onboarding und Matching sind noch nicht angebunden.

### Nächster Umsetzungsschritt: Authentifizierung

Die erste produktive Anbindung soll Supabase Auth mit E-Mail/Passwort und Google umfassen. Die Rollenwahl Hochzeitspaar oder Fotograf wird beim Registrierungsablauf getroffen und dauerhaft mit dem Konto verknüpft. Rollen- und Profildaten werden mit Row Level Security geschützt. Danach folgen rollenabhängige Profilformulare und die Matching-Funktionen.

Die Browser-App verwendet ausschließlich den öffentlichen Supabase Publishable Key (früher anon key). Ein Service-Role-Key oder anderer geheimer Schlüssel darf nie in HTML, JavaScript oder im Browser gespeichert werden.