/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

const createMetadata = (main, document, url) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.innerHTML.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const img = document.querySelector('[property="og:image"]');
  if (img && img.content) {
    const el = document.createElement('img');
    el.src = img.content;
    meta.Image = el;
  }

  meta.Template = 'Landing Page';
  
  const s = url.split('/');
  if (s.length > 4) {
    // eslint-disable-next-line prefer-destructuring
    meta.Category = s[4];
  }

  // partner
  const partners = [...document.querySelectorAll('.AssetTopLogo')];
  if (partners.length > 1) {
    meta.Partner = partners.slice(1).map((p) => {
      if (p.alt) {
        return p.alt.replace('Partner', '').replace('logo', '').trim();
      }
      return null;
    }).filter(p => p).join(', ');
  }

  const author = document.querySelector('.academyCourseAuthor__name');
  if (author) {
    meta.Author = author.textContent;
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};


const cleanupHeadings = (main) => {
  main.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    // eslint-disable-next-line no-param-reassign
    h.innerHTML = h.textContent;
  });
};

const makeAbsoluteLinks = (main) => {
  main.querySelectorAll('a').forEach((a) => {
    if (a.href.startsWith('/')) {
      const ori = a.href;
      const u = new URL(a.href, 'https://www.bamboohr.com/');
      a.href = u.toString();

      if (a.textContent === ori) {
        a.textContent = a.href;
      }
    }
  });
};

const makeProxySrcs = (main) => {
  main.querySelectorAll('img').forEach((img) => {
    if (img.src.startsWith('/')) {
      img.src = `http://localhost:3001${img.src}?host=https://www.bamboohr.com`;
    } else {
      try {
        const u = new URL(img.src);
        u.searchParams.append('host', u.origin);
        img.src = `http://localhost:3001${u.pathname}${u.search}`;
      } catch (error) {
        console.warn(`Unable to make proxy src for ${img.src}: ${error.message}`);
      }
    }
  });
};

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @returns {HTMLElement} The root element
   */
  transformDOM: ({ document, params }) => {
    WebImporter.DOMUtils.remove(document, [
      'header',
      'NavbarMobile',
      'script',
      'noscript',
      '.Footer',
    ]);

    const main = document.querySelector('.topSection') || document.querySelector('.academyCourseMain');

    cleanupHeadings(main, document);

    createMetadata(main, document, params.originalURL);
    makeAbsoluteLinks(main);
    makeProxySrcs(main);

    WebImporter.DOMUtils.remove(document, [
      '.Modal__overlay',
      '.AssetTopButton--modal',
      '.AssetTopList',
    ]);

    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {String} url The url of the document being transformed.
   * @param {HTMLDocument} document The document
   */
  // eslint-disable-next-line arrow-body-style
  generateDocumentPath: ({ url }) => {
    return new URL(url).pathname.replace(/\/$/, '');
  },
};
