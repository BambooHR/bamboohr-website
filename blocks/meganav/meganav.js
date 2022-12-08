import {
  createElem,
  decorateButtons,
  decorateIcons,
} from '../../scripts/scripts.js';

const LEVEL_1_NAV_SELECTOR = '.header-nav-level-1';
const EXPANDED_CSS_CLASS = 'header-level-1-expanded';
const LINK_ANIMATION_CSS_CLASS = 'header-link-border-animation';
const MEGANAV_LOCATION = '/meganav/index';

function buildSecondaryNav(ref) {
  const secondaryNavButtonElems = ref.querySelectorAll(':scope > div:nth-child(3) p');

  const secondaryNavElem = document.createElement('nav');
  secondaryNavElem.classList.add('header-secondary-nav');

  secondaryNavButtonElems.forEach((buttonElem) => {
    decorateButtons(buttonElem);

    secondaryNavElem.append(buttonElem);
  });

  return secondaryNavElem;
}

function buildSearchButton() {
  const searchButtonElem = document.createElement('a');
  searchButtonElem.classList.add('header-search-btn');

  const searchIconElem = document.createElement('span');
  searchIconElem.classList.add('icon', 'icon-search');
  searchButtonElem.append(searchIconElem);

  decorateIcons(searchButtonElem);

  return searchButtonElem;
}

function buildMobileUtility() {
  const menuElem = document.createElement('div');
  menuElem.classList.add('header-menu-button');
  menuElem.setAttribute('aria-label', 'Toggle Navigation');
  menuElem.innerHTML = '<span></span><span></span><span></span>';

  menuElem.addEventListener('click', (event) => {
    event.target.closest('.header-menu-button').classList.toggle('header-menu-button-open');
    document.querySelector('.header-root')?.classList.toggle('header-expanded');
  });

  const mobileUtilityElem = document.createElement('div');
  mobileUtilityElem.classList.add('header-mobile-utility');

  mobileUtilityElem.append(buildSearchButton());
  mobileUtilityElem.append(menuElem);

  return mobileUtilityElem;
}

/**
 * @param {Element} ref Reference Element to extract data from
 * @return {Element} built out topmost element
 */
function buildTopMostElem(ref) {
  const logoIconElem = ref.querySelector(':scope > div:first-child a');
  logoIconElem.classList.add('header-logo');

  // Topmost section, need layering for the various backgrounds

  const topmostInnerElem = document.createElement('div');
  topmostInnerElem.classList.add('header-topmost-inner');

  topmostInnerElem.append(logoIconElem);
  topmostInnerElem.append(buildSecondaryNav(ref));
  topmostInnerElem.append(buildMobileUtility());

  const topmostElem = document.createElement('div');
  topmostElem.classList.add('header-topmost');

  const topmostOuterElem = document.createElement('div');
  topmostOuterElem.classList.add('header-topmost-outer');

  topmostElem.append(topmostInnerElem);
  topmostOuterElem.append(topmostElem);

  return topmostOuterElem;
}

const navOpenHandler = (evt) => {
  const mediaQuery = window.matchMedia('(min-width: 1025px)');
  if (mediaQuery.matches) {
    return;
  }
  evt.preventDefault();

  evt.target.closest(LEVEL_1_NAV_SELECTOR)?.classList.add(EXPANDED_CSS_CLASS);
};

const navCloseHandler = (evt) => {
  evt.preventDefault();
  evt.target.closest(LEVEL_1_NAV_SELECTOR)?.classList.remove(EXPANDED_CSS_CLASS);
};

const navTitleToggleHandler = (evt) => {
  const mediaQuery = window.matchMedia('(min-width: 1025px)');
  if (mediaQuery.matches) {
    return;
  }

  evt.target.closest('.header-level-1-link').classList.toggle('header-level-1-link-expanded');
  evt.preventDefault();
};

function buildMobileNavHeading(linkElem) {
  const headingElem = document.createElement('div');
  headingElem.classList.add('header-mobile-nav-heading');

  const closeBtnElem = document.createElement('button');
  closeBtnElem.classList.add('header-nav-level-1-close');
  closeBtnElem.innerHTML = '<span>Close</span>';
  closeBtnElem.addEventListener('click', navCloseHandler);

  headingElem.append(closeBtnElem, linkElem.textContent);

  return headingElem;
}

