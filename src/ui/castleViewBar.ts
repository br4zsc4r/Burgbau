import { element } from './dom';
import { texts } from './texts';

/** Leiste über einer fertigen Burg in voller Größe: Name und Zurück. */
export function createCastleViewBar(onBack: () => void): {
  element: HTMLElement;
  render: (name: string) => void;
} {
  const bar = element('div', 'castle-view-bar');
  const back = element('button', 'secondary-button', texts.back);
  back.type = 'button';
  back.addEventListener('click', onBack);
  const name = element('h1', 'castle-view-name');
  bar.append(back, name);
  return {
    element: bar,
    render: (castleName) => {
      name.textContent = castleName;
    },
  };
}
