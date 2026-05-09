import { Form, ActionPanel, Action, showToast, Toast, getPreferenceValues, Icon, popToRoot } from "@raycast/api";
import { parseMarkdown } from "./utils/parser";
import { saveCard } from "./utils/storage";
import { Flashcard, Preferences } from "./types";

// ── Standard-Karte: Schritte (Beschreibungstext) ──────────────────────────────
const STEPS_DE = [
  "── Standard-Karte ─────────────────────────────────────",
  "1. Titel eingeben",
  "2. Enter drücken · == eingeben · Enter drücken  →  Trenner",
  "3. Antwort eingeben",
  "4. Tags anhängen  (optional, alles kleinschreiben)",
].join("\n");

const STEPS_EN = [
  "── Standard card ──────────────────────────────────────────",
  "1. Enter the title",
  "2. Press Enter · type == · press Enter  →  separator",
  "3. Enter the answer",
  "4. Add tags  (optional, always lowercase)",
].join("\n");

// ── Standard-Karte: Beispiel (einzutippender Text) ────────────────────────────
const EXAMPLE_DE = [
  "Photosynthese",
  "==",
  "Prozess, bei dem Pflanzen aus Licht und CO₂ Zucker herstellen.",
  "#biologie #schule",
].join("\n");

const EXAMPLE_EN = [
  "Photosynthesis",
  "==",
  "Process by which plants convert light and CO₂ into sugar.",
  "#biology #school",
].join("\n");

// ── Multiple-Choice: Schritte ──────────────────────────────────────────────────
const MC_STEPS_DE = [
  "── Multiple-Choice-Karte ───────────────────────────────",
  "1. Frage eingeben",
  "2. Enter drücken · ==< eingeben · Enter drücken  →  Trenner",
  "3. Optionen eingeben  (z.B.  1: Text  2: Text  3: Text)",
  "4. Enter drücken · -- eingeben · Enter drücken  →  Trenner",
  "5. Richtige Antwort  (z.B.  richtig: 2)",
  "6. Tags anhängen  (optional, alles kleinschreiben)",
].join("\n");

const MC_STEPS_EN = [
  "── Multiple-choice card ────────────────────────────────",
  "1. Enter the question",
  "2. Press Enter · type ==< · press Enter  →  separator",
  "3. Enter options  (e.g.  1: Text  2: Text  3: Text)",
  "4. Press Enter · type -- · press Enter  →  separator",
  "5. Correct answer  (e.g.  true: 2)",
  "6. Add tags  (optional, always lowercase)",
].join("\n");

// ── Multiple-Choice: Beispiel ─────────────────────────────────────────────────
const MC_EXAMPLE_DE = [
  "Wann wurde die EU gegründet?",
  "==<",
  "1: 1945",
  "2: 1957",
  "3: 1993",
  "--",
  "richtig: 2",
  "#geschichte #politik",
].join("\n");

const MC_EXAMPLE_EN = [
  "When was the EU founded?",
  "==<",
  "1: 1945",
  "2: 1957",
  "3: 1993",
  "--",
  "true: 2",
  "#history #politics",
].join("\n");

// ── Tag-Kategorien ─────────────────────────────────────────────────────────────
const TAGS_DE = [
  "Tags immer klein schreiben  (z.B. #englisch statt #Englisch)",
  "",
  "#vokabular   – Fremdwörter & Begriffe",
  "#grammatik   – Sprachregeln",
  "#unternehmen – Firmen & Marken",
  "#personen    – Wichtige Persönlichkeiten",
  "#tools       – Software & Werkzeuge",
  "#geschichte  – Historische Fakten",
].join("\n");

const TAGS_EN = [
  "Always use lowercase tags  (e.g. #english not #English)",
  "",
  "#vocabulary  – Words & Terms",
  "#grammar     – Language Rules",
  "#companies   – Brands & Organizations",
  "#persons     – Notable People",
  "#tools       – Software & Utilities",
  "#history     – Historical Facts",
].join("\n");

export default function CreateCard() {
  const { language } = getPreferenceValues<Preferences>();
  const isDE = language === "de";

  async function handleSubmit(values: { markdown: string }) {
    const input = values.markdown?.trim();

    if (!input) {
      await showToast({
        style: Toast.Style.Failure,
        title: isDE ? "Eingabe fehlt" : "Input missing",
        message: isDE ? "Bitte eine Karteikarte eingeben." : "Please enter a flashcard.",
      });
      return;
    }

    try {
      const parsed = parseMarkdown(input);

      if (!parsed.front) {
        await showToast({
          style: Toast.Style.Failure,
          title: isDE ? "Vorderseite fehlt" : "Front side missing",
          message: isDE
            ? "Die Karteikarte braucht mindestens eine Frage/einen Begriff."
            : "The flashcard needs at least a question or term.",
        });
        return;
      }

      const card: Flashcard = {
        ...parsed,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        progress: "unanswered",
        createdAt: Date.now(),
      };

      await saveCard(card);
      await showToast({
        style: Toast.Style.Success,
        title: isDE ? "Karteikarte gespeichert!" : "Flashcard saved!",
        message: `"${card.front}"`,
      });
      // Formular schließen und zurück zur Hauptansicht
      await popToRoot();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: isDE ? "Fehler beim Parsen" : "Parse error",
        message: String(e),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={isDE ? "Karteikarte speichern" : "Save Flashcard"}
            icon={Icon.CheckCircle}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="markdown"
        title={isDE ? "Karteikarte" : "Flashcard"}
        placeholder={isDE ? "Titel\n==\nAntwort\n#tag" : "Title\n==\nAnswer\n#tag"}
        info={isDE ? "Trennzeichen: == (Standard) oder ==< (Multiple Choice)" : "Separator: == (standard) or ==< (multiple choice)"}
      />
      <Form.Separator />

      {/* ── Standard-Karte: Schritte ── */}
      <Form.Description
        title={isDE ? "Syntax-Referenz" : "Syntax Reference"}
        text={isDE ? STEPS_DE : STEPS_EN}
      />
      <Form.Description
        title={isDE ? "Beispiel" : "Example"}
        text={isDE ? EXAMPLE_DE : EXAMPLE_EN}
      />

      <Form.Separator />

      {/* ── Multiple-Choice: Schritte ── */}
      <Form.Description
        title=""
        text={isDE ? MC_STEPS_DE : MC_STEPS_EN}
      />
      <Form.Description
        title={isDE ? "Beispiel" : "Example"}
        text={isDE ? MC_EXAMPLE_DE : MC_EXAMPLE_EN}
      />

      <Form.Separator />

      {/* ── Tag-Kategorien ── */}
      <Form.Description
        title={isDE ? "Tag-Kategorien" : "Tag Categories"}
        text={isDE ? TAGS_DE : TAGS_EN}
      />
    </Form>
  );
}
