import { product } from '../../logic/exercises/multiplication';
import type { AnswerResult, MultiplicationTask } from '../../types';
import { element } from '../dom';
import { texts } from '../texts';
import type { ExercisePanel, ExercisePanelCallbacks } from './panel';
import { celebrateCard, createSpeakButton, feedbackTitle } from './shared';

/** Höchstens dreistellig (10 · 10 = 100). */
const MAX_DIGITS = 3;

function renderFeedback(container: HTMLElement, result: AnswerResult | null, task: MultiplicationTask): void {
  container.replaceChildren();
  container.dataset['status'] = result?.status ?? '';
  if (result === null) return;
  if (result.status !== 'wrong') {
    container.append(feedbackTitle(result));
    return;
  }
  container.append(element('p', 'feedback-hint', texts.solutionIntro));
  const solution = element('p', 'solution');
  solution.append(
    `${String(task.factor)} · ${String(task.row)} = `,
    element('mark', 'solution-part', String(product(task))),
  );
  container.append(solution);
}

/** Spielart kleines 1×1: Malaufgabe mit großem Ziffernfeld (am PC geht auch die Tastatur). */
export function createMultiplicationPanel(callbacks: ExercisePanelCallbacks): ExercisePanel<MultiplicationTask> {
  const panel = element('section', 'task-panel');
  panel.dataset['exercise'] = 'multiplication';
  const prompt = element('h1', 'task-prompt', texts.multiplicationPrompt);

  const card = element('div', 'word-card equation-card');
  const equation = element('p', 'equation');
  const answerBox = element('output', 'equation-answer');
  answerBox.setAttribute('aria-label', texts.answerBoxLabel);
  const speakButton = createSpeakButton();
  card.append(equation, speakButton);

  const form = element('form', 'answer-form');
  form.noValidate = true;
  const numpad = element('div', 'numpad');
  const feedback = element('div', 'feedback');
  feedback.setAttribute('aria-live', 'polite');
  const actionButton = element('button', 'primary-button');
  actionButton.type = 'submit';
  form.append(numpad, feedback, actionButton);
  panel.append(prompt, card, form);

  let entry = '';
  let answering = true;
  let current: MultiplicationTask | null = null;

  const update = (): void => {
    answerBox.textContent = entry === '' ? '?' : entry;
    answerBox.classList.toggle('empty', entry === '');
    actionButton.disabled = answering && entry === '';
  };

  const type = (digit: string): void => {
    if (!answering || entry.length >= MAX_DIGITS) return;
    entry = entry === '0' ? digit : entry + digit;
    update();
  };

  const erase = (): void => {
    if (!answering) return;
    entry = entry.slice(0, -1);
    update();
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => {
    const key = element('button', 'numpad-key', digit);
    key.type = 'button';
    key.addEventListener('click', () => {
      type(digit);
    });
    return key;
  });
  const eraseKey = element('button', 'numpad-key numpad-erase', '⌫');
  eraseKey.type = 'button';
  eraseKey.setAttribute('aria-label', texts.numpadErase);
  eraseKey.addEventListener('click', erase);
  // Wie beim Telefon: 1–9, darunter 0 in der Mitte und Löschen rechts.
  numpad.append(...keys.slice(0, 9), element('span', 'numpad-gap'), keys[9] ?? '', eraseKey);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!answering) {
      callbacks.onContinue();
      return;
    }
    if (entry !== '') callbacks.onSubmit(entry);
  });

  // Am PC: Ziffern, Löschen und Enter über die Tastatur – nur, solange diese Aufgabe zu sehen ist.
  document.addEventListener('keydown', (event) => {
    if (panel.offsetParent === null || event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^\d$/.test(event.key)) {
      type(event.key);
      event.preventDefault();
    } else if (event.key === 'Backspace') {
      erase();
      event.preventDefault();
    } else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
      form.requestSubmit();
      event.preventDefault();
    }
  });

  speakButton.addEventListener('click', () => {
    if (current === null || callbacks.speaker === null) return;
    const { factor, row } = current;
    callbacks.speaker.speak(
      answering
        ? texts.multiplicationQuestion(factor, row)
        : texts.multiplicationSolution(factor, row, product(current)),
    );
  });

  return {
    element: panel,
    render: (quiz, task) => {
      current = task;
      speakButton.hidden = callbacks.speaker?.ready() !== true;
      answering = quiz.phase === 'answering';
      equation.replaceChildren(`${String(task.factor)} · ${String(task.row)} = `, answerBox);
      equation.setAttribute('aria-label', texts.multiplicationLabel(task.factor, task.row));
      for (const key of [...keys, eraseKey]) key.disabled = !answering;
      renderFeedback(feedback, quiz.lastResult, task);
      actionButton.textContent = answering ? texts.check : texts.next;
      // Nach „Fast!“ bleibt die Zahl stehen, damit das Kind sie verbessern kann.
      update();
      panel.dataset['phase'] = quiz.phase;
    },
    startNewTask: () => {
      entry = '';
      update();
    },
    focusForPhase: (quiz) => {
      if (quiz.phase === 'feedback') actionButton.focus();
    },
    celebrate: () => {
      celebrateCard(card);
    },
  };
}
