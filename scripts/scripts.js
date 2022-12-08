/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 */

export function sampleRUM(checkpoint, data = {}) {
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = usp.get('rum') === 'on' ? 1 : 100; // with parameter, weight is 1. Defaults to 100.
      // eslint-disable-next-line no-bitwise
      const hashCode = (s) => s.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
      const id = `${hashCode(window.location.href)}-${new Date().getTime()}-${Math.random()
        .toString(16)
        .substr(2, 14)}`;
      const random = Math.random();
      const isSelected = random * weight < 1;
      // eslint-disable-next-line object-curly-newline
      window.hlx.rum = { weight, id, random, isSelected };
    }
    const { random, weight, id } = window.hlx.rum;
    if (random && random * weight < 1) {
      const sendPing = () => {
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const body = JSON.stringify({
          weight,
          id,
          referer: window.location.href,
          // eslint-disable-next-line no-use-before-define
          generation: RUM_GENERATION,
          checkpoint,
          ...data,
        });
        const url = `https://rum.hlx.page/.rum/${weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
      };
      sendPing();
      // special case CWV
      if (checkpoint === 'cwv') {
        // use classic script to avoid CORS issues
        const script = document.createElement('script');
        script.src = 'https://rum.hlx.page/.rum/web-vitals/dist/web-vitals.iife.js';
        script.onload = () => {
          const storeCWV = (measurement) => {
            data.cwv = {};
            data.cwv[measurement.name] = measurement.value;
            sendPing();
          };
          // When loading `web-vitals` using a classic script, all the public
          // methods can be found on the `webVitals` global namespace.
          window.webVitals.getCLS(storeCWV);
          window.webVitals.getFID(storeCWV);
          window.webVitals.getLCP(storeCWV);
        };
        document.head.appendChild(script);
      }
    }
  } catch (e) {
    // something went wrong
  }
}

sampleRUM.blockobserver = window.IntersectionObserver
  ? new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => {
            sampleRUM.blockobserver.unobserve(entry.target); // observe only once
            const target = sampleRUM.targetselector(entry.target);
            const source = sampleRUM.sourceselector(entry.target);
            sampleRUM('viewblock', { target, source });
          });
      },
      { threshold: 0.25 }
    )
  : { observe: () => {} };

sampleRUM.mediaobserver = window.IntersectionObserver
  ? new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => {
            sampleRUM.mediaobserver.unobserve(entry.target); // observe only once
            const target = sampleRUM.targetselector(entry.target);
            const source = sampleRUM.sourceselector(entry.target);
            sampleRUM('viewmedia', { target, source });
          });
      },
      { threshold: 0.25 }
    )
  : { observe: () => {} };

sampleRUM.observe = (elements) => {
  elements.forEach((element) => {
    if (
      element.tagName.toLowerCase() === 'img' ||
      element.tagName.toLowerCase() === 'video' ||
      element.tagName.toLowerCase() === 'audio' ||
      element.tagName.toLowerCase() === 'iframe'
    ) {
      sampleRUM.mediaobserver.observe(element);
    } else {
      sampleRUM.blockobserver.observe(element);
    }
  });
};

sampleRUM.targetselector = (element) => {
  let value = element.getAttribute('href') || element.currentSrc || element.getAttribute('src');
  if (value && value.startsWith('https://')) {
    // resolve relative links
    value = new URL(value, window.location).href;
  }
  return value;
};

sampleRUM.sourceselector = (element) => {
  if (element === document.body || element === document.documentElement || !element) {
    return undefined;
  }
  if (element.id) {
    return `#${element.id}`;
  }
  if (element.getAttribute('data-block-name')) {
    return `.${element.getAttribute('data-block-name')}`;
  }
  return sampleRUM.sourceselector(element.parentElement);
};

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
export function loadCSS(href, callback) {
  if (!document.querySelector(`head > link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', href);
    if (typeof callback === 'function') {
      link.onload = (e) => callback(e.type);
      link.onerror = (e) => callback(e.type);
    }
    document.head.appendChild(link);
  } else if (typeof callback === 'function') {
    callback('noop');
  }
}

/**
 * Loads a template specific CSS file.
 */
 function loadTemplateCSS() {
  const template = toClassName(getMetadata('template'));
  if (template) {
    const templates = ['bhr-comparison', 'bhr-home', 'ee-solution', 'hr-glossary', 'hr-software-payroll', 'hr-unplugged',
      'industry', 'live-demo-webinars', 'payroll-roi', 'performance-reviews', 'pricing-quote'];
    if (templates.includes(template)) {
      const cssBase = `${window.hlx.serverPath}${window.hlx.codeBasePath}`;
      loadCSS(`${cssBase}/styles/templates/${template}.css`);
    }
  }
}

/**
 * Retrieves the content of a metadata tag.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value
 */
export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return meta && meta.content;
}

/**
 * Adds one or more URLs to the dependencies for publishing.
 * @param {string|[string]} url The URL(s) to add as dependencies
 */
export function addPublishDependencies(url) {
  const urls = Array.isArray(url) ? url : [url];
  window.hlx = window.hlx || {};
  if (window.hlx.dependencies && Array.isArray(window.hlx.dependencies)) {
    window.hlx.dependencies = window.hlx.dependencies.concat(urls);
  } else {
    window.hlx.dependencies = urls;
  }
}

/**
 * Sanitizes a name for use as class name.
 * @param {string} name The unsanitized name
 * @returns {string} The class name
 */
export function toClassName(name) {
  return name && typeof name === 'string' ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-') : '';
}

/*
 * Sanitizes a name for use as a js property name.
 * @param {string} name The unsanitized name
 * @returns {string} The camelCased name
 */
export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Replace icons with inline SVG and prefix with codeBasePath.
 * @param {Element} element
 */
function replaceIcons(element) {
  element.querySelectorAll('img.icon').forEach((img) => {
    const span = document.createElement('span');
    span.className = img.className;
    img.replaceWith(span);
  });
}

/**
 * Replace icons with inline SVG and prefix with codeBasePath.
 * @param {Element} element
 */
export function decorateIcons(element) {
  // prepare for forward compatible icon handling
  replaceIcons(element);

  const fetchBase = window.hlx.serverPath;
  element.querySelectorAll('span.icon').forEach((span) => {
    const iconName = span.className.split('icon-')[1];
    fetch(`${fetchBase}${window.hlx.codeBasePath}/icons/${iconName}.svg`).then((resp) => {
      if (resp.status === 200)
        resp.text().then((svg) => {
          const parent = span.firstElementChild?.tagName === 'A' ? span.firstElementChild : span;
          parent.innerHTML = svg;
        });
    });
  });
}

/**
 * Gets placeholders object
 * @param {string} prefix
 */
export async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  const loaded = window.placeholders[`${prefix}-loaded`];
  if (!loaded) {
    window.placeholders[`${prefix}-loaded`] = new Promise((resolve, reject) => {
      try {
        fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
          .then((resp) => resp.json())
          .then((json) => {
            const placeholders = {};
            json.data.forEach((placeholder) => {
              placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
            });
            window.placeholders[prefix] = placeholders;
            resolve();
          });
      } catch (e) {
        // error loading placeholders
        window.placeholders[prefix] = {};
        reject();
      }
    });
  }
  await window.placeholders[`${prefix}-loaded`];
  return window.placeholders[prefix];
}

/**
 * Decorates a block.
 * @param {Element} block The block element
 */
export function decorateBlock(block) {
  const trimDashes = (str) => str.replace(/(^\s*-)|(-\s*$)/g, '');
  const classes = Array.from(block.classList.values());
  const blockName = classes[0];
  if (!blockName) return;
  const section = block.closest('.section');
  if (section) {
    section.classList.add(`${blockName}-container`.replace(/--/g, '-'));
  }
  const blockWithVariants = blockName.split('--');
  const shortBlockName = trimDashes(blockWithVariants.shift());
  const variants = blockWithVariants.map((v) => trimDashes(v));
  block.classList.add(shortBlockName);
  block.classList.add(...variants);

  block.classList.add('block');
  block.setAttribute('data-block-name', shortBlockName);
  block.setAttribute('data-block-status', 'initialized');

  const blockWrapper = block.parentElement;
  blockWrapper.classList.add(`${shortBlockName}-wrapper`);

  [...block.classList]
    .filter((filter) => filter.match(/^content-width-/g))
    .forEach((style) => {
      block.parentElement.classList.add(style);
      block.classList.remove(style);
    });
  // eslint-disable-next-line no-use-before-define
  addClassToParent(block);
}

/**
 * Extracts the config from a block.
 * @param {Element} block The block element
 * @returns {object} The block config
 */
export function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope>div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const col = cols[1];
        const name = toClassName(cols[0].textContent);
        let value = '';
        if (col.querySelector('a')) {
          const as = [...col.querySelectorAll('a')];
          if (as.length === 1) {
            value = as[0].href;
          } else {
            value = as.map((a) => a.href);
          }
        } else if (col.querySelector('p')) {
          const ps = [...col.querySelectorAll('p')];
          if (ps.length === 1) {
            value = ps[0].textContent;
          } else {
            value = ps.map((p) => p.textContent);
          }
        } else value = row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

/**
 * Decorates backgrounds in sections.
 * @param {Element} $section The section element
 */
export function decorateBackgrounds($section) {
  const sectionKey = [...$section.parentElement.children].indexOf($section);
  [...$section.classList]
    .filter((filter) => filter.match(/^bg-/g))
    .forEach((style, bgKey) => {
      const background = document.createElement('span');
      const fetchBase = window.hlx.serverPath;
      const sizes = ['', 'laptop', 'tablet', 'mobile'];

      background.classList.add('bg', style);

      if (!style.startsWith('bg-gradient') && !style.startsWith('bg-solid')) {
        // get svgs
        sizes.forEach((size, sizeKey) => {
          let name = style;

          if (size) name += `-${size}`;

          fetch(`${fetchBase}${window.hlx.codeBasePath}/styles/backgrounds/${name}.svg`).then(
            (resp) => {
              // skip if not success
              if (resp.status !== 200) return;

              // put the svg in the span
              resp.text().then((output) => {
                const element = document.createElement('div');
                let html = output;

                // get IDs
                const matches = html.matchAll(/id="([^"]+)"/g);
                // replace IDs
                [...matches].forEach(([, match], matchKey) => {
                  html = html.replaceAll(
                    match,
                    `bg-id-${sectionKey}-${bgKey}-${sizeKey}-${matchKey}`
                  );
                });

                element.innerHTML = html;
                const svg = element.firstChild;

                svg.classList.add(size || 'desktop');

                background.append(svg);
                $section.classList.add('has-bg');
              });
            }
          );
        });
      }
      if (style.startsWith('bg-gradient') || style.startsWith('bg-solid')) {
        $section.classList.add('has-bg');
      }
      $section.prepend(background);
    });
}

/**
 * Decorates all sections in a container element.
 * @param {Element} $main The container element
 */
export function decorateSections($main) {
  $main.querySelectorAll(':scope > div').forEach((section) => {
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(e);
    });
    wrappers.forEach((wrapper) => section.append(wrapper));
    section.classList.add('section');
    section.setAttribute('data-section-status', 'initialized');

    /* process section metadata */
    const sectionMeta = section.querySelector('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      const keys = Object.keys(meta);
      keys.forEach((key) => {
        const styleValues = meta.style.split(',').map((t) => t.trim());
        styleValues.forEach((style) => {
          if (key === 'style') section.classList.add(toClassName(style));
          else section.dataset[key] = meta[key];
        });
      });
      decorateBackgrounds(section);
      sectionMeta.remove();
    }
  });
}

/**
 * Updates all section status in a container element.
 * @param {Element} main The container element
 */
export function updateSectionsStatus(main) {
  const sections = [...main.querySelectorAll(':scope > div.section')];
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const status = section.getAttribute('data-section-status');
    if (status !== 'loaded') {
      const loadingBlock = section.querySelector(
        '.block[data-block-status="initialized"], .block[data-block-status="loading"]'
      );
      if (loadingBlock) {
        section.setAttribute('data-section-status', 'loading');
        break;
      } else {
        section.setAttribute('data-section-status', 'loaded');
        const event = new CustomEvent('section-display', { detail: { section }});
        document.body.dispatchEvent(event);
        console.log('event dispatched')
      }
    }
  }
}

/**
 * Decorates all blocks in a container element.
 * @param {Element} main The container element
 */
export function decorateBlocks(main) {
  main
    .querySelectorAll('div.section div[class]:not(.default-content-wrapper)')
    .forEach((block) => decorateBlock(block));
}

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
export function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return blockEl;
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */
export async function loadBlock(block, eager = false) {
  if (
    !(
      block.getAttribute('data-block-status') === 'loading' ||
      block.getAttribute('data-block-status') === 'loaded'
    )
  ) {
    block.setAttribute('data-block-status', 'loading');
    const blockName = block.getAttribute('data-block-name');
    try {
      const cssLoaded = new Promise((resolve) => {
        const cssBase = `${window.hlx.serverPath}${window.hlx.codeBasePath}`;
        loadCSS(`${cssBase}/blocks/${blockName}/${blockName}.css`, resolve);
      });
      const decorationComplete = new Promise((resolve) => {
        (async () => {
          try {
            const mod = await import(`../blocks/${blockName}/${blockName}.js`);
            if (mod.default) {
              await mod.default(block, blockName, document, eager);
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log(`failed to load module for ${blockName}`, err);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`failed to load block ${blockName}`, err);
    }
    block.setAttribute('data-block-status', 'loaded');
  }
}

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Element} main The container element
 */
export async function loadBlocks(main) {
  updateSectionsStatus(main);
  const blocks = [...main.querySelectorAll('div.block')];
  for (let i = 0; i < blocks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(blocks[i]);
    updateSectionsStatus(main);
  }
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */
export function createOptimizedPicture(
  src,
  alt = '',
  eager = false,
  breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }]
) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

/**
 * Normalizes all headings within a container element.
 * @param {Element} el The container element
 * @param {[string]]} allowedHeadings The list of allowed headings (h1 ... h6)
 */
export function normalizeHeadings(el, allowedHeadings) {
  const allowed = allowedHeadings.map((h) => h.toLowerCase());
  el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((tag) => {
    const h = tag.tagName.toLowerCase();
    if (allowed.indexOf(h) === -1) {
      // current heading is not in the allowed list -> try first to "promote" the heading
      let level = parseInt(h.charAt(1), 10) - 1;
      while (allowed.indexOf(`h${level}`) === -1 && level > 0) {
        level -= 1;
      }
      if (level === 0) {
        // did not find a match -> try to "downgrade" the heading
        while (allowed.indexOf(`h${level}`) === -1 && level < 7) {
          level += 1;
        }
      }
      if (level !== 7) {
        tag.outerHTML = `<h${level} id="${tag.id}">${tag.textContent}</h${level}>`;
      }
    }
  });
}

/**
 * Set template (page structure) and theme (page styles).
 */
function decorateTemplateAndTheme() {
  const template = getMetadata('template');
  if (template) document.body.classList.add(toClassName(template));
  const theme = getMetadata('theme');
  if (theme) {
    const themeValues = theme.split(',').map((t) => t.trim());
    themeValues.forEach((t) => {
      if (t.toLowerCase() === 'base') document.querySelector('main')?.setAttribute('id', 'base');
      document.body.classList.add(toClassName(t));
    });
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * load LCP block and/or wait for LCP in default content.
 */
async function waitForLCP() {
  // eslint-disable-next-line no-use-before-define
  const lcpBlocks = LCP_BLOCKS;
  const block = document.querySelector('.block');
  const hasLCPBlock = block && lcpBlocks.includes(block.getAttribute('data-block-name'));
  if (hasLCPBlock) await loadBlock(block, true);

  document.querySelector('body').classList.add('appear');
  const lcpCandidate = document.querySelector('main img');
  await new Promise((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      lcpCandidate.setAttribute('loading', 'eager');
      lcpCandidate.addEventListener('load', () => resolve());
      lcpCandidate.addEventListener('error', () => resolve());
    } else {
      resolve();
    }
  });
}

/**
 * Decorates the page.
 */
async function loadPage(doc) {
  // eslint-disable-next-line no-use-before-define
  await loadEager(doc);
  // eslint-disable-next-line no-use-before-define
  await loadLazy(doc);
  // eslint-disable-next-line no-use-before-define
  loadDelayed(doc);
}

export function initHlx(forceMultiple = false) {
  if (!window.hlx || forceMultiple) {
    window.hlx = window.hlx || {};
    window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';
    window.hlx.codeBasePath = '';
    window.hlx.serverPath = '';

    const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
    if (scriptEl) {
      try {
        [window.hlx.codeBasePath] = new URL(scriptEl.src).pathname.split('/scripts/scripts.js');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }
  }
}

initHlx();

/*
 * ------------------------------------------------------------
 * Edit above at your own risk
 * ------------------------------------------------------------
 */

const LCP_BLOCKS = ['hero', 'featured-articles']; // add your LCP blocks to the list
const RUM_GENERATION = 'project-1'; // add your RUM generation information here

sampleRUM('top');

window.addEventListener('unhandledrejection', (event) => {
  sampleRUM('error', { source: event.reason.sourceURL, target: event.reason.line });
});

window.addEventListener('error', (event) => {
  sampleRUM('error', { source: event.filename, target: event.lineno });
});

window.addEventListener('load', () => sampleRUM('load'));

document.addEventListener('click', (event) => {
  sampleRUM('click', {
    target: sampleRUM.targetselector(event.target),
    source: sampleRUM.sourceselector(event.target),
  });
});

if (!window.hlx.suppressLoadPage) loadPage(document);

export function formatDate(dateString) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const [year, month, day] = dateString.split('-').map((n) => +n);
  return `${months[month - 1]} ${day}, ${year}`;
}

export function decorateButtons(block = document) {
  const noButtonBlocks = [];
  block.querySelectorAll(':scope a').forEach(($a) => {
    $a.title = $a.title || $a.textContent.trim();
    const $block = $a.closest('div.section > div > div');
    let blockName;
    if ($block) {
      blockName = $block.className;
    }
    if (!noButtonBlocks.includes(blockName) && $a.href !== $a.textContent) {
      const $up = $a.parentElement;
      const $twoup = $a.parentElement.parentElement;
      if (!$a.querySelector('img')) {
        if ($up.childNodes.length === 1 && ($up.tagName === 'P' || $up.tagName === 'DIV')) {
          $a.className = 'button accent'; // default
          $up.classList.add('button-container');
        }
        if (
          $up.childNodes.length === 1 &&
          $up.tagName === 'STRONG' &&
          $twoup.childNodes.length === 1 &&
          $twoup.tagName === 'P'
        ) {
          $a.className = 'button accent';
          $twoup.classList.add('button-container');
        }
        if (
          $up.childNodes.length === 1 &&
          $up.tagName === 'EM' &&
          $twoup.childNodes.length === 1 &&
          $twoup.tagName === 'P'
        ) {
          $a.className = 'button accent light';
          $twoup.classList.add('button-container');
        }
      }
    }
  });
}

export function toCategory(category) {
  let categoryName = toClassName(category);
  while (categoryName.includes('--')) categoryName = categoryName.replace('--', '-');
  return categoryName;
}

function setCategory() {
  let category = getMetadata('category');
  if (!category && window.location.pathname.includes('/category/')) {
    // eslint-disable-next-line prefer-destructuring
    category = window.location.pathname.split('/category/')[1];
  }

  const categoryName = toCategory(category);
  if (category) {
    document.body.classList.add(`category-${categoryName}`);
  }
}

/**
 * Build figcaption element
 * @param {Element} pEl The original element to be placed in figcaption.
 * @returns figCaptionEl Generated figcaption
 */

export function buildCaption(pEl) {
  const figCaptionEl = document.createElement('figcaption');
  pEl.classList.add('caption');
  figCaptionEl.append(pEl);
  return figCaptionEl;
}

/**
 * Build figure element
 * @param {Element} blockEl The original element to be placed in figure.
 * @returns figEl Generated figure
 */
export function buildFigure(blockEl) {
  const figEl = document.createElement('figure');
  figEl.classList.add('figure');
  // content is picture only, no caption or link
  if (blockEl?.firstElementChild) {
    if (
      blockEl.firstElementChild.nodeName === 'PICTURE' ||
      blockEl.firstElementChild.nodeName === 'VIDEO'
    ) {
      figEl.append(blockEl.firstElementChild);
    } else if (blockEl.firstElementChild.nodeName === 'P') {
      const pEls = Array.from(blockEl.children);
      pEls.forEach((pEl) => {
        if (pEl.firstElementChild) {
          if (
            pEl.firstElementChild.nodeName === 'PICTURE' ||
            pEl.firstElementChild.nodeName === 'VIDEO'
          ) {
            figEl.append(pEl.firstElementChild);
          } else if (pEl.firstElementChild.nodeName === 'EM') {
            const figCapEl = buildCaption(pEl);
            figEl.append(figCapEl);
          } else if (pEl.firstElementChild.nodeName === 'A') {
            const picEl = figEl.querySelector('picture');
            if (picEl) {
              pEl.firstElementChild.textContent = '';
              pEl.firstElementChild.append(picEl);
            }
            figEl.prepend(pEl.firstElementChild);
          }
        }
      });
      // catch link-only figures (like embed blocks);
    } else if (blockEl.firstElementChild.nodeName === 'A') {
      figEl.append(blockEl.firstElementChild);
    }
  }
  return figEl;
}

export async function lookupPages(pathnames, collection) {
  const indexPaths = {
    blog: '/blog/fixtures/blog-query-index.json',
    integrations: '/integrations/query-index.json?sheet=listings',
    hrGlossary: '/resources/hr-glossary/query-index.json',
    hrvs: '/drafts/sclayton/resources/hr-vs/query-index.json',
  };
  const indexPath = indexPaths[collection];
  window.pageIndex = window.pageIndex || {};
  if (!window.pageIndex[collection]) {
    const resp = await fetch(indexPath);
    const json = await resp.json();
    const lookup = {};
    json.data.forEach((row) => {
      lookup[row.path] = row;
    });
    window.pageIndex[collection] = { data: json.data, lookup };
  }

  /* guard for legacy URLs */
  pathnames.forEach((path, i) => {
    if (path.endsWith('/')) pathnames[i] = path.substr(0, path.length - 1);
  });
  const { lookup } = window.pageIndex[collection];
  const result = pathnames.map((path) => lookup[path]).filter((e) => e);
  return result;
}

export function loadHeader(header) {
  const queryParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const headerblockName = queryParams.header === 'meganav' ? 'meganav' : 'header';

  const headerBlock = buildBlock(headerblockName, '');
  header.append(headerBlock);
  decorateBlock(headerBlock);
  loadBlock(headerBlock);
}

function loadFooter(footer) {
  const queryParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const footerBlockName = queryParams.header ? 'megafooter' : 'footer';

  const footerBlock = buildBlock(footerBlockName, '');
  footer.append(footerBlock);
  decorateBlock(footerBlock);
  loadBlock(footerBlock);
}

function buildPageHeader(main, type) {
  const section = document.createElement('div');
  let content = [];
  if (type === 'resources-guides') {
    const picture = document.querySelector('h1 + h5 + p > picture');
    const h1 = document.querySelector('h1');
    const h5 = h1.nextElementSibling?.tagName === 'H5' ? h1.nextElementSibling : null;
    content = [[picture], [h1], [h5]].filter((e) => e[0]);
  }
  const header = buildBlock('page-header', content);
  header.setAttribute('data-header-location', toClassName(type));
  section.append(header);
  main.prepend(section);
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
// eslint-disable-next-line no-unused-vars
async function buildAutoBlocks(main) {
  try {
    let template = toClassName(getMetadata('template'));
    if (window.location.pathname.startsWith('/blog/') && !template) template = 'blog';
    const templates = ['blog', 'integrations-listing'];
    if (templates.includes(template)) {
      const mod = await import(`./${template}.js`);
      if (mod.default) {
        await mod.default(main);
      }
    }

    if (
      template === 'hr-glossary' ||
      template === 'job-description' ||
      template === 'resources-guides' ||
      template === 'performance-reviews'
    ) {
      buildPageHeader(main, template);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function linkImages(main) {
  main.querySelectorAll(':scope > div > p > picture').forEach((picture) => {
    const p = picture.parentElement;
    const a = p.querySelector('a');
    if (a && a.textContent.includes('://')) {
      a.textContent = '';
      a.append(picture);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export async function decorateMain(main) {
  linkImages(main);

  await buildAutoBlocks(main);
  setCategory();
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  window.setTimeout(() => sampleRUM.observe(main.querySelectorAll('picture > img')), 1000);
}

/**
 * loads everything related to Marketing technology that must be loaded eagerly
 * (e.g., Adobe Target).
 */
async function loadMartech() {
  /* Adobe Target Prehiding Snippet */
  /*
  ;(function(win, doc, style, timeout) {
    const STYLE_ID = 'at-body-style';
    function getParent() {
      return doc.getElementsByTagName('head')[0];
    }
    function addStyle(parent, id, def) {
      if (!parent) {
        return;
      }
      const style = doc.createElement('style');
      style.id = id;
      style.innerHTML = def;
      parent.appendChild(style);
    }
    function removeStyle(parent, id) {
      if (!parent) {
        return;
      }
      const style = doc.getElementById(id);
      if (!style) {
        return;
      }
      parent.removeChild(style);
    }
    addStyle(getParent(), STYLE_ID, style);
    setTimeout(function() {
      removeStyle(getParent(), STYLE_ID);
    }, timeout);
  }(window, document, "body {opacity: 0 !important}", 3000));
  */
  /* Move Adobe Tags here from delayed.js if Adobe Target is added and enabled */
}

/**
 * loads everything needed to get to LCP.
 */
async function loadEager(doc) {
  if (!window.hlx.lighthouse) loadMartech();

  decorateTemplateAndTheme();
  document.documentElement.lang = 'en';
  const main = doc.querySelector('main');
  if (main) {
    await decorateMain(main);
    await waitForLCP();
  }
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy(doc) {
  const header = doc.querySelector('header');
  const queryParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  if (queryParams.header === 'meganav') header.classList.add('header-meganav');
  const main = doc.querySelector('main');
  loadTemplateCSS();
  await loadBlocks(main);
  decorateIcons(main);

  const { hash } = window.location;
  const element = hash ? main.querySelector(hash) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(header);
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon('https://www.bamboohr.com/favicon.ico');
}

/**
 * loads everything that happens a lot later, without impacting
 * the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  if (!window.hlx.performance) window.setTimeout(() => import('./delayed.js'), 4000);
  // load anything that can be postponed to the latest here
}

export async function loadFragment(path) {
  const resp = await fetch(`${path}.plain.html`);
  const main = document.createElement('main');
  if (resp.ok) {
    main.innerHTML = await resp.text();
    await decorateMain(main);
    await loadBlocks(main);
  }
  return main;
}

export function lockBody() {
  const bs = document.body.style;
  bs.position = 'fixed';
  bs.top = `-${window.scrollY}px`;
  bs.left = 0;
  bs.right = 0;
}

export function unlockBody() {
  const bs = document.body.style;
  const scrollY = bs.top;
  bs.position = '';
  bs.top = '';
  bs.left = '';
  bs.right = '';
  window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
}

export function newsletterSubscribe(email) {
  const action = 'https://www.bamboohr.com/ajax/blog-newsletter-form.php';
  const body = `email=${encodeURIComponent(email)}`;
  fetch(action, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body,
  });
}

export function insertNewsletterForm(elem, submitCallback) {
  const action = 'https://www.bamboohr.com/ajax/blog-newsletter-form.php';
  const relative = new URL(action).pathname;
  elem.querySelectorAll(`a[href="${action}"], a[href="${relative}"]`).forEach((a) => {
    const formDiv = document.createElement('div');
    formDiv.innerHTML = `
    <form class="nav-form" __bizdiag="96619420" __biza="WJ__">
      <input type="email" name="email" placeholder="Email Address" aria-label="email" autocomplete="off">
      <button class="">${a.textContent}</button>
    </form>
    `;
    const button = formDiv.querySelector('button');
    const input = formDiv.querySelector('input');
    button.addEventListener('click', (e) => {
      newsletterSubscribe(input.value);
      e.preventDefault();
      submitCallback();
    });
    a.replaceWith(formDiv);
  });
}

/**
 * Return whether or not this element has a class that starts with the given string
 * @param {HtmlElement} elem
 * @param {string} classNameStart
 * @returns {boolean}
 */
export function hasClassStartsWith(elem, classNameStart) {
  const classNames = [...elem.classList];
  let isClassStartsWith = false;

  classNames.forEach((className) => {
    if (className.startsWith(classNameStart)) {
      isClassStartsWith = true;
    }
  });

  return isClassStartsWith;
}

/**
 * Gets array of parameterized values given a class that starts with a name
 * @param {string} className
 * @param {string} classNameStart
 * @return {string[]} Array of remaining items split on the hyphen (-)
 */
export function getValuesFromClassName(className, classNameStart) {
  const params = className.substring(classNameStart.length);

  return params.split('-');
}

/**
 * Creates an element with optional class and type
 * @param {string} elemType type of element to create
 * @param {...string} [cssClass] CSS class(es) to apply to element
 * @returns {Element}
 */
export function createElem(elemType, ...cssClass) {
  const elem = document.createElement(elemType);
  if (cssClass != null && cssClass.length) {
    elem.classList.add(cssClass);
  }

  return elem;
}

/**
 * Add class to a block's parent.
 * @param {Element} block The block element
 */
export function addClassToParent(block) {
  const classes = [
    'full-width',
    'med-width',
    'normal-width',
    'small-width',
    'medium-width',
    'extra-wide',
    'extra-small-width',
    'top-section-top-margin',
    'bottom-margin',
    'top-margin'
  ];
  classes.some((c) => {
    const found = block.classList.contains(c);
    if (found) {
      block.parentElement.classList.add(c);
      block.classList.remove(c);
    }
    return found;
  });
}

const params = new URLSearchParams(window.location.search);
if (params.get('performance')) {
  window.hlx.performance = true;
  import('./performance.js').then((mod) => {
    if (mod.default) mod.default();
  });
}