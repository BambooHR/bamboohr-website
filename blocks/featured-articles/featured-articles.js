import {
  lookupPages,
  createOptimizedPicture,
  toCategory,
} from '../../scripts/scripts.js';

export function createBlogCard(article, classPrefix, eager = false) {
  const title = article.title.split(' - ')[0];
  const card = document.createElement('div');
  card.className = `${classPrefix}-card`;
  card.setAttribute('am-region', `${article.category} . ${article.readTime}`.toUpperCase());
  const image = article.cardImage || article.image;
  const pictureString = createOptimizedPicture(
    image,
    article.imageAlt || article.title,
    eager,
    [{ width: 750 }],
  ).outerHTML;
  const category = toCategory(article.category);
  const categoryHref = article.noCategoryLink ? '#' : `href="/blog/category/${category}"`;
  card.innerHTML = `<div class="${classPrefix}-card-header category-color-${category}">
    <span class="${classPrefix}-card-category"><a ${categoryHref}>${article.category}</a></span> 
    <span class="${classPrefix}-card-readtime">${article.readTime || ''}</span>
    </div>
    <div class="${classPrefix}-card-picture"><a href="${article.path}">${pictureString}</a></div>
    <div class="${classPrefix}-card-body" am-region="${title}">
    <h3>${title}</h3>
    <p>${article.description}</p>
    <p><a href="${article.path}">Read Now</a></p>
    </div>`;
  return (card);
}

export default async function decorate(block) {
  // cleanup eager image
  const eager = block.querySelector('img[loading="eager"]');
  if (eager) eager.setAttribute('loading', 'lazy');

  const rows = [...block.children];
  const contents = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const [content, category] = [...row.children].map((e, j) => (j ? e.textContent : e));
    if (content.textContent.includes('://')) {
      // handle straight link
      const { pathname } = new URL(content.querySelector('a').href);
      // eslint-disable-next-line no-await-in-loop
      const articles = await lookupPages([pathname], 'blog');
      if (articles.length) {
        const [article] = articles;
        if (i === 0) document.body.classList.add(`category-${toCategory(article.category)}`);
        if (category) {
          article.noCategoryLink = true;
          article.category = category;
        }
        const card = createBlogCard(article, 'featured-articles', i === 0);
        contents.push(card.outerHTML);
      }
    } else {
      contents.push(`<div class="featured-articles-card">${content.outerHTML}</div>`);
    }
  }

  // pad array with empty strings
  for (let i = contents.length; i < 10; i += 1) {
    contents[i] = '';
  }

  const html = `
    <div class="featured-articles-row featured-articles-hero">${contents[0]}</div>
    <div class="featured-articles-row">
      <div class="featured-articles-col">${contents[1]}${contents[2]}</div>
      <div class="featured-articles-col">${contents[3]}${contents[4]}</div>
    </div>
    <div class="featured-articles-row">
    <div class="featured-articles-col">${contents[5]}${contents[6]}${contents[8]}${contents[9]}</div>
    <div class="featured-articles-col featured-articles-large">${contents[7]}</div>
    `;
  block.innerHTML = html;
}