function buildLevel1Link(ref) {
  const titleRef = ref.querySelector(':scope > div:first-child > h2 a');
  const descriptionRef = ref.querySelector(':scope > div:first-child > p');

  const linkElem = document.createElement('a');
  linkElem.classList.add('header-level-1-link', LINK_ANIMATION_CSS_CLASS);
  linkElem.setAttribute('href', titleRef?.href);
  linkElem.setAttribute('am-region', titleRef?.textContent);

  const titleElem = document.createElement('span');
  titleElem.classList.add('header-level-1-link-title');
  titleElem.textContent = titleRef?.textContent;

  const descriptionElem = document.createElement('span');
  descriptionElem.classList.add('header-level-1-link-description');
  descriptionElem.textContent = descriptionRef?.textContent;

  linkElem.append(titleElem, descriptionElem);

  linkElem.addEventListener('click', navTitleToggleHandler);

  return linkElem;
}

const level2ToggleHandler = (evt) => {
  const mediaQuery = window.matchMedia('(min-width: 1025px)');
  if (mediaQuery.matches) return;
  // mobile only
  evt.target.parentElement.classList.toggle('header-level-2-expanded');
  evt.preventDefault();
};

function buildLevel2Column(ref) {
  const colElem = document.createElement('div');
  colElem.classList.add('header-subnav-col');

  const firstChild = ref.firstElementChild;

  if (firstChild.nodeName === 'H3') {
    // Header Link
    const level2LinkElem = firstChild.firstElementChild;
    level2LinkElem.classList.add('header-level-2-main-link', LINK_ANIMATION_CSS_CLASS);
    colElem.setAttribute('am-region', level2LinkElem.textContent);

    level2LinkElem.addEventListener('click', level2ToggleHandler);

    const secondChild = firstChild.nextElementSibling;
    if (secondChild?.nodeName === 'H4') {
      const level2LinkDescriptionElem = createElem('span', 'header-level-2-main-link-description');
      level2LinkDescriptionElem.textContent = secondChild.textContent;

      level2LinkElem.append(level2LinkDescriptionElem);
    }

    colElem.append(level2LinkElem);
  }

  const linkList = ref.querySelector('ul');

  if (linkList) {
    linkList.classList.add('header-subnav-list');
    const accordionElem = createElem('div', 'header-subnav-accordion');
    accordionElem.append(linkList);
    colElem.append(accordionElem);

    linkList.querySelectorAll('li').forEach((liElem) => {
      const firstLinkElem = liElem?.firstElementChild;
      const anchorElem = liElem.querySelector('a');
      anchorElem?.classList.add('header-sub-link', LINK_ANIMATION_CSS_CLASS);
      if (firstLinkElem?.nodeName === 'EM') {
        anchorElem.classList.add('header-link-mobile');

        firstLinkElem.remove();
        liElem.append(anchorElem);
      }
    });
  }

  return colElem;
}

function buildSubNavChildren(ref) {
  const columnsRowElems = ref.querySelectorAll('.columns > div');

  const subNavChildrenElem = document.createElement('div');
  subNavChildrenElem.classList.add('header-level-1-subnav-children');

  columnsRowElems.forEach((rowRef) => {
    const columns = [...rowRef.children];
    const occupiedCols = columns.filter((column) => column.childNodes.length);

    const rowElem = document.createElement('div');
    rowElem.classList.add('header-subnav-row', `header-subnav-row-${occupiedCols.length}-col`);

    occupiedCols.forEach((colRef) => {
      rowElem.append(buildLevel2Column(colRef));
    });

    subNavChildrenElem.append(rowElem);
  });

  return subNavChildrenElem;
}

function buildSidebar(ref) {
  const sidebarElem = createElem('div', 'header-sidebar');

  const cta1 = ref.querySelector(':scope > div:nth-child(2)');
  cta1?.classList.add('header-cta', 'header-cta-primary');
  let cta1AMRegion = cta1?.innerHTML.match(/<h\d.*?>(.*)<\/h\d>/);
  cta1AMRegion = (cta1AMRegion ? `CTA 1: ${cta1AMRegion[1]}` : 'CTA 1');
  cta1?.setAttribute('am-region', cta1AMRegion);
  const cta2 = ref.querySelector(':scope > div:nth-child(3)');
  cta2?.classList.add('header-cta', 'header-cta-secondary');
  let cta2AMRegion = cta2?.innerHTML.match(/<h\d.*?>(.*)<\/h\d>/);
  cta2AMRegion = (cta2AMRegion ? `CTA 2: ${cta2AMRegion[1]}` : 'CTA 2');
  cta2?.setAttribute('am-region', cta2AMRegion);

  if (cta1) {
    sidebarElem.append(cta1);
  }

  if (cta2) {
    sidebarElem.append(cta2);
  }

  decorateButtons(sidebarElem);

  return sidebarElem;
}

