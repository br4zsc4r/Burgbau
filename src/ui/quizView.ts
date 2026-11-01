import { solutionSegments } from '../logic/pluralPattern';
import { createQuiz, currentWordId, nextTask, submitAnswer } from '../logic/quiz';
import type { AnswerResult, QuizState, RandomFn, Settings, Word, WordList } from '../types';
import { createSpecialCharBar } from './specialCharBar';
import { texts } from './texts';

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
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

export function mountQuiz(
  root: HTMLElement,
  list: WordList,
  settings: Settings,
  random: RandomFn,
): void {
  const wordsById = new Map(list.words.map((word) => [word.id, word]));
  let state: QuizState = createQuiz([...wordsById.keys()], random);

  const view = element('main', 'quiz');
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
  view.append(prompt, card, form);
  root.replaceChildren(view);

  const currentWord = (): Word => {
    const word = wordsById.get(currentWordId(state));
    if (word === undefined) throw new Error('Wort nicht in der Liste');
    return word;
  };

  const render = (): void => {
    const word = currentWord();
    const answering = state.phase === 'answering';

    image.textContent = word.singular.charAt(0);
    image.setAttribute('aria-label', texts.imageFallbackLabel(word.singular));
    singular.replaceChildren(element('span', 'article', word.article), ' ', word.singular);

    input.readOnly = !answering;
    charBar.setEnabled(answering);
    renderFeedback(feedback, state.lastResult, word);
    actionButton.textContent = answering ? texts.check : texts.next;
    actionButton.disabled = answering && input.value.trim() === '';
    view.dataset['phase'] = state.phase;
  };

  input.addEventListener('input', () => {
    if (state.phase === 'answering') actionButton.disabled = input.value.trim() === '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (state.phase === 'answering') {
      if (input.value.trim() === '') return;
      state = submitAnswer(state, currentWord(), input.value, settings);
      render();
      if (state.phase === 'feedback') actionButton.focus();
      else input.focus();
    } else {
      state = nextTask(state, random);
      input.value = '';
      render();
      input.focus();
    }
  });

  render();
  input.focus();
}
