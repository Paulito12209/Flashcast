import { Form, ActionPanel, Action, showToast, Toast, getPreferenceValues, Icon } from "@raycast/api";
import { parseMarkdown } from "./utils/parser";
import { saveCard } from "./utils/storage";
import { Flashcard, Preferences } from "./types";

const SYNTAX_DE = [
  "── Standard-Karte ──────────────────────────────────────────────",
  "1. Titel eingeben             → z.B. \"Photosynthese\"",
  "2. Leerzeile + == + Leerzeile → Trenner zwischen Vorder- und Rückseite",
  "3. Antwort eingeben           → z.B. \"Prozess, bei dem Pflanzen...\"",
  "4. Tags anhängen (optional)   → z.B. #biologie #schule",
  "",
  "Beispiel:",
  "  Photosynthese",
  "",
  "  ==",
  "",
  "  Prozess, bei dem Pflanzen aus Licht und CO₂ Zucker herstellen.",
  "",
  "  #biologie #schule",
  "",
  "── Multiple-Choice-Karte ────────────────────────────────────────",
  "1. Frage eingeben",
  "2. ==< als Trenner (statt ==)",
  "3. Optionen im Format  1: Text  2: Text  3: Text",
  "4. -- als Trenner zur richtigen Antwort",
  "5. richtig: 2  (Nummer der korrekten Option)",
  "6. Tags anhängen",
  "",
  "Beispiel:",
  "  Wann wurde die EU gegründet?",
  "",
  "  ==<",
  "",
  "  1: 1945",
  "  2: 1957",
  "  3: 1993",
  "",
  "  --",
  "",
  "  richtig: 2",
  "",
  "  #geschichte #politik",
  "",
  "── Tag-Kategorien (Beispiele) ──────────────────────────────────",
  "  #vokabular   – Fremdwörter & Begriffe",
  "  #grammatik   – Sprachregeln",
  "  #unternehmen – Firmen & Marken",
  "  #personen    – Wichtige Persönlichkeiten",
  "  #tools       – Software & Werkzeuge",
  "  #geschichte  – Historische Fakten",
].join("\n");

const SYNTAX_EN = [
  "── Standard card ───────────────────────────────────────────────",
  "1. Enter the title            → e.g. \"Photosynthesis\"",
  "2. Blank line + == + blank    → separator between front and back",
  "3. Enter the answer           → e.g. \"Process in which plants...\"",
  "4. Add tags (optional)        → e.g. #biology #school",
  "",
  "Example:",
  "  Photosynthesis",
  "",
  "  ==",
  "",
  "  Process by which plants convert light and CO₂ into sugar.",
  "",
  "  #biology #school",
  "",
  "── Multiple-choice card ────────────────────────────────────────",
  "1. Enter the question",
  "2. ==< as separator (instead of ==)",
  "3. Options in format  1: Text  2: Text  3: Text",
  "4. -- as separator before the correct answer",
  "5. true: 2  (number of the correct option)",
  "6. Add tags",
  "",
  "Example:",
  "  When was the EU founded?",
  "",
  "  ==<",
  "",
  "  1: 1945",
  "  2: 1957",
  "  3: 1993",
  "",
  "  --",
  "",
  "  true: 2",
  "",
  "  #history #politics",
  "",
  "── Tag categories (examples) ───────────────────────────────────",
  "  #vocabulary  – Words & Terms",
  "  #grammar     – Language Rules",
  "  #companies   – Brands & Organizations",
  "  #persons     – Notable People",
  "  #tools       – Software & Utilities",
  "  #history     – Historical Facts",
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
        placeholder={isDE ? "Frage\n\n==\n\nAntwort\n\n#tag" : "Question\n\n==\n\nAnswer\n\n#tag"}
        info={isDE ? "Trennzeichen: == (Standard) oder ==< (Multiple Choice)" : "Separator: == (standard) or ==< (multiple choice)"}
      />
      <Form.Separator />
      <Form.Description
        title={isDE ? "Syntax-Referenz" : "Syntax Reference"}
        text={isDE ? SYNTAX_DE : SYNTAX_EN}
      />
    </Form>
  );
}
