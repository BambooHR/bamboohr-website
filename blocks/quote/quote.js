import { decorateBackgrounds } from '../../scripts/scripts.js';

export default function decorate(block) {
  const byline = block.querySelector('em');
  const company = block.querySelector('h4');

  // Adding image class to block children
  [...block.children].forEach((row) =>
    [...row.children].forEach((cell) =>
      cell.classList.add(cell.querySelector('img') ? 'image' : 'content')
    )
  );

  // if company
  if (company) {
    company.classList.add('company');
  }

  // if byline
  if (byline) {
    byline.parentNode.classList.add('byline');
    byline.parentNode.textContent = byline.textContent;
  }

  // custom BGs
  if (block.closest('body').classList.contains('ee-solution')) {
    const bgElem = block.querySelector('.content');
    bgElem.classList.add('bg-block-ee-solutions-quote');
    decorateBackgrounds(bgElem);
  }
}
