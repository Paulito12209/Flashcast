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
import { t } from "./utils/i18n";

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
  language,
  onAnswer,
}: {
  card: Flashcard;
  index: number;
  total: number;
  language: string;
  onAnswer: (correct: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  const frontMd = `# ${card.front}\n\n---\n\n*${t(language, "reveal")}*`;

  const backMd = `# ${card.front}\n\n---\n\n## ${t(language, "answer")}\n\n**${card.back}**`;

  return (
    <Detail
      navigationTitle={`${t(language, "card")} ${index + 1} / ${total}`}
      markdown={revealed ? backMd : frontMd}
      actions={
        <ActionPanel>
          {!revealed ? (
            <Action
              title={t(language, "reveal")}
              icon={Icon.Eye}
              onAction={() => setRevealed(true)}
            />
          ) : (
            <>
              <Action
                title={t(language, "correct.btn")}
                icon={{ source: Icon.CheckCircle, tintColor: Color.Green }}
                shortcut={{ modifiers: [], key: "arrowRight" }}
                onAction={() => onAnswer(true)}
              />
              <Action
                title={t(language, "wrong.btn")}
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
  language,
  onAnswer,
}: {
  card: Flashcard;
  index: number;
  total: number;
  language: string;
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
    ? `# ${card.front}\n\n---\n\n${isCorrect ? "✅ " + t(language, "correct.msg") : "❌ " + t(language, "wrong.msg")}`
    : `# ${card.front}`;

  return (
    <List
      navigationTitle={`${t(language, "card")} ${index + 1} / ${total}`}
      isShowingDetail
    >
      <List.Section title={t(language, "question")}>
        <List.Item
          title={card.front}
          detail={<List.Item.Detail markdown={questionMd} />}
        />
      </List.Section>

      <List.Section title={t(language, "options")}>
        {(card.options ?? []).map((opt) => (
          <List.Item
            key={opt.id}
            icon={{ source: getOptionIcon(opt.id), tintColor: getOptionColor(opt.id) }}
            title={`${opt.id}. ${opt.text}`}
            accessories={
              isAnswered && opt.id === card.correctOption
                ? [{ tag: { value: t(language, "correct.msg").replace("!", ""), color: Color.Green } }]
                : isAnswered && opt.id === selected
                ? [{ tag: { value: t(language, "wrong.msg").replace("!", ""), color: Color.Red } }]
                : []
            }
            actions={
              <ActionPanel>
                {!isAnswered ? (
                  <Action
                    title={`${t(language, "choose.opt")} ${opt.id}`}
                    onAction={() => setSelected(opt.id)}
                  />
                ) : (
                  <Action
                    title={t(language, "next")}
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

function QuizSession({ cards, language }: { cards: Flashcard[]; language: string }) {
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
      title: correct ? t(language, "correct.btn") : t(language, "wrong.btn"),
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
    const summaryMd = `# ${emoji} ${t(language, "quiz.done")}

---

| | |
|---|---|
| ${t(language, "correct.msg").replace("!", "")} | **${results.correct} / ${total}** |
| ${t(language, "wrong.msg").replace("!", "")} | **${results.wrong} / ${total}** |
| ${t(language, "score")} | **${pct}%** |

---

*${t(language, "progress.saved")}*`;

    return (
      <Detail
        navigationTitle={t(language, "quiz.done")}
        markdown={summaryMd}
        actions={
          <ActionPanel>
            <Action title={t(language, "back")} icon={Icon.ArrowLeft} onAction={pop} />
          </ActionPanel>
        }
      />
    );
  }

  if (!card) return null;

  return card.type === "standard" ? (
    <StandardCardQuiz card={card} index={index} total={queue.length} language={language} onAnswer={handleAnswer} />
  ) : (
    <MCCardQuiz card={card} index={index} total={queue.length} language={language} onAnswer={handleAnswer} />
  );
}

// ── Tag-Auswahl für Quiz ──────────────────────────────────────────────────────

function TagSelector({
  allCards,
  tags,
  language,
}: {
  allCards: Flashcard[];
  tags: string[];
  language: string;
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
        : allCards.filter((c) => c.tags.some((tg) => selected.has(tg)));

    if (filtered.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: t(language, "no.cards.found"),
      });
      return;
    }
    push(<QuizSession cards={filtered} language={language} />);
  }

  return (
    <List
      navigationTitle={t(language, "select.tags")}
      searchBarPlaceholder={t(language, "filter.tags")}
    >
      <List.Section
        title={t(language, "select.multiple")}
        subtitle={selected.size === 0 ? t(language, "all") : `${selected.size} ${t(language, "selected")}`}
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
                    title={isSelected ? t(language, "deselect") : t(language, "select")}
                    onAction={() => toggleTag(tag)}
                  />
                  <Action
                    title={
                      `${t(language, "start.quiz")} (${selected.size === 0 ? t(language, "all").toLowerCase() : selected.size + " " + t(language, "tags")})`
                    }
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
  language,
}: {
  allCards: Flashcard[];
  tags: string[];
  language: string;
}) {
  const { push } = useNavigation();

  const wrongCards = allCards.filter((c) => c.progress === "wrong");
  const newCards = allCards.filter((c) => c.progress === "unanswered");

  function startWrongCards() {
    if (wrongCards.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: t(language, "no.wrong"),
        message: t(language, "no.wrong.msg"),
      });
      return;
    }
    push(<QuizSession cards={wrongCards} language={language} />);
  }

  function startNewCards() {
    if (newCards.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: t(language, "no.new"),
      });
      return;
    }
    push(<QuizSession cards={newCards} language={language} />);
  }

  function startByTag() {
    push(<TagSelector allCards={allCards} tags={tags} language={language} />);
  }

  function startAll() {
    if (allCards.length === 0) {
      showToast({ style: Toast.Style.Failure, title: t(language, "no.cards.avail") });
      return;
    }
    push(<QuizSession cards={allCards} language={language} />);
  }

  return (
    <List navigationTitle={t(language, "choose.mode")}>
      <List.Section title={t(language, "select.mode")}>
        <List.Item
          icon={{ source: Icon.XMarkCircle, tintColor: Color.Red }}
          title={t(language, "wrong.cards")}
          subtitle={`${wrongCards.length} ${t(language, "cards")}`}
          actions={
            <ActionPanel>
              <Action title={t(language, "start.quiz")} icon={Icon.Play} onAction={startWrongCards} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={{ source: Icon.Circle, tintColor: Color.SecondaryText }}
          title={t(language, "new.cards")}
          subtitle={`${newCards.length} ${t(language, "cards")}`}
          actions={
            <ActionPanel>
              <Action title={t(language, "start.quiz")} icon={Icon.Play} onAction={startNewCards} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Tag}
          title={t(language, "by.tags")}
          subtitle={t(language, "select.tags")}
          actions={
            <ActionPanel>
              <Action title={t(language, "select.tags")} icon={Icon.ArrowRight} onAction={startByTag} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Book}
          title={t(language, "all.cards")}
          subtitle={`${allCards.length} ${t(language, "cards")}`}
          actions={
            <ActionPanel>
              <Action title={t(language, "start.quiz")} icon={Icon.Play} onAction={startAll} />
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
| ${t(language, "total")} | **${allCards.length}** |
| ${t(language, "status.new")} | **${newCount}** |
| ${t(language, "status.correct")} | **${correctCount}** |
| ${t(language, "status.wrong")} | **${wrongCount}** |

---

*${t(language, "quiz.shortcut")}*`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={summaryMd}
      actions={
        <ActionPanel>
          <Action
            title={t(language, "start.quiz")}
            icon={Icon.Play}
            onAction={() => push(<ModeSelector allCards={allCards} tags={tags} language={language} />)}
          />
        </ActionPanel>
      }
    />
  );
}
