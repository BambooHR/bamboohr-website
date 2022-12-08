import {
  readBlockConfig,
  toCamelCase,
} from '../../scripts/scripts.js';

function createPagingLine(config) {
  const pagingLine = document.createElement('div');
  const prevLink = config.previousPage
    ? `<span><a class="paging-link" href="${config.previousPage}">‹‹ Previous page</a></span>` : '';
  const nextLink = config.nextPage
    ? `<span><a class="paging-link" href="${config.nextPage}">Next page ››</a></span>` : '';
  pagingLine.innerHTML = `
  <div class="paging-line">
    <span class="">${config.totalItems} items</span>
    ${prevLink}
    <span class="">‹ Page ${config.currentPageNumber} of ${config.totalPages} ›</span>
    ${nextLink}
  </div>
  <div>
    <hr>
  </div>`;
  return (pagingLine);
}

export default async function decorate(block) {
  const blockConfig = readBlockConfig(block);

  /* camelCase config */
  const config = {};
  Object.keys(blockConfig).forEach((key) => { config[toCamelCase(key)] = blockConfig[key]; });

  block.innerHTML = '';
  block.append(createPagingLine(config));
}
