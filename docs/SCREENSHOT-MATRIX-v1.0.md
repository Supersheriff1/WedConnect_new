# WedConnect · Screenshot- und Prüfmatrix

**Version:** 1.0  
**Stand:** 14. Oktober 2026  
**Zweck:** nachvollziehbare visuelle und funktionale Dokumentation der eingefrorenen Produkt-Baseline  
**Baseline:** `5ecfad72804a597b01cbca9e9133606175f7d38b`  
**Branch:** `docs/frozen-baseline-2026-10-14`

Diese Matrix ist eine Vorlage für spätere Aufnahmen und Tests. Ein offener Eintrag bedeutet, dass kein gespeicherter, eindeutig zuordenbarer Beleg vorliegt. Frühere Chat-Screenshots mit echten Profilbildern werden nicht ungeprüft ins Repository übernommen.

## Aufnahme-Metadaten

Jede Aufnahme oder Testgruppe erhält:

- Datum und Uhrzeit
- Commit-SHA und Vercel-Deployment/URL
- Viewport in Pixeln, Browser und Geräte-/Emulationsmodus
- Testkonto-Rolle und Profilstatus, ohne echte Namen oder E-Mail-Adressen
- geprüfter Zustand und Ergebnis
- Screenshot-Dateiname oder Ablagepfad
- offene Fehler oder Abweichungen

**Dateinamen:** `<bereich>-<zustand>-<viewport>-<datum>.png`  
**Vorgeschlagener Ablageort:** `docs/reference-shots/<bereich>/`  
Nur neutrale Testdaten und eigens dafür freigegebene Testbilder verwenden. Keine privaten Profilfotos, persönlichen Kontodaten, OAuth-Codes, Tokens oder personenbezogenen Supabase-Fehlerdetails in Screenshots committen.

## Empfohlene Viewports

| Kürzel | Größe | Verwendung |
|---|---:|---|
| Mobile schmal | 360 × 800 | enge Smartphone-Breite |
| Mobile breit | 390 × 844 | typische Smartphone-Ansicht |
| Tablet | 768 × 1024 | Navigation und Layoutwechsel |
| Desktop | 1348 × 920 | Vergleich mit dem bereits visuell geprüften Browserfenster |
| Desktop breit | 1440 × 900 | breite Inhalts- und Profilansicht |

Zwischenbreiten unmittelbar ober- und unterhalb der implementierten Breakpoints zusätzlich prüfen. Hoch- und Querformat werden für Galerie und Vollbild separat dokumentiert.

## Matrix

Status: **Offen** = kein Screenshotbeleg; **Code geprüft** = im Quellcode nachvollzogen, nicht im Browser abgenommen; **Live geprüft** = im Browser angesehen, aber ohne gespeicherte Referenzaufnahme; **Erledigt** = Aufnahme und Prüfergebnis sind abgelegt.

