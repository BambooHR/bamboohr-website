import { formatDate, toCategory, toClassName } from '../../scripts/scripts.js';
import { createSharing } from '../page-header/page-header.js';

function applyClasses(styles, elements, prefix) {
  [...elements].forEach((row, i) => {
    row.classList.add(`${prefix}-${styles[i] || 'extra'}`);
  });
}

function createProgress() {
  const progress = document.createElement('progress');
  progress.setAttribute('value', 0);
  progress.setAttribute('max', 100);
  return progress;
}

export default async function decorateArticleHeader($block, blockName) {
  applyClasses(['image', 'eyebrow', 'title', 'author-pub'], $block.children, blockName);
  applyClasses(['category', 'read-time'], $block.querySelector('.article-header-eyebrow').firstChild.children, blockName);
  applyClasses(['author', 'publication-date', 'updated-date'], $block.querySelector('.article-header-author-pub').firstChild.children, blockName);

  // link author
  const $author = $block.querySelector(`.${blockName}-author`);
  const author = $author.textContent;
  const a = document.createElement('a');
  a.href = `/blog/author/${toClassName(author)}`;
  a.textContent = author;
  $author.textContent = '';
  $author.append(a);

  const category = $block.querySelector('.article-header-category');
  category.innerHTML = `<a href="/blog/category/${toCategory(category.textContent)}">${category.textContent}</a>`;

  // format dates
  const $pubdate = $block.querySelector(`.${blockName}-publication-date`);
  $pubdate.textContent = formatDate($pubdate.textContent);

  const $update = $block.querySelector(`.${blockName}-updated-date`);
  if ($update.textContent) $update.textContent = formatDate($update.textContent);

  // sharing + progress
  $block.append(createSharing('article-header-share'));
  const progress = createProgress();
  $block.append(progress);

  document.addEventListener('scroll', () => {
    progress.setAttribute('value', window.scrollY);
    progress.setAttribute('max', document.querySelector('main').clientHeight - window.innerHeight);
  });
}
