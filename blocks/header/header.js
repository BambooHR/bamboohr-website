import {
  loadFragment,
  toClassName,
  decorateIcons,
  insertNewsletterForm,
  getMetadata,
} from '../../scripts/scripts.js';

const mediaQueryDesktop = window.matchMedia('(min-width: 1200px)');

/**
 * collapses all open nav sections
 * @param {Element} sections The container element
 */
function collapseAll(elems) {
  elems.forEach((section) => {
    section.setAttribute('aria-expanded', 'false');
  });
}

function hideSearchInput(navSearchBtn, phoneNumElem) {
  navSearchBtn.classList.remove('hide-btn');
  navSearchBtn.nextElementSibling.classList.remove('show-input');
  navSearchBtn.parentElement.classList.remove('search-open');
  navSearchBtn.parentElement.parentElement.parentElement.classList.remove('search-open');
  if (phoneNumElem) phoneNumElem.style.display = '';
}

function addSearch(buttonsContainer) {
  const search = buttonsContainer.querySelector('p:not(:has(*))');
  if (search?.textContent?.toLowerCase() === '[search]') {
    buttonsContainer.parentElement.classList.add('has-search');
    // Build search.
    const div = document.createElement('div');
    div.className = 'nav-search-wrapper';
    buttonsContainer.insertBefore(div, search);
    div.innerHTML = `
    <div class="nav-search-btn">
      <img src="${window.hlx.codeBasePath}/icons/search.svg" alt="search" class="icon icon-search"></img>
    </div>
    <div class="nav-search-text-area">
      <div class="nav-search-input-wrapper">
        <input type="search" class="nav-search-input" placeholder="What can we help you find?" aria-label="Enter your search terms here"/>
      </div>
      <button type="button" class="nav-search-input-btn" aria-label="Click here to search">
        <img class="icon icon-search" src="${window.hlx.codeBasePath}/icons/search.svg" alt="Search">
      </button>
    </div>`;

    search.remove();

    // Setup listeners
    const navSearchBtn = div.querySelector('.nav-search-btn');
    const navSearchInput = div.querySelector('.nav-search-input');
    const navSearchInputBtn = div.querySelector('.nav-search-input-btn');
    const phoneNumElem = buttonsContainer.querySelector('.phone-number');

    navSearchBtn.addEventListener('click', () => {
      // Show search input
      navSearchBtn.parentElement.classList.add('search-open');
      navSearchBtn.parentElement.parentElement.parentElement.classList.add('search-open');
      navSearchBtn.classList.add('hide-btn');
      if (phoneNumElem) phoneNumElem.style.display = 'none';
      navSearchBtn.nextElementSibling.classList.add('show-input');
      navSearchInput.focus();
    });

    navSearchInput.addEventListener('keyup', (evt) => {
      // Invoke search on 'enter' key
      if (evt.keyCode === 13) navSearchInputBtn.click();
    });

    navSearchInput.addEventListener('blur', (evt) => {
      if (evt.relatedTarget?.classList.contains('nav-search-input-btn')) navSearchInputBtn.click();
      else hideSearchInput(navSearchBtn, phoneNumElem);
    });

    navSearchInputBtn.addEventListener('click', () => {
      const searchText = navSearchInput.value.toLowerCase();
      const encoded = encodeURIComponent(searchText);
      if (encoded) window.location.href = `https://www.bamboohr.com/search/?q=${encoded}`;
      else hideSearchInput(navSearchBtn, phoneNumElem);
    });
  }
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.textContent = '';

  // fetch nav content
  let navPath = getMetadata('nav');
  if (!navPath) {
    if (window.location.pathname.startsWith('/blog/')) navPath = '/blog/fixtures/nav';
    else navPath = '/nav';
  }

  const resp = await fetch(`${window.hlx.serverPath}${navPath}.plain.html`);
  let html = await resp.text();

  // forward compatibility
  html = html.replaceAll('<ol>', '<ul>');
  html = html.replaceAll('</ol>', '</ul>');

  // decorate nav DOM
  const nav = document.createElement('div');
  nav.classList.add('nav');
  nav.setAttribute('role', 'navigation');
  const navSections = document.createElement('div');
  navSections.classList.add('nav-sections');
  navSections.setAttribute('am-region', 'Main Nav');
  nav.innerHTML = html;
  nav.querySelectorAll(':scope > div').forEach((navSection, i) => {
    if (!i) {
      // first section is the brand section
      const brand = navSection;
      if (navPath === '/nav') brand.classList.add('simple');
      brand.classList.add('nav-brand');
      nav.insertBefore(navSections, brand.nextElementSibling);
    } else {
      // all other sections
      const h2 = navSection.querySelector('h2');
      if (h2) {
        const ul = navSection.querySelector('ul');

        if (!ul && !h2.querySelector('a')) {
          navSection.classList.add(`nav-section-${toClassName(h2.textContent)}`);
          const wrapper = document.createElement('div');
          wrapper.className = 'nav-section-wrapper';
          while (h2.nextElementSibling) wrapper.append(h2.nextElementSibling);
          navSection.append(wrapper);
        }
        navSections.append(navSection);
        navSection.classList.add('nav-section');
        navSection.setAttribute('am-region', h2.textContent);
        if (!h2.querySelector('a')) {
          h2.addEventListener('click', () => {
            if (mediaQueryDesktop.matches) collapseAll([...navSections.children]);
            else {
              const expanded = navSection.getAttribute('aria-expanded') === 'true';
              collapseAll([...navSections.children]);
              navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            }
          });
          navSection.querySelectorAll(':scope > ul > li').forEach((li) => {
            if (!li.querySelector(':scope > a')) {
              li.classList.add('sub-menu');
              li.addEventListener('click', () => {
                if (mediaQueryDesktop.matches) {
                  collapseAll([...nav.querySelectorAll('li[aria-expanded="true"]')]);
                } else {
                  const expanded = li.getAttribute('aria-expanded') === 'true';
                  collapseAll([...nav.querySelectorAll('li[aria-expanded="true"]')]);
                  li.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                }
              });
            }
          });
        }
      } else {
        const buttonsContainer = navSection;
        buttonsContainer.className = 'nav-buttons';
        const buttons = buttonsContainer.querySelectorAll('a');
        if (buttons.length === 3) buttonsContainer.parentElement.classList.add('extra-buttons');
        buttons.forEach((a) => {
          if (a.href.startsWith('tel:')) a.classList.add('phone-number');
          a.classList.add('button', 'small');
          if (a.parentElement.tagName === 'EM') {
            a.classList.add('light');
          }
        });

        addSearch(buttonsContainer);
      }
    }
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = '<div class="nav-hamburger-icon"></div>';
  hamburger.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    document.body.style.overflowY = expanded ? '' : 'hidden';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  const createSearch = () => {
    const div = document.createElement('div');
    div.className = 'header-search';
    div.innerHTML = `<a href="#" data-modal="/tools/search"><img src="${window.hlx.codeBasePath}/icons/search.svg" alt="search" class="icon icon-search"></a>`;
    div.addEventListener('click', async () => {
      const elem = document.getElementById('header-search-modal');
      if (!elem) {
        const modal = document.createElement('div');
        modal.className = 'header-search-modal';
        modal.id = 'header-search-modal';
        modal.innerHTML = '<div class="header-search-close"></div>';
        const fragment = await loadFragment('/blog/fixtures/search');
        modal.append(fragment);
        block.append(modal);
        modal.classList.add('visible');
        const close = modal.querySelector('.header-search-close');
        close.addEventListener('click', () => {
          modal.classList.remove('visible');
          document.body.style.overflowY = '';
        });
      } else {
        elem.classList.add('visible');
      }
      document.body.style.overflowY = 'hidden';
    });
    return div;
  };

  block.append(nav);

  insertNewsletterForm(block, () => {
    collapseAll([...nav.querySelectorAll('[aria-expanded="true"]')]);
  });

  let collection = 'prelogin';
  const theme = getMetadata('theme');
  const template = toClassName(getMetadata('template'));
  if (theme === 'integrations') collection = 'integrations';
  else if (window.location.pathname.startsWith('/blog')) collection = 'blog';
  else if (template === 'resources-guides') collection = 'resources-guides';
  else if (template === 'pricing-quote') collection = 'pricing-quote';

  if (collection === 'blog') block.append(createSearch());
  decorateIcons(block);
}
