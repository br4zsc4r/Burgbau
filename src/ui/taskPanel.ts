import { solutionSegments } from '../logic/pluralPattern';
import type { AnswerResult, QuizState, Word } from '../types';
import { element } from './dom';
import { createSpecialCharBar } from './specialCharBar';
import { texts } from './texts';

export interface TaskPanelCallbacks {
  onSubmit: (input: string) => void;
  onContinue: () => void;
}

export interface TaskPanel {
  element: HTMLElement;
  render: (quiz: QuizState, word: Word) => void;
  /** Leert das Eingabefeld und setzt den Fokus hinein (neue Aufgabe). */
  startNewTask: () => void;
  focusForPhase: (quiz: QuizState) => void;
}

function renderFeedback(container: HTMLElement, result: AnswerResult | null, word: Word): void {
  container.replaceChildren();
  container.dataset['status'] = result?.status ?? '';
  if (result === null) return;

  switch (result.status) {
    case 'correct':
      container.append(element('p', 'feedback-title', texts.correct));
      if (result.capitalizationHint) {
        container.append(element('p', 'feedback-hint', texts.capitalizationHint));
      }
      break;
    case 'almost':
      container.append(
        element(
          'p',
          'feedback-title',
          result.reason === 'capitalization' ? texts.almostCapitalization : texts.almostTypo,
        ),
      );
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

/** Aufgabe im Tastatur-Modus. Hält keinen eigenen Spielzustand. */
export function createTaskPanel(callbacks: TaskPanelCallbacks): TaskPanel {
  const panel = element('section', 'task-panel');
  const prompt = element('h1', 'task-prompt', texts.taskPrompt);

  const card = element('div', 'word-card');
  const image = element('div', 'word-image');
  image.setAttribute('role', 'img');
  const singular = element('p', 'singular');
  card.append(image, singular);

  const form = element('form', 'answer-form');
  form.noValidate = true;
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
  const feedback = element('div', 'feedback');
  feedback.setAttribute('aria-live', 'polite');
  const actionButton = element('button', 'primary-button');
  actionButton.type = 'submit';

  form.append(answerRow, charBar.element, feedback, actionButton);
  panel.append(prompt, card, form);

  let answering = true;

  input.addEventListener('input', () => {
    if (answering) actionButton.disabled = input.value.trim() === '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!answering) {
      callbacks.onContinue();
    } else if (input.value.trim() !== '') {
      callbacks.onSubmit(input.value);
    }
  });

  return {
    element: panel,
    render: (quiz, word) => {
      answering = quiz.phase === 'answering';
      image.textContent = word.singular.charAt(0);
      image.setAttribute('aria-label', texts.imageFallbackLabel(word.singular));
      singular.replaceChildren(element('span', 'article', word.article), ' ', word.singular);

      input.readOnly = !answering;
      charBar.setEnabled(answering);
      renderFeedback(feedback, quiz.lastResult, word);
      actionButton.textContent = answering ? texts.check : texts.next;
      actionButton.disabled = answering && input.value.trim() === '';
      panel.dataset['phase'] = quiz.phase;
    },
    startNewTask: () => {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.focus();
    },
    focusForPhase: (quiz) => {
      if (quiz.phase === 'feedback') actionButton.focus();
      else input.focus();
    },
  };
}
