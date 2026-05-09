import {
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  getPreferenceValues,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState, useCallback } from "react";
import { Flashcard, Preferences } from "./types";
import { getAllCards } from "./utils/storage";

// ── Karten-Detail-Ansicht für einen Tag ──────────────────────────────────────

function cardDetailMarkdown(card: Flashcard, isDE: boolean): string {
  if (card.type === "standard") {
    return `## ${isDE ? "Antwort" : "Answer"}\n\n${card.back || "—"}`;
  }
  const lines = (card.options ?? []).map((o) => {
    const correct = o.id === card.correctOption;
    return `${correct ? "✅" : "⬜"} **${o.id}.** ${o.text}`;
  });
  return `## ${isDE ? "Optionen" : "Options"}\n\n${lines.join("\n\n")}`;
}

function CardsForTag({ tag, cards, isDE }: { tag: string; cards: Flashcard[]; isDE: boolean }) {
  const filtered = cards.filter((c) => c.tags.includes(tag));

  return (
    <List
      isShowingDetail
      navigationTitle={`#${tag}`}
      searchBarPlaceholder={isDE ? "Karten durchsuchen…" : "Search cards…"}
    >
      {filtered.length === 0 ? (
        <List.EmptyView icon={Icon.Tag} title={isDE ? "Keine Karten für diesen Tag" : "No cards for this tag"} />
      ) : (
        filtered.map((card) => (
          <List.Item
            key={card.id}
            icon={card.type === "multiple-choice" ? Icon.List : Icon.TextCursor}
            title={card.front}
            accessories={[
              card.progress === "correct"
                ? { tag: { value: "✓", color: Color.Green } }
                : card.progress === "wrong"
                ? { tag: { value: "✗", color: Color.Red } }
                : { tag: { value: "·", color: Color.SecondaryText } },
            ]}
            detail={<List.Item.Detail markdown={cardDetailMarkdown(card, isDE)} />}
          />
        ))
      )}
    </List>
  );
}

// ── Haupt-Tag-Liste ───────────────────────────────────────────────────────────

export default function Tags() {
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

  // Alle Tags mit Kartenanzahl berechnen
  const tagMap = cards.reduce<Record<string, number>>((acc, card) => {
    card.tags.forEach((t) => {
      acc[t] = (acc[t] ?? 0) + 1;
    });
    return acc;
  }, {});

  const tags = Object.entries(tagMap).sort(([a], [b]) => a.localeCompare(b));

  // Karten ohne Tag
  const untagged = cards.filter((c) => c.tags.length === 0);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={isDE ? "Tags durchsuchen…" : "Search tags…"}
    >
      {tags.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Tag}
          title={isDE ? "Noch keine Tags" : "No tags yet"}
          description={isDE
            ? 'Füge Tags mit #tagname am Ende einer Karteikarte hinzu.'
            : 'Add tags with #tagname at the end of a flashcard.'}
        />
      ) : (
        <>
          <List.Section title={isDE ? "Tags" : "Tags"}>
            {tags.map(([tag, count]) => (
              <List.Item
                key={tag}
                icon={Icon.Tag}
                title={`#${tag}`}
                accessories={[
                  {
                    text: `${count} ${isDE ? (count === 1 ? "Karte" : "Karten") : count === 1 ? "card" : "cards"}`,
                  },
                ]}
                actions={
                  <ActionPanel>
                    <Action
                      title={isDE ? "Karten anzeigen" : "Show cards"}
                      icon={Icon.ArrowRight}
                      onAction={() =>
                        push(<CardsForTag tag={tag} cards={cards} isDE={isDE} />)
                      }
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>

          {untagged.length > 0 && (
            <List.Section title={isDE ? "Ohne Tag" : "Untagged"}>
              <List.Item
                icon={Icon.QuestionMark}
                title={isDE ? "Karten ohne Tag" : "Cards without tag"}
                accessories={[{ text: `${untagged.length}` }]}
                actions={
                  <ActionPanel>
                    <Action
                      title={isDE ? "Anzeigen" : "Show"}
                      icon={Icon.ArrowRight}
                      onAction={() =>
                        push(
                          <CardsForTag
                            tag={"__untagged__"}
                            cards={cards.map((c) =>
                              c.tags.length === 0 ? { ...c, tags: ["__untagged__"] } : c
                            )}
                            isDE={isDE}
                          />
                        )
                      }
                    />
                  </ActionPanel>
                }
              />
            </List.Section>
          )}
        </>
      )}
    </List>
  );
}
