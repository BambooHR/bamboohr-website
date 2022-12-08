import {
  readBlockConfig,
  toCamelCase,
} from '../../scripts/scripts.js';

function createAppCardHeader(config) {
  const cardHeader = document.createElement('div');
  cardHeader.className = 'app-cards-header-row';
  const moreLink = 'app-cards-more-link';
  const viewAll = config.viewAll
    ? `<a class="${moreLink}" href="${config.viewAll}">View all</a>` : '';
  cardHeader.innerHTML = `<div class="app-cards-header-title typ-title1">${config.title}</div>${viewAll}`;
  return (cardHeader);
}

export default async function decorate(block) {
  const blockConfig = readBlockConfig(block);

  /* camelCase config */
  const config = {};
  Object.keys(blockConfig).forEach((key) => { config[toCamelCase(key)] = blockConfig[key]; });

  block.innerHTML = '';
  block.append(createAppCardHeader(config));
}
