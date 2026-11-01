import { wordImageUrl } from '../../data/wordImages';
import { solutionSegments } from '../../logic/pluralPattern';
import type { AnswerResult, InputMode, PluralTask, QuizState, Word } from '../../types';
import { element } from '../dom';
import { createSpecialCharBar } from '../specialCharBar';
import { createTilesInput } from '../tilesInput';
import { texts } from '../texts';
import type { ExercisePanel, ExercisePanelCallbacks } from './panel';
import { celebrateCard, createSpeakButton, feedbackTitle } from './shared';

function renderFeedback(container: HTMLElement, result: AnswerResult | null, word: Word): void {
  container.replaceChildren();
  container.dataset['status'] = result?.status ?? '';
  if (result === null) return;

  switch (result.status) {
    case 'correct':
      container.append(feedbackTitle(result));
      if (result.capitalizationHint) {
        container.append(element('p', 'feedback-hint', texts.capitalizationHint));
      }
      break;
    case 'almost':
      container.append(feedbackTitle(result));
      break;
    case 'wrong': {
      container.append(element('p', 'feedback-hint', texts.solutionIntro));
      const solution = element('p', 'solution');
      solution.append(element('span', 'article', texts.pluralArticle), ' ');
      for (const segment of solutionSegments(word)) {
        solution.append(
          segment.highlight ? element('mark', 'solution-part', segment.text) : segment.text,
        );
      }
      container.append(solution);
      break;
    }
  }
}

/** Spielart Mehrzahl: Aufgabe im Tastatur- oder Bausteine-Modus. Hält keinen eigenen Spielzustand. */
export function createPluralPanel(callbacks: ExercisePanelCallbacks): ExercisePanel<PluralTask> {
  const panel = element('section', 'task-panel');
  panel.dataset['exercise'] = 'plural';
  const prompt = element('h1', 'task-prompt', texts.taskPrompt);

  const card = element('div', 'word-card');
  const image = element('div', 'word-image');
  image.setAttribute('role', 'img');
  const singular = element('p', 'singular');
  const speakButton = createSpeakButton();
  card.append(image, singular, speakButton);

  const form = element('form', 'answer-form');
  form.noValidate = true;

  // Tastatur-Modus
  const keyboardArea = element('div', 'keyboard-area');
  const answerRow = element('div', 'answer-row');
  const input = element('input', 'answer-input');
  input.type = 'text';
  input.setAttribute('aria-label', texts.answerLabel);
  input.autocomplete = 'off';
  input.spellcheck = false;
  // Keine Hilfen des Geräts: Autokorrektur oder Auto-Großschreibung würden die Antwort verraten.
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('enterkeyhint', 'done');
  answerRow.append(element('span', 'article', texts.pluralArticle), input);
  const charBar = createSpecialCharBar(input);
  keyboardArea.append(answerRow, charBar.element);

  // Bausteine-Modus
  const tilesArea = element('div', 'tiles-area');
  const tiles = createTilesInput(() => {
    updateButton();
  });
  tilesArea.append(tiles.element);

  const feedback = element('div', 'feedback');
  feedback.setAttribute('aria-live', 'polite');
  const actionButton = element('button', 'primary-button');
  actionButton.type = 'submit';

  form.append(keyboardArea, tilesArea, feedback, actionButton);
  panel.append(prompt, card, form);

  let answering = true;
  let mode: InputMode = 'keyboard';
  let current: { quiz: QuizState; word: Word } | null = null;

  const answer = (): string | null => (mode === 'tiles' ? tiles.value() : input.value.trim() === '' ? null : input.value);

  function updateButton(): void {
    actionButton.disabled = answering && answer() === null;
  }

  input.addEventListener('input', updateButton);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!answering) {
      callbacks.onContinue();
      return;
    }
    const value = answer();
    if (value !== null) callbacks.onSubmit(value);
  });

  speakButton.addEventListener('click', () => {
    if (current === null || callbacks.speaker === null) return;
    const { quiz, word } = current;
    const intro = `${texts.taskPrompt} ${word.article} ${word.singular}.`;
    const solution = `${texts.pluralArticle} ${word.plural[0] ?? ''}`;
    callbacks.speaker.speak(quiz.phase === 'feedback' ? `${word.article} ${word.singular}, ${solution}` : intro);
  });

  /** Bild zum Wort; ohne Bild (oder wenn es fehlt) der Anfangsbuchstabe als Platzhalter. */
  const showImage = (word: Word): void => {
    image.setAttribute('aria-label', texts.imageFallbackLabel(word.singular));
    const letter = (): void => {
      image.classList.remove('has-picture');
      image.textContent = word.singular.charAt(0);
    };
    if (word.image === undefined) {
      letter();
      return;
    }
    const picture = element('img', 'word-picture');
    picture.alt = '';
    picture.src = wordImageUrl(word.image);
    picture.addEventListener('error', letter);
    image.classList.add('has-picture');
    image.replaceChildren(picture);
  };

  return {
    element: panel,
    render: (quiz, task) => {
      const { word } = task;
      current = { quiz, word };
      // Nur zeigen, wenn wirklich eine Stimme da ist.
      speakButton.hidden = callbacks.speaker?.ready() !== true;
      answering = quiz.phase === 'answering';
      mode = task.inputMode;
      showImage(word);
      singular.replaceChildren(element('span', 'article', word.article), ' ', word.singular);

      keyboardArea.hidden = mode !== 'keyboard';
      tilesArea.hidden = mode !== 'tiles';
      input.readOnly = !answering;
      charBar.setEnabled(answering);
      if (mode === 'tiles') tiles.render(word);
      tiles.setEnabled(answering);

      renderFeedback(feedback, quiz.lastResult, word);
      actionButton.textContent = answering ? texts.check : texts.next;
      updateButton();
      panel.dataset['phase'] = quiz.phase;
      panel.dataset['mode'] = mode;
    },
    startNewTask: () => {
      input.value = '';
      tiles.reset();
      updateButton();
      if (mode === 'keyboard') input.focus();
    },
    focusForPhase: (quiz) => {
      if (quiz.phase === 'feedback') actionButton.focus();
      else if (mode === 'keyboard') input.focus();
    },
    celebrate: () => {
      celebrateCard(card);
    },
  };
}
