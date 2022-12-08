import {
  createOptimizedPicture,
  toClassName,
  lookupPages,
  readBlockConfig,
  toCamelCase,
} from '../../scripts/scripts.js';

export function createAppCard(app, prefix) {
  const card = document.createElement('li');
  card.className = `${prefix}-card`;

  if (app.tag) {
    const tags = app.tag.split(', ');
    tags.map((v) => card.classList.add(`${prefix}-card-${toClassName(v)}`));
  }

  const title = app.title.split(' - ')[0];
  const level = app.level ? `<img src="/icons/${toClassName(app.level)}-badge.svg" alt="${toClassName(app.level)} badge icon">` : '';
  const picture = createOptimizedPicture(app.image, title, false, [{ width: 750 }]).outerHTML;
  const searchTags = app.searchTags ? `<div class="${prefix}-card-search-tags"><span>${app.searchTags.split(',').join('</span><span>')}</span></div>` : '';
  card.innerHTML = `<div class="${prefix}-card-image">${picture}</div>
  <div class="${prefix}-card-body">
  <div class="${prefix}-card-header"><h4><a href="${app.path}">${title}</a></h4>${level}</div>
  <div class="${prefix}-card-cat">${app.category}</div>
  <div class="${prefix}-card-detail"><p>${app.description}</p>
  <a href="${app.path}">Learn More</a></div>
  ${searchTags}
  </div>`;
  return (card);
}

function compareFilterVal(filter, filterVal, appVal) {
  let matchedFilter = false;
  if (appVal) {
    if (filterVal === '*') {
      matchedFilter = true;
    } else if (filter === 'tag') {
      const vals = appVal.split(',');
      matchedFilter = vals.some((v) => (v && v.toLowerCase().trim() === filterVal));
    } else if (appVal.toLowerCase().includes(filterVal)) {
      matchedFilter = true;
    }
  }
  return matchedFilter;
}

export function sortOptions(sortBy) {
  const levels = ['pro', 'elite', 'bamboohr-product'];

  /* sort options */
  const sorts = {
    name: (a, b) => a.title.localeCompare(b.title),
    level: (a, b) => levels.indexOf(toClassName(b.level)) - levels.indexOf(toClassName(a.level))
                      || a.title.localeCompare(b.title),
    publicationDate: (a, b) => b.publicationDate.localeCompare(a.publicationDate)
                                || a.title.localeCompare(b.title),
    presenter: (a, b) => a.presenter.localeCompare(b.presenter),
    startTime: (a, b) => a.date.localeCompare(b.date)
                                || a.time.localeCompare(b.time)
                                || a.category.localeCompare(b.category),
    title: (a, b) => a.title.localeCompare(b.title),
    term: (a, b) => a.term.localeCompare(b.term),
  };
  return sorts[sortBy];
}

export async function filterApps(config, feed, limit, offset) {
  const result = [];

  /* filter apps by level, tag etc. */
  const filters = {};
  Object.keys(config).forEach((key) => {
    const filterNames = ['category', 'level', 'tag'];
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

  config.sortBy = toCamelCase(config.sortBy);

  await lookupPages([], 'integrations');
  const index = [...window.pageIndex.integrations.data];

  if (sortOptions(config.sortBy)) {
    index.sort(sortOptions(config.sortBy));
  } else {
    index.sort(sortOptions('level'));
  }

  while ((feed.data.length < limit + offset) && (!feed.complete)) {
    // eslint-disable-next-line no-await-in-loop
    const indexChunk = index.slice(feed.cursor);

    /* filter and ignore if already in result */
    const feedChunk = indexChunk.filter((app) => {
      if (app.robots === 'noindex') return false;
      const matchedAll = Object.keys(filters).every((key) => {
        const matchedFilter = filters[key].some((val) => (app[key]
          && compareFilterVal(key, val, app[key])));
        return matchedFilter;
      });
      return (matchedAll && !result.includes(app));
    });
    feed.cursor = index.length;
    feed.complete = true;
    feed.data = [...feed.data, ...feedChunk];
  }
}

async function decorateAppsFeed(
  appsFeedEl,
  config,
  offset = 0,
  feed = { data: [], complete: false, cursor: 0 },
) {
  let ul = appsFeedEl.querySelector('.apps-cards-feed');
  if (!ul) {
    ul = document.createElement('ul');
    ul.className = 'apps-cards-feed';
    appsFeedEl.appendChild(ul);
  }

  const limit = +config.limit || 12;
  const pageEnd = offset + limit;
  await filterApps(config, feed, limit, offset);
  const apps = feed.data;
  const max = pageEnd > apps.length ? apps.length : pageEnd;

  for (let i = offset; i < max; i += 1) {
    const app = apps[i];
    ul.append(createAppCard(app, 'app-cards'));
  }

  /* add load more if needed */
  if ((apps.length > pageEnd && config.maxLimit?.toLowerCase() !== 'yes') || !feed.complete) {
    const wrapper = document.createElement('div');
    wrapper.className = 'load-more-wrapper';
    const loadMore = document.createElement('a');
    loadMore.className = 'load-more button small light';
    loadMore.href = '#';
    loadMore.textContent = 'Load More';
    wrapper.append(loadMore);
    appsFeedEl.append(wrapper);
    loadMore.addEventListener('click', (event) => {
      event.preventDefault();
      loadMore.remove();
      decorateAppsFeed(appsFeedEl, config, pageEnd, feed);
    });
  }
}

export default async function decorate(block, blockName) {
  if (block.querySelector('a')) {
    const pathnames = [...block.querySelectorAll('a')].map((a) => new URL(a.href).pathname);
    const results = await lookupPages(pathnames, 'integrations');
    block.textContent = '';
    const ul = document.createElement('ul');
    results.forEach((app) => {
      ul.append(createAppCard(app, blockName));
    });
    block.append(ul);
  } else {
    const blockConfig = readBlockConfig(block);

    /* camelCase config */
    const config = {};
    Object.keys(blockConfig).forEach((key) => { config[toCamelCase(key)] = blockConfig[key]; });

    block.innerHTML = '';
    await decorateAppsFeed(block, config);
  }
}
