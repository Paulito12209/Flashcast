# Flashcards – Raycast Extension

Karteikarten schnell erstellen und lernen mit Markdown-Syntax.

## Setup

```bash
cd flashcard-extension
npm install
npm run dev
```

Raycast lädt die Extension automatisch. Alle 4 Commands erscheinen im Launcher.

## Commands

| Command | Funktion |
|---|---|
| **Erstellen** | Neue Karteikarte anlegen |
| **Liste** | Alle Karten mit Antwort-Preview |
| **Tags** | Karten nach Tags filtern |
| **Quiz** | Karteikarten abfragen |

## Markdown-Syntax

### Standard-Karte

```
Hauptstadt von Frankreich

==

Paris

#geographie #europa
```

### Multiple Choice (max. 3 Optionen)

```
Welche Sprache wird in Brasilien gesprochen?

==<

1: Spanisch
2: Portugiesisch
3: Französisch

--

richtig: 2

#sprachen
```

**Englisch:**
```
==<

1: Spanish
2: Portuguese
3: French

--

true: 2
```

### Tags
- Tags stehen in der **letzten Zeile** des Inputs
- Format: `#tagname` (mehrere: `#tag1 #tag2`)
- Eine Karte kann mehrere Tags haben

## Quiz-Modi

| Modus | Beschreibung |
|---|---|
| Falsche Karten | Nur Karten mit ✗-Status |
| Neue Karten | Noch nie abgefragte Karten |
| Nach Tags | Tag(s) auswählen, alle Karten daraus |
| Alle Karten | Kompletter Pool, zufällige Reihenfolge |

## Einstellungen

In Raycast → Extensions → Flashcards:
- **Sprache**: Deutsch (Standard) / English
  - Beeinflusst die `richtig:`/`true:` Syntax

## Speicher

Alle Karten und der Lernfortschritt werden in Raycast `LocalStorage` gespeichert (lokal, kein Cloud-Sync).
