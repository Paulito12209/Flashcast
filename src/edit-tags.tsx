import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  getPreferenceValues,
  Icon,
  useNavigation,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { Flashcard, Preferences } from "./types";
import { saveCard, getAllTags } from "./utils/storage";

interface Props {
  card: Flashcard;
  /** Wird nach dem Speichern aufgerufen, um die Elternliste zu aktualisieren. */
  onSaved?: () => void;
}

export default function EditTags({ card, onSaved }: Props) {
  const { language } = getPreferenceValues<Preferences>();
  const isDE = language === "de";
  const { pop } = useNavigation();

  // Tags mit # vorformatiert als Standardwert anzeigen
  const [tagInput, setTagInput] = useState(card.tags.map((t) => `#${t}`).join(" "));
  const [existingTags, setExistingTags] = useState<string[]>([]);

  // Bereits verwendete Tags aus dem Storage laden (als Vorschläge)
  useEffect(() => {
    getAllTags().then(setExistingTags);
  }, []);

  // Hilfetext: bereits verwendete Tags anzeigen
  const suggestionsText =
    existingTags.length > 0
      ? (isDE ? "Bereits verwendet: " : "Already used: ") +
        existingTags.map((t) => `#${t}`).join("  ")
      : isDE
        ? "Noch keine Tags vorhanden."
        : "No tags created yet.";

  async function handleSubmit(values: { tags: string }) {
    // Tags aus der Eingabe parsen – Leerzeichen- oder Komma-getrennt, mit oder ohne #
    // Normalisierung: Kleinschreibung + Duplikate entfernen
    const raw = values.tags.trim();
    const parsed: string[] = raw.length === 0
      ? []
      : [...new Set(
          raw
            .split(/[\s,]+/)
            .map((t) => t.replace(/^#/, "").trim().toLowerCase())
            .filter(Boolean)
        )];

    const updated: Flashcard = { ...card, tags: parsed };

    try {
      await saveCard(updated);
      await showToast({
        style: Toast.Style.Success,
        title: isDE ? "Tags gespeichert!" : "Tags saved!",
        message:
          parsed.length === 0
            ? isDE ? "Alle Tags entfernt." : "All tags removed."
            : parsed.map((t) => `#${t}`).join(" "),
      });
      onSaved?.();
      pop();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: isDE ? "Fehler beim Speichern" : "Error saving",
        message: String(e),
      });
    }
  }

  return (
    <Form
      navigationTitle={isDE ? `Tags bearbeiten – ${card.front}` : `Edit Tags – ${card.front}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={isDE ? "Tags speichern" : "Save Tags"}
            icon={Icon.CheckCircle}
            onSubmit={handleSubmit}
          />
          <Action
            title={isDE ? "Abbrechen" : "Cancel"}
            icon={Icon.XMarkCircle}
            shortcut={{ modifiers: ["cmd"], key: "." }}
            onAction={pop}
          />
        </ActionPanel>
      }
    >
      {/* Karten-Vorschau */}
      <Form.Description
        title={isDE ? "Karteikarte" : "Flashcard"}
        text={card.front}
      />
      <Form.Separator />

      {/* Tag-Eingabe */}
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder={isDE ? "#vokabular #grammatik #unternehmen" : "#vocabulary #grammar #companies"}
        value={tagInput}
        onChange={setTagInput}
        info={
          isDE
            ? "Tags mit # eingeben, durch Leerzeichen oder Komma trennen.\nBeispiele: #vokabular  #personen  #tools  #unternehmen"
            : "Enter tags with #, separated by spaces or commas.\nExamples: #vocabulary  #persons  #tools  #companies"
        }
      />

      {/* Vorhandene Tags als Hilfe anzeigen */}
      <Form.Description
        title={isDE ? "Vorhandene Tags" : "Existing Tags"}
        text={suggestionsText}
      />

      <Form.Separator />

      {/* Hinweise zur Syntax */}
      <Form.Description
        title={isDE ? "Hinweise" : "Tips"}
        text={
          isDE
            ? [
                "• Tags beginnen mit # (das # kann auch weggelassen werden)",
                "• Mehrere Tags durch Leerzeichen oder Komma trennen",
                "• Groß-/Kleinschreibung wird ignoriert",
                "• Feld leer lassen, um alle Tags zu entfernen",
                "",
                "Beispiel-Kategorien:",
                "  #vokabular   – Fremdwörter & Begriffe",
                "  #unternehmen – Firmen & Marken",
                "  #personen    – Wichtige Persönlichkeiten",
                "  #tools       – Software & Werkzeuge",
                "  #grammatik   – Sprachregeln",
              ].join("\n")
            : [
                "• Tags start with # (the # can be omitted)",
                "• Separate multiple tags with spaces or commas",
                "• Case is ignored",
                "• Leave the field empty to remove all tags",
                "",
                "Example categories:",
                "  #vocabulary  – Words & Terms",
                "  #companies   – Brands & Organizations",
                "  #persons     – Notable People",
                "  #tools       – Software & Utilities",
                "  #grammar     – Language Rules",
              ].join("\n")
        }
      />
    </Form>
  );
}
