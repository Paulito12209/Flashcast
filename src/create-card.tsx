import { Form, ActionPanel, Action, showToast, Toast, getPreferenceValues, Icon } from "@raycast/api";
import { useState } from "react";
import { parseMarkdown } from "./utils/parser";
import { saveCard } from "./utils/storage";
import { Flashcard, Preferences } from "./types";

const SYNTAX_DE = [
  "── Standard-Karte ──────────────────",
  "Frage oder Begriff",
  "",
  "==",
  "",
  "Antwort",
  "",
  "#tag1 #tag2",
  "",
  "── Multiple Choice ─────────────────",
  "Frage",
  "",
  "==<",
  "",
  "1: Erste Option",
  "2: Zweite Option",
  "3: Dritte Option",
  "",
  "--",
  "",
  "richtig: 2",
  "",
  "#tag1 #tag2",
].join("\n");

const SYNTAX_EN = [
  "── Standard card ───────────────────",
  "Question or term",
  "",
  "==",
  "",
  "Answer",
  "",
  "#tag1 #tag2",
  "",
  "── Multiple Choice ─────────────────",
  "Question",
  "",
  "==<",
  "",
  "1: First option",
  "2: Second option",
  "3: Third option",
  "",
  "--",
  "",
  "true: 2",
  "",
  "#tag1 #tag2",
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
