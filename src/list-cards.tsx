import {
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  getPreferenceValues,
  showToast,
  Toast,
  Alert,
  confirmAlert,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState, useCallback } from "react";
import { Flashcard, Preferences } from "./types";
import { getAllCards, deleteCard, deleteAllCards } from "./utils/storage";
import EditTags from "./edit-tags";

function cardDetailMarkdown(card: Flashcard, isDE: boolean): string {
  if (card.type === "standard") {
    return `## ${isDE ? "Antwort" : "Answer"}\n\n${card.back || "—"}`;
  }

  const optionLines = (card.options ?? [])
    .map((o) => {
      const isCorrect = o.id === card.correctOption;
      return `${isCorrect ? "✅" : "⬜"} **${o.id}.** ${o.text}`;
    })
    .join("\n\n");

  return `## ${isDE ? "Optionen" : "Options"}\n\n${optionLines}`;
}

function progressAccessory(card: Flashcard, isDE: boolean) {
  if (card.progress === "correct") {
    return { tag: { value: "✓", color: Color.Green }, tooltip: isDE ? "Richtig beantwortet" : "Answered correctly" };
  }
  if (card.progress === "wrong") {
    return { tag: { value: "✗", color: Color.Red }, tooltip: isDE ? "Falsch beantwortet" : "Answered wrong" };
  }
  return { tag: { value: "·", color: Color.SecondaryText }, tooltip: isDE ? "Noch nicht abgefragt" : "Not yet quizzed" };
}

export default function ListCards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = getPreferenceValues<Preferences>();
  const isDE = language === "de";
  const { push } = useNavigation();

  const loadCards = useCallback(async () => {
    setIsLoading(true);
    setCards(await getAllCards());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  async function handleDelete(card: Flashcard) {
    const confirmed = await confirmAlert({
      title: isDE ? "Karteikarte löschen?" : "Delete flashcard?",
      message: `"${card.front}"`,
      primaryAction: {
        title: isDE ? "Löschen" : "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });
    if (confirmed) {
      await deleteCard(card.id);
      await showToast({ style: Toast.Style.Success, title: isDE ? "Gelöscht" : "Deleted" });
      loadCards();
    }
  }

  async function handleDeleteAll() {
    const confirmed = await confirmAlert({
      title: isDE ? "Alle Karteikarten löschen?" : "Delete all flashcards?",
      message: isDE
        ? "Diese Aktion kann nicht rückgängig gemacht werden."
        : "This action cannot be undone.",
      primaryAction: {
        title: isDE ? "Alle löschen" : "Delete all",
        style: Alert.ActionStyle.Destructive,
      },
    });
    if (confirmed) {
      await deleteAllCards();
      await showToast({
        style: Toast.Style.Success,
        title: isDE ? "Alle Karten gelöscht" : "All cards deleted",
      });
      loadCards();
    }
  }

  const typeIcon = (card: Flashcard) =>
    card.type === "multiple-choice" ? Icon.List : Icon.TextCursor;

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder={isDE ? "Karteikarten durchsuchen…" : "Search flashcards…"}
    >
      {cards.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Book}
          title={isDE ? "Noch keine Karteikarten" : "No flashcards yet"}
          description={isDE ? 'Erstelle deine erste Karte mit dem Command "Erstellen".' : 'Create your first card with the "Erstellen" command.'}
        />
      ) : (
        cards.map((card) => (
          <List.Item
            key={card.id}
            icon={typeIcon(card)}
            title={card.front}
            accessories={[
              progressAccessory(card, isDE),
              ...card.tags.map((t) => ({ tag: `#${t}` })),
            ]}
            detail={
              <List.Item.Detail
                markdown={cardDetailMarkdown(card, isDE)}
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label
                      title={isDE ? "Typ" : "Type"}
                      text={card.type === "standard" ? (isDE ? "Standard" : "Standard") : "Multiple Choice"}
                    />
                    <List.Item.Detail.Metadata.Label
                      title={isDE ? "Status" : "Status"}
                      text={
                        card.progress === "correct"
                          ? isDE ? "✓ Richtig" : "✓ Correct"
                          : card.progress === "wrong"
                          ? isDE ? "✗ Falsch" : "✗ Wrong"
                          : isDE ? "· Neu" : "· New"
                      }
                    />
                    {card.tags.length > 0 && (
                      <List.Item.Detail.Metadata.TagList title="Tags">
                        {card.tags.map((t) => (
                          <List.Item.Detail.Metadata.TagList.Item key={t} text={`#${t}`} />
                        ))}
                      </List.Item.Detail.Metadata.TagList>
                    )}
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Label
                      title={isDE ? "Erstellt" : "Created"}
                      text={new Date(card.createdAt).toLocaleDateString(isDE ? "de-DE" : "en-US")}
                    />
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                {/* Tags bearbeiten – öffnet dediziertes Formular */}
                <Action
                  title={isDE ? "Tags bearbeiten" : "Edit Tags"}
                  icon={Icon.Tag}
                  shortcut={{ modifiers: ["cmd"], key: "t" }}
                  onAction={() =>
                    push(<EditTags card={card} onSaved={loadCards} />)
                  }
                />
                <Action
                  title={isDE ? "Löschen" : "Delete"}
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["ctrl"], key: "x" }}
                  onAction={() => handleDelete(card)}
                />
                <Action
                  title={isDE ? "Alle löschen" : "Delete All"}
                  icon={Icon.XMarkCircle}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
                  onAction={handleDeleteAll}
                />
                <Action
                  title={isDE ? "Aktualisieren" : "Refresh"}
                  icon={Icon.RotateClockwise}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={loadCards}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
