import {
  lookupPages,
  getMetadata,
  fetchPlaceholders,
  readBlockConfig,
  toCamelCase,
} from '../../scripts/scripts.js';
import { createAppCard, sortOptions } from '../app-cards/app-cards.js';

function getBlockHTML(ph, theme) {
  const defaultSortText = (theme === 'hrvs') ? ph.startTime : ph.default;
  const defaultSortProp = (theme === 'hrvs') ? 'startTime' : 'level';
  const sortOptions = (theme === 'hrvs') ? 
      `<li data-sort="startTime">${ph.startTime}</li>
      <li data-sort="presenter">${ph.presenter}</li>
      <li data-sort="title">${ph.title}</li>`
    : 
      `<li data-sort="level">${ph.default}</li>
      <li data-sort="name">${ph.name}</li>
      <li data-sort="publicationDate">${ph.newest}</li>`;
  return /* html */ `
  <p class="listing-results-count"><span id="listing-results-count"></span> ${ph.results}</p>
  <div class="listing-facets">
  </div>
  <div class="listing-sortby">
    <div class="listing-filter-button">${ph.filter}</div>
    <p class="listing-sort-button">${ph.sortBy} <span data-sort="${defaultSortProp}" id="listing-sortby">${defaultSortText}</span></p>
    <ul>
      ${sortOptions}
    </ul>
  </div>
  </div>
  <ul class="listing-results">
  </ul>`;
}

function getFacetHTML(ph, horizFilters) {
  const filterOptions = horizFilters ? 
      `<div class="listing-filters-facetlist"></div>
      <div class="listing-filters-selected never-show"></div>
      <p><button class="listing-filters-clear secondary">${ph.clearAll}</button></p>`
    : 
      `<div class="listing-filters-selected"></div>
      <p><button class="listing-filters-clear secondary">${ph.clearAll}</button></p>
      <div class="listing-filters-facetlist"></div>`;
  return /* html */ `
  <div><div class="listing-filters">
    ${filterOptions}
    </div>
    <div class="listing-apply-filters">
      <button>${ph.seeResults}</button>
  </div></div>`;
}

export async function filterResults(config, facets = {}) {
  /* load index */
  let collection = 'blog';
  const theme = getMetadata('theme');
  if (theme === 'integrations') collection = 'integrations';
  else if (theme === 'hrvs') collection = 'hrvs';
  await lookupPages([], collection);
  const listings = window.pageIndex[collection];

  /* simple array lookup */
  if (Array.isArray(config)) {
    const pathnames = config;
    return pathnames.map((path) => listings.lookup[path]).filter((e) => e);
  }

  /* setup config */
  const facetKeys = Object.keys(facets);
  const keys = Object.keys(config);
  const tokens = {};
  keys.forEach((key) => {
    tokens[key] = config[key].split(',').map((t) => t.trim());
  });

  /* filter */
  const results = listings.data.filter((row) => {
    const filterMatches = {};
    let matchedAll = keys.every((key) => {
      let matched = false;
      if (row[key]) {
        const rowValues = row[key].split(',').map((t) => t.trim());
        matched = tokens[key].some((t) => rowValues.includes(t));
      }
      filterMatches[key] = matched;
      return matched;
    });

    const isListing = () => !!row.publisher;

    if (theme === 'integrations' && !isListing()) matchedAll = false;

    /* facets */
    facetKeys.forEach((facetKey) => {
      let includeInFacet = true;
      Object.keys(filterMatches).forEach((filterKey) => {
        if (filterKey !== facetKey && !filterMatches[filterKey]) {
          includeInFacet = false;

          if (filterKey !== facetKey) {
            keys.every((key) => {
              let matched = false;

              if (row[key]) {
                const rowValues = row[key].split(',').map((t) => t.trim());
                matched = tokens[key].some((t) => rowValues.includes(t));

                if (matched) {
                  includeInFacet = true;
                }
                includeInFacet = false;
              }

              return matched;
            });
          }
        }
      });

      if (includeInFacet) {
        if (row[facetKey]) {
          const rowValues = row[facetKey].split(',').map((t) => t.trim());
          rowValues.forEach((val) => {
            if (facets[facetKey][val]) {
              facets[facetKey][val] += 1;
            } else {
              facets[facetKey][val] = 1;
            }
          });
        }
      }
    });
    return matchedAll;
  });
  return results;
}