| ID | Bereich / Zustand | Viewports | Status am 14.10.2026 | Prüfpunkte |
|---|---|---|---|---|
| PUB-01 | Startseite, Standard | Desktop, Mobile schmal | Live geprüft, Screenshot offen | Inhalt, Navigation, Außenabstände, kein Overflow |
| PUB-02 | Für Hochzeitspaare | Desktop, Mobile schmal | Offen | Seitenaufbau, CTA, responsive Übergänge |
| PUB-03 | Für Fotografen, Standard und FAQ geöffnet | Desktop, Mobile schmal | Live geprüft, Mobil/Screenshot offen | Eingefrorene Seite, FAQ, Navigation, Auth-Einstieg |
| AUTH-01 | Anmeldung und Registrierung | Desktop, Mobile breit | Live geöffnet, Screenshot offen | Rollenneutral, Feldzustände, Moduswechsel |
| AUTH-02 | Passwortfehler und Wiederherstellung | Desktop, Mobile breit | Offen | Fehlermeldung, nächster Schritt, lesbare Dialoghöhe |
| AUTH-03 | Google-Rückkehr und erfolgreiche Weiterleitung | Desktop, Mobile | Vom Projektinhaber als funktionierend bestätigt; reproduzierbarer Beleg offen | Ein Anmeldevorgang, Rückkehrzustand, Ziel Dashboard |
| DASH-01 | Dashboard ohne Sitzung | Desktop, Mobile | Live geprüft, Screenshot offen | Ladezustand, Rückleitung zur Anmeldung |
| DASH-02 | Neues Konto, Rollenwahl | Desktop, Mobile | Code geprüft, Browserbeleg offen | Rolle wird erst nach Login gewählt |
| DASH-03 | Dashboard mit unvollständigem Profil | Desktop, Mobile | Offen | Profilstart als nächste Aktion, Fortsetzen |
| DASH-04 | Vollständiges Profil, Navigation | Desktop, Tablet, Mobile | Offen | Navigation, Ansichtswechsel ohne stehenbleibende Altansicht |
| ONB-01 | Hochzeitspaar, Schritte 1 bis 4 | Desktop, Mobile | Code geprüft, End-to-End offen | Pflichtfelder, Zurück, Fotos beider Personen, Abschluss |
| ONB-02 | Fotograf, Schritte 1 bis 4 | Desktop, Mobile | Code geprüft, End-to-End offen | Auswahlfelder, Vergütung, Links, Galerie, Abschluss |
| EDIT-01 | Profil bearbeiten und automatisch speichern | Desktop, Mobile | Offen | Änderungen, Navigation weg und zurück, Reload/Fortsetzen |
| PHOTO-01 | Galerieverwaltung, leere bis volle Galerie | Desktop, Mobile | Code geprüft, End-to-End offen | Bis zu 20 gleichwertige Fotos, mindestens 3 zum Abschluss, Upload, Reihenfolge, Löschen, Zuschnitt |
| PHOTO-02 | Profilfoto-Dialog | Desktop, Mobile | Code geprüft, Uploadtests offen | Uploadfehler, Kreiszuschnitt, Zoom/Drehung, Löschen bestätigen |
| PROFILE-01 | Fotografenprofil, Galerie und Metadaten | Desktop, Tablet, Mobile | Offen | Bild im Mittelpunkt, Name, Erfahrung/Vergütung, vorhandene Social-Icons |
| PROFILE-02 | Paarprofil | Desktop, Tablet, Mobile | Offen | Vornamen, Hochzeitsinfos, Bilder, Darstellung |
| PROFILE-03 | Galerie-Vollbild | Hochformat und Querformat, Mobile | Offen | Bild so groß wie möglich, `contain`, keine Verzerrung/Beschneidung, Zähler mittig, X schließt |
| PROFILE-04 | Like-/Dislike-Zustände | Desktop, Mobile | Code-/Datenbankstand getrennt prüfen | Aktion und erwidertes Interesse; keine Match-Funktion behaupten, solange End-to-End offen |

## Prüfliste je Ansicht

- Inhalt liegt innerhalb des äußeren Rahmens und hat sichtbare Außenabstände.
- Kein horizontaler Seiten-Overflow, keine abgeschnittenen Texte und keine überlappenden Bedienelemente.
- Navigation und Arbeitsbereich wechseln vollständig; keine alte Ansicht bleibt im Hintergrund stehen.
- Touchziele, aktive Zustände, Fokus, Fehler und Ladezustände sind erkennbar.
- Profilbilder erscheinen passend zur tatsächlichen Galerieansicht; kein falscher Ausschnitt und kein durchscheinender Untergrund.
- Beschriftungen bleiben kurz und verständlich.
- Animierte Elemente respektieren `prefers-reduced-motion`.
- Ergebnisse werden als **Code geprüft**, **Live geprüft** oder **End-to-End getestet** benannt. Diese Begriffe sind nicht austauschbar.

## Ausfüllvorlage für einen Testlauf

| Feld | Wert |
|---|---|
| Test-ID | |
| Datum / Uhrzeit | |
| Commit / Deployment / URL | |
| Browser / Gerät | |
| Viewport / Orientierung | |
| Testkonto und Profilstatus | |
| Schritte / beobachtetes Ergebnis | |
| Screenshotpfad | |
| Status | |
| Offene Abweichungen | |

Diese Matrix dokumentiert die Baseline. Sie ist keine Freigabe, Produktcode oder eingefrorene Seitengestaltung zu verändern.