function buildNavLevel1Container(ref, linkElem) {
  const level1ContainerElem = document.createElement('div');
  level1ContainerElem.classList.add('header-nav-level-1-container');

  const shellElem = document.createElement('div');
  shellElem.classList.add('header-nav-level-1-container-shell');

  const innerElem = document.createElement('div');
  innerElem.classList.add('header-nav-level-1-container-inner');

  innerElem.append(buildMobileNavHeading(linkElem));

  const contentElem = document.createElement('div');
  contentElem.classList.add('header-level-1-content');

  const subnavElem = document.createElement('div');
  subnavElem.classList.add('header-level-1-subnav');

  subnavElem.append(buildLevel1Link(ref), buildSubNavChildren(ref));

  contentElem.append(subnavElem);
  contentElem.append(buildSidebar(ref));
  innerElem.append(contentElem);
  shellElem.append(innerElem);
  level1ContainerElem.append(shellElem);

  return level1ContainerElem;
}

async function buildNavLevel1(linkElem) {
  const level1Src = new URL(`${window.hlx.serverPath}${linkElem.pathname}.plain.html`, window.location.href).toString();
  const resp = await fetch(level1Src);
  const level1Ref = document.createElement('div');
  level1Ref.innerHTML = await resp.text();
  level1Ref.querySelectorAll('picture img, picture source').forEach((e) => {
    if (e.src) e.src = new URL(e.getAttribute('src'), level1Src);
    if (e.srcset) e.srcset = new URL(e.getAttribute('srcset'), level1Src);
  });

  const level1RootElem = document.createElement('div');
  level1RootElem.classList.add('header-nav-level-1');
  level1RootElem.setAttribute('am-region', linkElem.textContent);

  const topNavLink = document.createElement('a');
  topNavLink.classList.add('header-top-link');

  topNavLink.textContent = linkElem.textContent;

  const level1Anchor = level1Ref.querySelector(':scope > div:first-child a');
  topNavLink.setAttribute('href', level1Anchor.getAttribute('href'));

  topNavLink.addEventListener('click', navOpenHandler);

  level1RootElem.append(topNavLink);
  level1RootElem.append(buildNavLevel1Container(level1Ref, linkElem));

  return level1RootElem;
}

function buildMobileCta(ref) {
  const ctaRef = ref.querySelector(':scope > div:nth-child(2) ul + p');

  const mobileCta = createElem('div', 'header-cta');
  mobileCta.classList.add('header-cta-secondary', 'header-mobile-cta');

  if (ctaRef) {
    mobileCta.append(ctaRef);
    decorateButtons(mobileCta);
  }

  return mobileCta;
}

async function buildNavContainer(ref) {
  const navRef = ref.querySelector(':scope > div:nth-child(2)');
  const navContainer = document.createElement('div');
  navContainer.classList.add('header-nav-container');
  navContainer.setAttribute('am-region', 'Mega Nav');

  const mainNavElem = document.createElement('nav');
  mainNavElem.classList.add('header-navigation');

  const level1LiElems = [...navRef.querySelectorAll(':scope ul li')];

  const level1Results = await Promise.all(level1LiElems.map(async (level1LiElem) => {
    const level1PathAnchorElem = level1LiElem.querySelector('a');
    return buildNavLevel1(level1PathAnchorElem);
  }));

  mainNavElem.append(...level1Results, buildMobileCta(ref));

  navContainer.append(mainNavElem);

  return navContainer;
}

/**
 * decorates the header
 * @param {Element} block  The header block element
 */
export default async function decorate(block) {
  block.textContent = '';

  // fetch nav content
  const navPath = MEGANAV_LOCATION;

  const resp = await fetch(`${window.hlx.serverPath}${navPath}.plain.html`);
  let html = await resp.text();

  // forward compatibility
  html = html.replaceAll('<ol>', '<ul>');
  html = html.replaceAll('</ol>', '</ul>');

  const ref = document.createElement('div');

  ref.innerHTML = html;

  const headerRootElem = document.createElement('div');
  headerRootElem.classList.add('header-root', 'blue');

  headerRootElem.append(buildTopMostElem(ref));
  headerRootElem.append(await buildNavContainer(ref));

  decorateIcons(headerRootElem);

  block.append(headerRootElem);
}
