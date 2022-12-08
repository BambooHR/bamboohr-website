import {
  lookupPages,
  readBlockConfig,
} from '../../scripts/scripts.js';

import { createBlogCard } from '../featured-articles/featured-articles.js';

function isCardOnPage(article) {
  const path = article.path.split('.')[0];
  if (path === window.location.pathname) return true;
  /* using recommended and featured articles */
  return !!document.querySelector(`a[href="${path}"]`);
}

export async function filterArticles(config, feed, limit, offset) {
  const result = [];

  /* filter posts by category, tag and author */
  const filters = {};
  Object.keys(config).forEach((key) => {
    const filterNames = ['tags', 'author', 'category'];
    if (filterNames.includes(key)) {
      const vals = config[key];
      if (vals) {
        let v = vals;
        if (!Array.isArray(vals)) {
          v = [vals];
        }
        filters[key] = v.map((e) => e.toLowerCase().trim());
      }
    }
  });

  await lookupPages([], 'blog');
  const index = window.pageIndex.blog;

  while ((feed.data.length < limit + offset) && (!feed.complete)) {
    // eslint-disable-next-line no-await-in-loop
    const indexChunk = index.data.slice(feed.cursor);

    /* filter and ignore if already in result */
    const feedChunk = indexChunk.filter((article) => {
      const matchedAll = Object.keys(filters).every((key) => {
        const matchedFilter = filters[key].some((val) => (article[key]
          && article[key].toLowerCase().includes(val)));
        return matchedFilter;
      });
      return (matchedAll && !result.includes(article) && !isCardOnPage(article));
    });
    feed.cursor = index.data.length;
    feed.complete = true;
    feed.data = [...feed.data, ...feedChunk];
  }
}

function buildArticleFeedRow(cards, cardIndex, isLarge) {
  let row = '';
  if (cards[cardIndex]) {
    if (isLarge) {
      row = `<div class="article-feed-row article-feed-large">
        ${cards[cardIndex]}
      </div>`;
    } else if (cards[cardIndex + 1]) {
      row = `<div class="article-feed-row">
        ${cards[cardIndex]}${cards[cardIndex + 1]}
      </div>`;
    } else {
      row = `<div class="article-feed-row">
        ${cards[cardIndex]}
      </div>`;
    }
  }

  return row;
}

async function decorateArticleFeed(
  articleFeedEl,
  config,
  offset = 0,
  feed = { data: [], complete: false, cursor: 0 },
) {
  let articleCards = articleFeedEl.querySelector('.article-feed-cards');
  if (!articleCards) {
    articleCards = document.createElement('div');
    articleCards.className = 'article-feed-cards';
    articleFeedEl.appendChild(articleCards);
  }

  const limit = 10;
  const pageEnd = offset + limit;
  await filterArticles(config, feed, limit, offset);
  const articles = feed.data;
  const cards = [];
  const max = pageEnd > articles.length ? articles.length : pageEnd;
  for (let i = offset; i < max; i += 1) {
    const article = articles[i];
    cards.push(createBlogCard(article, 'article-feed').outerHTML);
  }

  const cardGrid = document.createElement('div');
  cardGrid.className = 'article-feed-card-grid';
  const row1 = buildArticleFeedRow(cards, 0, true);
  const row2 = buildArticleFeedRow(cards, 1);
  const row3 = buildArticleFeedRow(cards, 3);
  const row4 = buildArticleFeedRow(cards, 5);
  const row5 = buildArticleFeedRow(cards, 7);
  const row6 = buildArticleFeedRow(cards, 9, true);
  cardGrid.innerHTML = `
    <div class="article-feed-col">
      ${row1}
      ${row2}
      ${row3}
    </div>
    <div class="article-feed-col">
      ${row4}
      ${row5}
      ${row6}
    </div>
  `;
  articleFeedEl.append(cardGrid);

  if (articles.length > pageEnd || !feed.complete) {
    const wrapper = document.createElement('div');
    wrapper.className = 'load-more-wrapper';
    const loadMore = document.createElement('a');
    loadMore.className = 'load-more button small light';
    loadMore.href = '#';
    loadMore.textContent = 'Load More';
    wrapper.append(loadMore);
    articleFeedEl.append(wrapper);
    loadMore.addEventListener('click', (event) => {
      event.preventDefault();
      loadMore.remove();
      decorateArticleFeed(articleFeedEl, config, pageEnd, feed);
    });
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.innerHTML = '';
  await decorateArticleFeed(block, config);
}
