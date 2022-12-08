import { createElem, loadCSS } from '../../scripts/scripts.js';
import decorateCards from '../cards/cards.js';

function setupImages(block) {
  const imageGroupContainer = createElem('div', 'image-group-container');
  const imageParents = block.querySelectorAll(':scope > div:nth-child(n + 2)');

  // skip if none
  if (!block.querySelector('picture')) return '';

  imageParents.forEach((imageParent) => {
    const imageContainer = createElem('div', 'image-container');
    const caption = imageParent.querySelector(':scope > div:nth-child(2) p:nth-child(2)');

    const imageMask = createElem('div', 'image-mask');
    imageMask.append(imageParent.querySelector('picture'));
    imageContainer.append(imageMask);

    if (caption) {
      caption.classList.add('image-caption');
      imageContainer.append(caption);
    }

    imageGroupContainer.append(imageContainer);
  });

  return imageGroupContainer;
}

function setupContent(block) {
  const content = block.querySelectorAll(':scope > div:first-child > div:first-child')?.item(0);
  const buttons = content.querySelectorAll(':scope .button-container');

  // skip if none
  if (!content) return '';

  if (buttons.length > 0) {
    const ctaContainer = createElem('div', 'cta-container');

    buttons.forEach((button) => ctaContainer.append(button));
    content.append(ctaContainer);
  }

  return content;
}

function setupCards(block) {
  // get cards and decorate
  const cards = createElem('div', 'cards');
  cards.classList.add('block', '2-columns');
  block.querySelectorAll(':scope > :not(:first-child)').forEach((cardRow) => cards.append(cardRow));

  // skip if none
  if (!cards) return '';

  // use card block decorate
  decorateCards(cards);

  // load css
  const cssBase = `${window.hlx.serverPath}${window.hlx.codeBasePath}`;
  loadCSS(`${cssBase}/blocks/cards/cards.css`, null);

  return cards;
}

export default function decorate(block) {
  if (block.classList.contains('triple-hex')) {
    block.closest('.hero-container').classList.add('triple-hex');
  } else if (block.classList.contains('cards-2-column')) {
    block.closest('.hero-container').classList.add('cards-2-column');
  }

  const content = setupContent(block);
  const imagesContainer = setupImages(block);
  const cards = setupCards(block);

  block.innerHTML = '';
  block.append(content, imagesContainer, cards);
}
