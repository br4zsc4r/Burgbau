import type { Profile } from '../types';
import { element } from './dom';
import { createSymbolBadge } from './profileSymbol';
import { texts } from './texts';

/** Nach dem Antippen des Profils: sofort weiterbauen oder neue Burg. */
export function createProfileHome(callbacks: {
  onContinue: () => void;
  onNewCastle: () => void;
  onCollection: () => void;
  onSwitchProfile: () => void;
}): { element: HTMLElement; render: (profile: Profile, hasGame: boolean) => void } {
  const screen = element('section', 'screen profile-home');
  const badge = element('div', 'home-badge');
  const title = element('h1', 'screen-title');
  const actions = element('div', 'home-actions');

  const button = (label: string, className: string, onClick: () => void): HTMLButtonElement => {
    const b = element('button', className, label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  };

  const confirm = element('div', 'confirm-box');
  const confirmText = element('p', 'confirm-text', texts.confirmNewCastle);
  confirm.append(
    confirmText,
    button(texts.confirmYes, 'secondary-button', callbacks.onNewCastle),
    button(texts.confirmNo, 'primary-button', callbacks.onContinue),
  );

  let hasGame = false;
  const continueButton = button(texts.continueCastle, 'primary-button big-button', callbacks.onContinue);
  const newButton = button(texts.newCastle, 'primary-button big-button', () => {
    if (hasGame) {
      actions.hidden = true;
      confirm.hidden = false;
    } else {
      callbacks.onNewCastle();
    }
  });
  const collection = button(texts.myCastles, 'secondary-button', callbacks.onCollection);
  const switchProfile = button(texts.switchProfile, 'secondary-button', callbacks.onSwitchProfile);
  actions.append(continueButton, newButton, collection, switchProfile);
  screen.append(badge, title, actions, confirm);

  return {
    element: screen,
    render: (profile, game) => {
      hasGame = game;
      badge.replaceChildren(createSymbolBadge(profile.symbol));
      title.textContent = texts.hello(profile.nickname);
      continueButton.hidden = !game;
      newButton.classList.toggle('secondary-look', game);
      actions.hidden = false;
      confirm.hidden = true;
    },
  };
}
