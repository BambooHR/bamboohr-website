import { createElem, decorateBackgrounds } from '../../scripts/scripts.js';

export default function decorate(block) {
  const title = block.querySelector(':scope > div:first-child > div:first-child');
  title.classList.add('title');
  title.classList.add('bg-block-benefits');
  decorateBackgrounds(title);

  const benefits = block.querySelectorAll(':scope > div:not(:first-child)');
  const col1 = createElem('div', 'benefits-col-1');
  const col2 = createElem('div', 'benefits-col-2');

  block.innerText = '';
  block.append(title);

  benefits.forEach((benefit, key) => {
    // move icon to parent div, remove empty p
    const icon = benefit.querySelector('span.icon');
    icon.parentNode.remove();
    benefit.append(icon);

    // move title to parent div
    const benefitTitle = benefit.querySelector('h3');
    benefit.append(benefitTitle);

    // move text to parent div, remove empty div
    const text = benefit.querySelector('p:not(:empty)');
    text.parentNode.remove();
    benefit.append(text);

    benefit.classList.add('benefit');

    // split if more than 4 and where it's even (balanced first col gets +1 on odds)
    if (benefits.length < 4 || key < Math.ceil(benefits.length / 2)) {
      col1.append(benefit);
    } else {
      col2.append(benefit);
    }
  });

  // attach benefits cols
  block.append(col1);
  if (col2.children.length > 0) block.append(col2);
}
