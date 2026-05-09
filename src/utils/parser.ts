import { getPreferenceValues } from "@raycast/api";
import { CardType, Flashcard, Option, Preferences } from "../types";

/**
 * Parst die Markdown-Eingabe in eine Flashcard.
 *
 * Standard-Karte:
 *   Frage
 *   ==
 *   Antwort
 *   #tag1 #tag2
 *
 * Multiple-Choice-Karte:
 *   Frage
 *   ==<
 *   1: Option A
 *   2: Option B
 *   3: Option C
 *   --
 *   richtig: 2   (DE) / true: 2  (EN)
 *   #tag1 #tag2
 *
 * Leerzeilen zwischen den Abschnitten sind optional.
 * Tags werden automatisch auf Kleinschreibung normalisiert.
 */
export function parseMarkdown(input: string): Omit<Flashcard, "id" | "progress" | "createdAt"> {
  const { language } = getPreferenceValues<Preferences>();
  const correctKeyword = language === "de" ? "richtig" : "true";

  const lines = input.trim().split("\n");

  // Tags aus der letzten Zeile extrahieren (wenn die Zeile nur aus #tags besteht)
  let tags: string[] = [];
  let contentLines = lines;

  const lastLine = lines[lines.length - 1]?.trim() ?? "";
  if (/^(#\w+\s*)+$/.test(lastLine)) {
    tags = (lastLine.match(/#(\w+)/g) ?? []).map((t) => t.slice(1).toLowerCase());
    contentLines = lines.slice(0, -1);
  }

  const content = contentLines.join("\n").trim();

  // Typ erkennen anhand des Trennzeichens
  if (/\n[\t ]*==</.test(content)) {
    return parseMC(content, tags, correctKeyword);
  } else {
    return parseStandard(content, tags);
  }
}

function parseStandard(content: string, tags: string[]): Omit<Flashcard, "id" | "progress" | "createdAt"> {
  // Teilen an == – mit oder ohne Leerzeilen darum
  const parts = content.split(/\n[\t ]*==[\t ]*\n/);
  const front = parts[0]?.trim() ?? "";
  const back = parts[1]?.trim() ?? "";

  return {
    type: "standard" as CardType,
    front,
    back,
    tags,
  };
}

function parseMC(
  content: string,
  tags: string[],
  correctKeyword: string
): Omit<Flashcard, "id" | "progress" | "createdAt"> {
  // Teilen an ==< – mit oder ohne Leerzeilen darum
  const [frontPart, rest] = content.split(/\n[\t ]*==<[\t ]*\n/);
  const front = frontPart?.trim() ?? "";

  // Rest teilen an -- – mit oder ohne Leerzeilen darum
  const [optionsPart, correctPart] = (rest ?? "").split(/\n[\t ]*--[\t ]*\n/);

  // Optionen parsen: "1: Text", "2: Text", "3: Text"
  const options: Option[] = (optionsPart ?? "")
    .trim()
    .split("\n")
    .reduce<Option[]>((acc, line) => {
      const m = line.trim().match(/^(\d+):\s*(.+)/);
      if (m) {
        acc.push({ id: parseInt(m[1], 10), text: m[2].trim() });
      }
      return acc;
    }, []);

  // Richtige Antwort parsen: "richtig: 2" oder "true: 2"
  const correctMatch = (correctPart ?? "")
    .trim()
    .match(new RegExp(`^${correctKeyword}:\\s*(\\d+)`, "im"));
  const correctOption = correctMatch ? parseInt(correctMatch[1], 10) : undefined;

  return {
    type: "multiple-choice" as CardType,
    front,
    options,
    correctOption,
    tags,
  };
}