export default async function decorate(block, blockName) {
  const horizFilters = block.classList.contains('horizontal-filters');
  const theme = getMetadata('theme');
  const ph = await fetchPlaceholders('/integrations');

  const addEventListeners = (elements, event, callback) => {
    elements.forEach((e) => {
      e.addEventListener(event, callback);
    });
  };

  const blockConfig = readBlockConfig(block);

  /* camelCase config */
  const config = {};
  Object.keys(blockConfig).forEach((key) => {
    config[toCamelCase(key)] = blockConfig[key];
  });

  block.innerHTML = getBlockHTML(ph, theme);

  const resultsElement = block.querySelector('.listing-results');
  const facetsElement = block.querySelector('.listing-facets');
  block.querySelector('.listing-filter-button').addEventListener('click', () => {
    block.querySelector('.listing-facets').classList.toggle('visible');
  });

  addEventListeners(
    [block.querySelector('.listing-sort-button'), block.querySelector('.listing-sortby p')],
    'click',
    () => {
      block.querySelector('.listing-sortby ul').classList.toggle('visible');
    },
  );

  const displayResults = async (results) => {
    resultsElement.innerHTML = '';
    results.forEach((product) => {
      resultsElement.append(createAppCard(product, blockName));
    });

    window.setTimeout(() => {
      document.querySelectorAll('.listing-card-header h4').forEach(h4 => {
        if (h4.scrollWidth > h4.clientWidth) h4.title = h4.innerText;
      });
    }, 1000);
  };

  const runSearch = async (filterConfig = config) => {
    const facets = {
      category: {},
      businessSize: {},
      dataFlow: {},
      industryServed: {},
      locationRestrictions: {},
    };
    const results = await filterResults(filterConfig, facets);
    const sortBy = document.getElementById('listing-sortby')
      ? document.getElementById('listing-sortby').dataset.sort
      : (theme === 'hrvs') ? 'startTime' : 'level';

    if (sortBy && sortOptions(sortBy)) results.sort(sortOptions(sortBy));
    block.querySelector('#listing-results-count').textContent = results.length;
    displayResults(results, null);
    // eslint-disable-next-line no-use-before-define
    displayFacets(facets, filterConfig);
  };

  const getSelectedFilters = () => [...block.querySelectorAll('input[type="checkbox"]:checked')];
  const createFilterConfig = () => {
    const filterConfig = { ...config };
    getSelectedFilters().forEach((checked) => {
      const facetKey = checked.name;
      const facetValue = checked.value;
      if (filterConfig[facetKey]) filterConfig[facetKey] += `, ${facetValue}`;
      else filterConfig[facetKey] = facetValue;
    });
    return filterConfig;
  };

  const sortList = block.querySelector('.listing-sortby ul');
  const selectSort = (selected) => {
    [...sortList.children].forEach((li) => li.classList.remove('selected'));
    selected.classList.add('selected');
    const sortBy = document.getElementById('listing-sortby');
    sortBy.textContent = selected.textContent;
    sortBy.dataset.sort = selected.dataset.sort;
    document.getElementById('listing-sortby').textContent = selected.textContent;
    block.querySelector('.listing-sortby ul').classList.remove('visible');
    runSearch(createFilterConfig());
  };

  sortList.addEventListener('click', (event) => {
    selectSort(event.target);
  });

  const displayFacets = (facets, filters) => {
    const rawFilters = getSelectedFilters().map((check) => check.value);
    const selected = config.category
      ? rawFilters.filter((filter) => filter !== config.category)
      : rawFilters;
    facetsElement.innerHTML = getFacetHTML(ph, horizFilters);

    addEventListeners(
      [
        facetsElement.querySelector('.listing-apply-filters button'),
        facetsElement.querySelector(':scope > div'),
        facetsElement,
      ],
      'click',
      (event) => {
        if (event.currentTarget === event.target) {
          block.querySelector('.listing-facets').classList.remove('visible');
        }
      },
    );

    const selectedFilters = block.querySelector('.listing-filters-selected');
    selected.forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'listing-filters-tag';
      span.textContent = tag;
      span.addEventListener('click', () => {
        document.getElementById(`listing-filter-${tag}`).checked = false;
        const filterConfig = createFilterConfig();

        runSearch(filterConfig);
      });
      selectedFilters?.append(span);
    });

    facetsElement.querySelector('.listing-filters-clear').addEventListener('click', () => {
      selected.forEach((tag) => {
        document.getElementById(`listing-filter-${tag}`).checked = false;
      });
      const filterConfig = createFilterConfig();

      runSearch(filterConfig);
    });

    /* list facets */
    const facetsList = block.querySelector('.listing-filters-facetlist');
    const facetKeys = Object.keys(facets);
    facetKeys.forEach((facetKey) => {
      const filter = filters[facetKey];
      const filterValues = filter ? filter.split(',').map((t) => t.trim()) : [];
      const facetValues = Object.keys(facets[facetKey]);
      facetValues.sort();
      if (facetValues.length) {
        const div = document.createElement('div');
        div.className = 'listing-facet';
        const h3 = document.createElement('h3');
        h3.innerHTML = ph[facetKey];
        div.append(h3);
        facetValues.forEach((facetValue) => {
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.value = facetValue;
          input.checked = filterValues.includes(facetValue);
          input.id = `listing-filter-${facetValue}`;
          input.name = facetKey;
          const label = document.createElement('label');
          label.setAttribute('for', input.id);
          label.textContent = `${facetValue} (${facets[facetKey][facetValue]})`;
          div.append(input, label);
          input.addEventListener('change', () => {
            const filterConfig = createFilterConfig();

            runSearch(filterConfig);
          });
        });
        facetsList.append(div);
      }
    });
  };

  runSearch(config);
}
