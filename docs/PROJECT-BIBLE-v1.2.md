# WedConnect · Project Bible

**Version:** 1.2  
**Stand:** 13. Oktober 2026  

## 1. Ziel des Projekts

WedConnect ist eine Plattform, die Hochzeitspaare mit Hochzeitsfotografen für mögliche TFP-Zusammenarbeiten verbindet. Beide Seiten stellen sich vor, prüfen passende Profile und entscheiden selbst, ob sie Interesse haben.

Ein Match entsteht erst, wenn beide Seiten Interesse zeigen. Es ist der Beginn eines Gesprächs und noch keine Buchungszusage. Umfang, Gegenleistung, Lieferung und Bildrechte werden vor einer Zusammenarbeit ausdrücklich vereinbart.

Das Projekt umfasst eine öffentliche Website, die App für beide Rollen, die technische Plattform dahinter sowie Betrieb, Sicherheit und rechtliche Grundlagen.

## 2. Öffentliche Website

Die Website erklärt WedConnect, bevor sich jemand registriert:

- Idee und Ablauf des gegenseitigen Matchings
- Services für Paare und Fotografen
- Erwartungen und Voraussetzungen für eine TFP-Zusammenarbeit
- Preise, kostenlose Funktionen und Pro-Angebot
- häufige Fragen, Hilfe und Kontakt
- rechtliche Informationen und Datenschutz
- klare Einstiege zur Registrierung und App

Die öffentliche Seite folgt dem dunklen Pairing-System mit Goldakzenten. Ihre Typografie und Bildsprache richten sich nach der WedConnect Design Bible v1.2.

**Umsetzung:** Öffentlich zugängliche, mobiloptimierte Website mit getrennten Informationsseiten und klaren Übergängen zur App. Preise und Pro-Leistungen müssen vor Veröffentlichung festgelegt werden.

## 3. Registrierung und Konten

Die Anmeldung und Registrierung sind für alle gleich. Dabei wird keine Rolle abgefragt.

Nach erfolgreicher Anmeldung führt WedConnect zum Dashboard. Beim ersten Einstieg beginnt dort die Profilerstellung. Als ersten Profilschritt wählt die Person **Hochzeitspaar** oder **Fotograf**. Die Zuordnung wird nach der Auswahl fest mit dem Konto verbunden.

Vorgesehene Anmeldewege:

- E-Mail und Passwort
- Google
- Apple
- weitere verbreitete Anbieter nach Bedarf

Dazu kommen Konto- und Profilverwaltung, Abmeldung, Passwort- beziehungsweise Kontowiederherstellung, Datenschutzinformationen und Kontolöschung.

## 4. Onboarding und Profile

Das Dashboard dient vor dem Profilabschluss als mehrstufiger Profil-Assistent. Die Schritte werden zwischengespeichert und können später fortgesetzt werden. Entdecken, Matches und Nachrichten bleiben gesperrt, bis alle Pflichtangaben und erforderlichen Fotos vorhanden sind.

### Hochzeitsprofil

Erfasst werden:

- Vorname beider heiratenden Personen
- Hochzeitsdatum, Ort oder Location und Gästezahl
- geplanter Ablauf und gewünschter Begleitungsumfang
- Bildstil und konkrete Bildwünsche
- grundsätzliche Präferenz zur Nutzung der späteren Hochzeitsfotos durch den Fotografen

Beide Personen müssen auf den Profilfotos vertreten sein: entweder auf einem gemeinsamen Foto oder jeweils auf einem eigenen Foto. Die verbindliche Nutzung der bei der Hochzeit entstehenden Bilder durch den Fotografen wird vor einer Zusammenarbeit separat vereinbart.

### Fotografenprofil

Erfasst werden:

- Vorname des Fotografen
- Region und Einsatzgebiet
- Erfahrung und Bildstil
- Verfügbarkeit und gewünschter Begleitungsumfang
- mindestens 10 Portfoliofotos
- Instagram-Profil und Website als optionale Angaben

### Abschluss und Freischaltung

