import { buildBlock, getMetadata } from './scripts.js';

function buildImageBlocks(main) {
  let floatCounter = 0;
  main.querySelectorAll(':scope > div > p > picture, :scope > div > p > a > picture').forEach((picture) => {
    const up = picture.parentElement;
    const p = picture.closest('p');
    const div = p.parentElement;
    const nextSib = p.nextElementSibling;
    if ([...up.children].length === 1) {
      const imgBlock = buildBlock('image', { elems: [up] });
      if (up.tagName === 'A') {
        div.insertBefore(imgBlock, p);
        imgBlock.classList.add(floatCounter % 2 ? 'left' : 'right');
        floatCounter += 1;
      } else div.insertBefore(imgBlock, nextSib);
    }
  });
}

function buildArticleHeader(main) {
  try {
    const author = getMetadata('author');
    const publicationDate = getMetadata('publication-date');
    const updatedDate = getMetadata('updated-date') || '';
    const readtime = getMetadata('read-time');
    const category = getMetadata('category');
    const h1 = document.querySelector('h1');
    const picture = document.querySelector('h1 + p > picture');
    if (author && publicationDate) {
      document.body.classList.add('blog-post');
      const section = document.createElement('div');
      section.append(buildBlock('article-header', [
        [picture],
        [`<p>${category}</p><p>${readtime}</p>`],
        [h1],
        [`<p>${author}</p><p>${publicationDate}</p><p>${updatedDate}</p>`],
      ]));
      main.prepend(section);
      return (true);
    }
  } catch (e) {
    // something went wrong
  }
  return (false);
}

function buildAuthorContainer(main) {
  try {
    if (window.location.pathname.includes('/author/')) {
      document.body.classList.add('author-page');
      const container = buildBlock('author-container', []);
      main.prepend(container);
      return true;
    }
  } catch (e) {
    // something went wrong
  }
  return false;
}

export default async function decorateTemplate(main) {
  const isBlog = buildArticleHeader(main);
  if (isBlog) {
    buildImageBlocks(main);
    const related = main.querySelector('.related-posts');
    if (related) related.parentElement.insertBefore(buildBlock('author', [['']]), related);
    if (!related.nextElementSibling && !related.parentElement.nextElementSibling) {
      const section = document.createElement('div');
      section.append(related);
      main.append(section);
    }
  }
  const isAuthor = buildAuthorContainer(main);
  if (isAuthor) {
    const h1 = document.querySelector('h1');
    const position = h1.nextElementSibling;
    position.remove();
    const pic = document.querySelector('picture')
      ? document.querySelector('picture').parentElement : null;
    let bio;
    if (pic) {
      bio = pic.nextElementSibling;
      pic.remove();
    }
    const body = bio ? [[h1], [bio]] : [[h1]];
    document.querySelector('.author-container').append(
      buildBlock('author-header', body),
      // buildBlock('featured-articles', 'oy'),
      buildBlock('article-feed', [
        ['author', h1.textContent],
      ]),
    );
  }
}
