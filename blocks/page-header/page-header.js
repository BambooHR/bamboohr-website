import { getMetadata, toClassName } from '../../scripts/scripts.js';

function createDiv(name, type, content) {
  const div = document.createElement('div');
  div.classList.add(`${name}-${type}`);
  div.append(content);
  return div;
}

export function createSharing(shareClass = 'page-header-share') {
  const { title } = document;
  const url = window.location.href;
  const shares = [
    { icon: 'facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { icon: 'twitter', url: `http://twitter.com/share?&url=${url}` },
    { icon: 'linkedin', url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
    { icon: 'email', url: `mailto:?subject=${title}&body=${url}` },
    { icon: 'rss', url: '#' },
  ];
  const div = document.createElement('div');
  div.className = shareClass;
  shares.forEach((button) => {
    const a = document.createElement('a');
    a.href = button.url;
    a.target = '_blank';
    a.innerHTML = `<img alt="${button.icon}" src="${window.hlx.codeBasePath}/icons/${button.icon}.svg" class="icon icon-${button.icon}">`;
    div.append(a);
  });
  return div;
}

export default async function decoratePageHeader(block, blockName) {
  const template = toClassName(getMetadata('template'));
  if (template === 'resources-guides') {
    [...block.children].forEach((row) => {
      if (row.querySelector('picture')) row.classList.add('resources-guides-image');
      else if (row.querySelector('h1')) row.classList.add('resources-guides-title');
      else if (row.querySelector('h5')) row.classList.add('resources-guides-subtitle');
    });
    block.append(createSharing());
  } else if (template === 'performance-reviews') {
    block.append(createSharing());
  } else {
    const location = block.getAttribute('data-header-location');
    const resp = await fetch(`/${location}/header.plain.html`);
    const text = await resp.text();
    const html = document.createElement('div');
    html.innerHTML = text;
    const picture = html.querySelector('picture');
    const h1 = html.querySelector('h1')?.textContent;
    const h2 = html.querySelector('h2')?.textContent;
    if (picture && h1) {
      const h1OnPage = document.querySelector('h1');
      block.append(createDiv(blockName, 'image', picture));
      if (h1OnPage) {
        block.append(createDiv(blockName, 'title', h1));
      } else {
        const title = document.createElement('h1');
        title.textContent = h1;
        block.append(createDiv(blockName, 'title', title));
      }
      if (h2) block.append(createDiv(blockName, 'subtitle', h2));
    }
  }
}