Profile lassen sich vor dem Abschluss prüfen. Unvollständige Angaben werden gespeichert, damit der Assistent später an dieser Stelle fortgesetzt werden kann. Erst nach erfolgreicher Profilprüfung wird der vollständige Dashboard-Bereich freigeschaltet.

## 5. Foto-Upload und Galerien

Nutzer können Profil- und Portfoliofotos hochladen. Die Fotos werden vor dem Abschluss in einer Vorschau angezeigt.

- Beim Hochzeitspaar ist entweder ein gemeinsames Foto beider Personen oder je ein Foto pro Person erforderlich.
- Beim Fotografen sind mindestens 10 Portfoliofotos erforderlich.
- Erlaubte Dateiformate: JPEG, PNG und WebP; maximale Dateigröße derzeit 10 MB pro Bild.
- Profile und Fotos bleiben privat, bis das jeweilige Profil abgeschlossen ist. Danach sind sie für angemeldete WedConnect-Nutzer sichtbar.
- Die Darstellung zeigt den vollständigen Bildausschnitt. Ein Zuschnitt darf das gespeicherte Original nicht unbemerkt ersetzen.
- Bildreihenfolge und spätere Bearbeitung gehören zum weiteren Ausbau der Profilverwaltung.

## 6. Entdecken, Suche und Filter

Paare entdecken Fotografen. Fotografen entdecken Hochzeiten.

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

Die Nutzung durch Fotografen, beispielsweise für Portfolio, Website oder soziale Medien, wird davon getrennt und muss ausdrücklich vereinbart werden. Die Zustimmung und ihr Umfang müssen nachvollziehbar dokumentiert sein.

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

Die verbindliche visuelle Referenz ist die **WedConnect Design Bible v1.2**. Sie hat Vorrang vor älteren visuellen Vorgaben in dieser Project Bible.

- Öffentliche Website: dunkle Pairing-Flächen mit gezielten Goldakzenten.
- Öffentliche Website: Montserrat für Überschriften, Fließtext, Navigation und Controls; IBM Plex Mono nur für kurze Kennzeichnungen.
- Dashboard und funktionale App-Oberflächen: Manrope; IBM Plex Mono für kompakte Metadaten.
- Öffentliche Textabschnitte erhalten jeweils eine passende Illustration im redaktionellen WedConnect-Stil, angelehnt an die Hero-Illustration.
- Diese erzählerischen Illustrationen bleiben auf der öffentlichen Website. Dashboard-Ansichten verwenden echte Profil- und Portfoliofotos sowie funktionale Icons.
- Buttons und Formulare bleiben kontrastreich und auf Mobilgeräten bequem bedienbar; Primärbuttons mindestens 50 px hoch.
- Mobile Lesetexte mindestens 16 px; Layouts behalten sichtbare Außenabstände.
- Bewegungen beachten `prefers-reduced-motion`.

Neue Komponenten folgen der Design Bible v1.2. Die Product Bible beschreibt Produktumfang und Verhalten; visuelle Detailregeln stehen ausschließlich in der Design Bible.

## 15. Technische Umsetzung

### Prototyp

Die vorhandene HTML-Demo dient dazu, Gestaltung und Kernabläufe zu zeigen:

- öffentliche Informationsansicht
- Rollenwahl und simulierte Anmeldung
- Paar- und Fotografenansicht
- Demo-Profile, Filter und Portfolio-Galerien
- Interessen und Matches
- Match-Animation
- Nachrichtenbereich
- Profil- und Kontoverwaltung
- lokale Speicherung im Browser

Sie ist kein Produktivsystem. Anmeldung, Datenübertragung, Zahlungen und echte Chat-Sicherheit sind darin nicht angebunden.

### Supabase-App

- E-Mail- und Google-Anmeldung verwenden Supabase Auth; die Anmeldung fragt keine Rolle ab.
- Nach der Anmeldung beginnt die Profilerstellung im Dashboard mit der Rollenwahl.
- Rollenprofile, Profilstatus und private Fotos werden über Supabase gespeichert.
- Die Migrationen `20261012160000_init_profiles.sql` und `20261013120000_profile_onboarding.sql` müssen in dieser Reihenfolge ausgeführt werden.
- Matching und Nachrichten sind noch nicht implementiert.
