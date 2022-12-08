import {
  createOptimizedPicture,
  getMetadata,
  toClassName,
} from '../../scripts/scripts.js';

export default async function decorate(block) {
  const authorPath = `/blog/author/${toClassName(getMetadata('author'))}`;
  const resp = await fetch(`${authorPath}.plain.html`);
  const text = await resp.text();
  const dom = new DOMParser().parseFromString(text, 'text/html');
  const img = dom.querySelector('img');
  img.closest('p').remove();
  const fullname = dom.querySelector('h1');
  fullname.remove();
  const title = dom.querySelector('p');
  if (title) title.remove();

  const picture = createOptimizedPicture(img.src, false, [{ width: '200' }]);
  block.innerHTML = `<div class="author-image">${picture.outerHTML}</div>
  <div class="author-description">
    <a href="${authorPath}">${fullname.textContent}</a>
    ${title ? title.outerHTML : ''}
  </div>`;
}
