import { buildBlock, getMetadata, toClassName } from './scripts.js';

function toSlug(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

function buildCarousel(main) {
  const pictures = [...main.querySelectorAll('picture')];
  if (pictures[0]) {
    const section = document.createElement('div');
    const blockStruct = pictures.map((picture) => {
      picture.parentElement.remove();
      return [picture];
    });
    const block = buildBlock('carousel', blockStruct);
    section.prepend(block);
    main.prepend(section);
  }
}

function buildHighlightsColumns(main) {
  const integration = getMetadata('integration-type');
  const direction = getMetadata('direction-of-data-flow');
  const trigger = getMetadata('sync-trigger');
  const frequency = getMetadata('sync-frequency');
  const columnData = [];
  if (integration) columnData.push(`<img src="/styles/integration-type.svg" /><h4>Integration Type</h4><p>${integration}</p>`);
  if (direction) columnData.push(`<img src="/styles/data-flow-direction.svg" /><h4>Direction of Data Flow</h4><p>${direction}</p>`);
  if (trigger) columnData.push(`<img src="/styles/sync-trigger.svg" /><h4>Sync Trigger</h4><p>${trigger}</p>`);
  if (frequency) columnData.push(`<img src="/styles/sync-frequency.svg" /><h4>Sync Frequency</h4><p>${frequency}</p>`);

  if (columnData.length > 0) {
    const columns = buildBlock('columns', [columnData]);
    columns?.classList?.add('listing-highlights');
    main.querySelector('.carousel')?.after(columns);
  }
}

function setupListingTabs(main) {
  const container = main.querySelector('.tabs-container');
  const blockContent = [];
  if (container) {
    const tabs = container.querySelectorAll('h2');
    tabs.forEach((tab) => {
      const content = document.createElement('div');
      let sibling = tab.nextElementSibling;
      while (sibling && ![...tabs].includes(sibling)) {
        content.append(sibling.cloneNode(true));
        sibling = sibling.nextElementSibling;
      }
      content.prepend(tab);
      if (content) blockContent.push([content.innerHTML]);
    });
    const block = buildBlock('tabs', blockContent);
    container.innerHTML = block.outerHTML;
  }
}

function populateListingDetails(main) {
  const details = main.querySelector('.details-container');
  if (details) {
    const logo = getMetadata('logo');
    const logoImg = document.createElement('img');
    logoImg.classList.add('details-logo');
    logoImg.alt = `${main.querySelector('h1').textContent} logo`;
    logoImg.src = logo;
    details.prepend(logoImg);
    const level = getMetadata('level');
    if (level && level !== 'BambooHR Product') {
      const levelBtn = document.createElement('a');
      levelBtn.id = 'marketplace-details-tier';
      levelBtn.innerHTML = `<img class="details-badge" title="${level} badge" src="/icons/${toClassName(level)}-badge.svg" />`;
      logoImg.after(levelBtn);
    }
  }
}

function buildListingHeader(main) {
  const section = document.createElement('div');
  const h1 = main.querySelector('h1');
  const category = getMetadata('category');
  let listingCategoriesLi = '';
  if (category) {
    const categories = category.split(',');
    const listingCategories = categories.reduce((l, cat, i) => {
      const catVal = i > 0 ? `,${cat}` : cat;
      return `${l}<a href="/integrations/listing-category/${toSlug(cat.trim())}">${catVal}</a>`;
    }, '');
    listingCategoriesLi = `<li>${listingCategories}</li>`;
  }
  section.append(buildBlock('listing-header', [
    [h1],
    [`<ul>
    <li><a href="/integrations/">Home</a></li>
    ${listingCategoriesLi}
    <li>${h1.textContent}</li>
    </ul>`],
  ]));
  main.prepend(section);
}

export default async function decorateTemplate(main) {
  buildCarousel(main);
  buildListingHeader(main);
  buildHighlightsColumns(main);
  // build request information button
  const requestInfo = document.createElement('p');
  const appName = window.location.pathname.split('/').pop();
  const level = getMetadata('level');
  const requestType = getMetadata('form-request-type');
  let formPageLink = `/integrations/request-information?appName=${appName}`;
  if (level === 'BambooHR Product') {
    formPageLink = `/integrations/request-information-bamboohr-products?requestType=${requestType}`;
  }
  const extraFormFields = getMetadata('extra-form-fields');
  if (extraFormFields) {
    const fieldsParam = extraFormFields.split(',').map((field) => `show=${field.trim()}`).join('&');
    formPageLink = `/integrations/request-information?appName=${appName}&${fieldsParam}`;
  }

  requestInfo.innerHTML = `<a href="${formPageLink}" id="marketplace-request-info">Request Information</a>`;

  const sections = [...main.children].slice(2);
  if (sections.length < 3) {
    // if missing, add listing details section
    const section = document.createElement('div');
    main.insertBefore(section, sections[0]);
    sections.unshift(section);
  }
  const includRequestInfo = getMetadata('request-information');
  if (!includRequestInfo || includRequestInfo.toLowerCase().trim() !== 'no') sections[0].append(requestInfo);
  const classes = ['links', 'tabs', 'details'];
  sections.forEach((section, i) => section.classList.add(`${classes[i]}-container`));
  setupListingTabs(main);
  populateListingDetails(main);
}
