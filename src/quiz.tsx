import {
  Detail,
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  getPreferenceValues,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState, useCallback } from "react";
import { Flashcard, Preferences } from "./types";
import { getAllCards, getAllTags, updateProgress } from "./utils/storage";

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Standard-Karte Quiz ───────────────────────────────────────────────────────

function StandardCardQuiz({
  card,
  index,
  total,
  isDE,
  onAnswer,
}: {
  card: Flashcard;
  index: number;
  total: number;
  isDE: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  const frontMd = `# ${card.front}\n\n---\n\n*${isDE ? "Drücke Enter zum Aufdecken" : "Press Enter to reveal"}*`;

  const backMd = `# ${card.front}\n\n---\n\n## ${isDE ? "Antwort" : "Answer"}\n\n**${card.back}**`;

  return (
    <Detail
      navigationTitle={`${isDE ? "Karte" : "Card"} ${index + 1} / ${total}`}
      markdown={revealed ? backMd : frontMd}
      actions={
        <ActionPanel>
          {!revealed ? (
            <Action
              title={isDE ? "Aufdecken" : "Reveal"}
              icon={Icon.Eye}
              onAction={() => setRevealed(true)}
            />
          ) : (
            <>
              <Action
                title={isDE ? "Richtig ✓" : "Correct ✓"}
                icon={{ source: Icon.CheckCircle, tintColor: Color.Green }}
                shortcut={{ modifiers: [], key: "arrowRight" }}
                onAction={() => onAnswer(true)}
              />
              <Action
                title={isDE ? "Falsch ✗" : "Wrong ✗"}
                icon={{ source: Icon.XMarkCircle, tintColor: Color.Red }}
                shortcut={{ modifiers: [], key: "arrowLeft" }}
                onAction={() => onAnswer(false)}
              />
            </>
          )}
        </ActionPanel>
      }
    />
  );
}

// ── Multiple-Choice-Karte Quiz ────────────────────────────────────────────────

function MCCardQuiz({
  card,
  index,
  total,
  isDE,
  onAnswer,
}: {
  card: Flashcard;
  index: number;
  total: number;
  isDE: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const isAnswered = selected !== null;
  const isCorrect = selected === card.correctOption;

  function getOptionIcon(optionId: number) {
    if (!isAnswered) return Icon.Circle;
    if (optionId === card.correctOption) return Icon.CheckCircle;
    if (optionId === selected) return Icon.XMarkCircle;
    return Icon.Circle;
  }

  function getOptionColor(optionId: number): Color | undefined {
    if (!isAnswered) return undefined;
    if (optionId === card.correctOption) return Color.Green;
    if (optionId === selected) return Color.Red;
    return Color.SecondaryText;
  }

  const questionMd = isAnswered
    ? `# ${card.front}\n\n---\n\n${isCorrect ? "✅ " + (isDE ? "Richtig!" : "Correct!") : "❌ " + (isDE ? "Falsch!" : "Wrong!")}`
    : `# ${card.front}`;

  return (
    <List
      navigationTitle={`${isDE ? "Karte" : "Card"} ${index + 1} / ${total}`}
      isShowingDetail
    >
      <List.Section title={isDE ? "Frage" : "Question"}>
        <List.Item
          title={card.front}
          detail={<List.Item.Detail markdown={questionMd} />}
        />
      </List.Section>

      <List.Section title={isDE ? "Antwortmöglichkeiten" : "Options"}>
        {(card.options ?? []).map((opt) => (
          <List.Item
            key={opt.id}
            icon={{ source: getOptionIcon(opt.id), tintColor: getOptionColor(opt.id) }}
            title={`${opt.id}. ${opt.text}`}
            accessories={
              isAnswered && opt.id === card.correctOption
                ? [{ tag: { value: isDE ? "Richtig" : "Correct", color: Color.Green } }]
                : isAnswered && opt.id === selected
                ? [{ tag: { value: isDE ? "Falsch" : "Wrong", color: Color.Red } }]
                : []
            }
            actions={
              <ActionPanel>
                {!isAnswered ? (
                  <Action
                    title={isDE ? `Option ${opt.id} wählen` : `Choose option ${opt.id}`}
                    onAction={() => setSelected(opt.id)}
                  />
                ) : (
                  <Action
                    title={isDE ? "Weiter →" : "Next →"}
                    icon={Icon.ArrowRight}
                    onAction={() => onAnswer(isCorrect)}
                  />
                )}
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

// ── Quiz-Session ──────────────────────────────────────────────────────────────

function QuizSession({ cards, isDE }: { cards: Flashcard[]; isDE: boolean }) {
  const [queue] = useState(() => shuffle(cards));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);
  const { pop } = useNavigation();

  const card = queue[index];

  async function handleAnswer(correct: boolean) {
    await updateProgress(card.id, correct ? "correct" : "wrong");
    setResults((r) => ({ ...r, correct: r.correct + (correct ? 1 : 0), wrong: r.wrong + (correct ? 0 : 1) }));

    await showToast({
      style: correct ? Toast.Style.Success : Toast.Style.Failure,
      title: correct ? (isDE ? "Richtig! ✓" : "Correct! ✓") : (isDE ? "Falsch ✗" : "Wrong ✗"),
    });

    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (done) {
    const total = queue.length;
    const pct = Math.round((results.correct / total) * 100);
    const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪";
    const summaryMd = `# ${emoji} ${isDE ? "Quiz abgeschlossen!" : "Quiz complete!"}

---

| | |
|---|---|
| ${isDE ? "Richtig" : "Correct"} | **${results.correct} / ${total}** |
| ${isDE ? "Falsch" : "Wrong"} | **${results.wrong} / ${total}** |
| ${isDE ? "Ergebnis" : "Score"} | **${pct}%** |

---

*${isDE ? "Fortschritt wurde gespeichert." : "Progress has been saved."}*`;

    return (
      <Detail
        navigationTitle={isDE ? "Quiz beendet" : "Quiz done"}
        markdown={summaryMd}
        actions={
          <ActionPanel>
            <Action title={isDE ? "Zurück" : "Back"} icon={Icon.ArrowLeft} onAction={pop} />
          </ActionPanel>
        }
      />
    );
  }

  if (!card) return null;

  return card.type === "standard" ? (
    <StandardCardQuiz card={card} index={index} total={queue.length} isDE={isDE} onAnswer={handleAnswer} />
  ) : (
    <MCCardQuiz card={card} index={index} total={queue.length} isDE={isDE} onAnswer={handleAnswer} />
  );
}

// ── Tag-Auswahl für Quiz ──────────────────────────────────────────────────────

function TagSelector({
  allCards,
  tags,
  isDE,
}: {
  allCards: Flashcard[];
  tags: string[];
  isDE: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { push } = useNavigation();

  function toggleTag(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function startQuiz() {
    const filtered =
      selected.size === 0
        ? allCards
        : allCards.filter((c) => c.tags.some((t) => selected.has(t)));

    if (filtered.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: isDE ? "Keine Karten gefunden" : "No cards found",
      });
      return;
    }
    push(<QuizSession cards={filtered} isDE={isDE} />);
  }

  return (
    <List
      navigationTitle={isDE ? "Tags auswählen" : "Select tags"}
      searchBarPlaceholder={isDE ? "Tags filtern…" : "Filter tags…"}
    >
      <List.Section
        title={isDE ? "Tags auswählen (mehrere möglich)" : "Select tags (multiple allowed)"}
        subtitle={selected.size === 0 ? (isDE ? "Alle" : "All") : `${selected.size} ${isDE ? "ausgewählt" : "selected"}`}
      >
        {tags.map((tag) => {
          const isSelected = selected.has(tag);
          const count = allCards.filter((c) => c.tags.includes(tag)).length;
          return (
            <List.Item
              key={tag}
              icon={isSelected ? { source: Icon.CheckCircle, tintColor: Color.Blue } : Icon.Circle}
              title={`#${tag}`}
              accessories={[{ text: `${count}` }]}
              actions={
                <ActionPanel>
                  <Action
                    title={isSelected ? (isDE ? "Abwählen" : "Deselect") : (isDE ? "Auswählen" : "Select")}
                    onAction={() => toggleTag(tag)}
                  />
                  <Action
                    title={isDE ? `Quiz starten (${selected.size === 0 ? isDE ? "alle" : "all" : selected.size + " Tags"})` : `Start quiz`}
                    icon={Icon.Play}
                    onAction={startQuiz}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}

// ── Modus-Auswahl ─────────────────────────────────────────────────────────────

function ModeSelector({
  allCards,
  tags,
  isDE,
}: {
  allCards: Flashcard[];
  tags: string[];
  isDE: boolean;
}) {
  const { push } = useNavigation();

  const wrongCards = allCards.filter((c) => c.progress === "wrong");
  const newCards = allCards.filter((c) => c.progress === "unanswered");

  function startWrongCards() {
    if (wrongCards.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: isDE ? "Keine falschen Karten" : "No wrong cards",
        message: isDE ? "Du hast noch keine Karte falsch beantwortet." : "You haven't answered any card wrong yet.",
      });
      return;
    }
    push(<QuizSession cards={wrongCards} isDE={isDE} />);
  }

  function startNewCards() {
    if (newCards.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: isDE ? "Keine neuen Karten" : "No new cards",
      });
      return;
    }
    push(<QuizSession cards={newCards} isDE={isDE} />);
  }

  function startByTag() {
    push(<TagSelector allCards={allCards} tags={tags} isDE={isDE} />);
  }

  function startAll() {
    if (allCards.length === 0) {
      showToast({ style: Toast.Style.Failure, title: isDE ? "Keine Karten vorhanden" : "No cards available" });
      return;
    }
    push(<QuizSession cards={allCards} isDE={isDE} />);
  }

  return (
    <List navigationTitle={isDE ? "Quiz-Modus wählen" : "Choose quiz mode"}>
      <List.Section title={isDE ? "Modus auswählen" : "Select mode"}>
        <List.Item
          icon={{ source: Icon.XMarkCircle, tintColor: Color.Red }}
          title={isDE ? "Falsche Karten" : "Wrong cards"}
          subtitle={`${wrongCards.length} ${isDE ? "Karten" : "cards"}`}
          actions={
            <ActionPanel>
              <Action title={isDE ? "Quiz starten" : "Start quiz"} icon={Icon.Play} onAction={startWrongCards} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={{ source: Icon.Circle, tintColor: Color.SecondaryText }}
          title={isDE ? "Neue Karten" : "New cards"}
          subtitle={`${newCards.length} ${isDE ? "Karten" : "cards"}`}
          actions={
            <ActionPanel>
              <Action title={isDE ? "Quiz starten" : "Start quiz"} icon={Icon.Play} onAction={startNewCards} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Tag}
          title={isDE ? "Nach Tags" : "By tags"}
          subtitle={isDE ? "Tags auswählen" : "Select tags"}
          actions={
            <ActionPanel>
              <Action title={isDE ? "Tags auswählen" : "Select tags"} icon={Icon.ArrowRight} onAction={startByTag} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Book}
          title={isDE ? "Alle Karten" : "All cards"}
          subtitle={`${allCards.length} ${isDE ? "Karten" : "cards"}`}
          actions={
            <ActionPanel>
              <Action title={isDE ? "Quiz starten" : "Start quiz"} icon={Icon.Play} onAction={startAll} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

// ── Haupt-Quiz-Screen ─────────────────────────────────────────────────────────

export default function Quiz() {
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = getPreferenceValues<Preferences>();
  const isDE = language === "de";
  const { push } = useNavigation();

  useEffect(() => {
    async function load() {
      const [cards, tagList] = await Promise.all([getAllCards(), getAllTags()]);
      setAllCards(cards);
      setTags(tagList);
      setIsLoading(false);
    }
    load();
  }, []);

  const wrongCount = allCards.filter((c) => c.progress === "wrong").length;
  const correctCount = allCards.filter((c) => c.progress === "correct").length;
  const newCount = allCards.filter((c) => c.progress === "unanswered").length;

  const summaryMd = `# 🃏 Flashcards Quiz

---

| | |
|---|---|
| ${isDE ? "Gesamt" : "Total"} | **${allCards.length}** |
| ${isDE ? "Neu" : "New"} | **${newCount}** |
| ✓ ${isDE ? "Richtig" : "Correct"} | **${correctCount}** |
| ✗ ${isDE ? "Falsch" : "Wrong"} | **${wrongCount}** |

---

*${isDE ? "Drücke ⌘K um einen Modus zu wählen und das Quiz zu starten." : "Press ⌘K to choose a mode and start the quiz."}*`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={summaryMd}
      actions={
        <ActionPanel>
          <Action
            title={isDE ? "Quiz starten" : "Start quiz"}
            icon={Icon.Play}
            onAction={() => push(<ModeSelector allCards={allCards} tags={tags} isDE={isDE} />)}
          />
        </ActionPanel>
      }
    />
  );
}
