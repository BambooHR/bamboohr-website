import { createElem, loadCSS } from '../../scripts/scripts.js';
import decorateCarousel from '../carousel/carousel.js';

const MIN_BREAKPOINTS = {
  'tablet': '600px',
  'laptop': '1025px',
  'desktop': '1800px',
}

const IMAGE_WIDTHS = {
  'tablet': '1024',
  'laptop': '1440',
  'desktop': '2000',
}

const IMAGE_OPTIMIZATION = 'medium';

// TODO: would probably be best to make this a global utility
export function buildPicture(images, minBreakpoints = MIN_BREAKPOINTS) {
  const pictureElem = document.createElement('picture');

  Object.keys(images).forEach((key) => {
    const sourceWebpElem = createElem('source');

    const srcsetPath = `${images[key]}?width=${IMAGE_WIDTHS[key]}&optimize=${IMAGE_OPTIMIZATION}`;

    // Since tablet is the smallest breakpoint in our case, we'll use it as default
    if (key === 'tablet') {
      const imgPngElem = createElem('img');
      imgPngElem.setAttribute('loading', 'lazy');
      imgPngElem.setAttribute('type', 'image/png');
      imgPngElem.setAttribute('alt', '');
      imgPngElem.setAttribute('srcset', `${srcsetPath}&format=png`);

      pictureElem.append(imgPngElem);
    } else {
      const sourcePngElem = createElem('source');

      sourceWebpElem.setAttribute('media', `(min-width: ${minBreakpoints[key]})`);
      sourcePngElem.setAttribute('media', `(min-width: ${minBreakpoints[key]})`);

      sourcePngElem.setAttribute('type', 'image/png');
      sourcePngElem.setAttribute('srcset', `${srcsetPath}&format=png`);

      pictureElem.prepend(sourcePngElem);
    }

    sourceWebpElem.setAttribute('type', 'image/webp');
    sourceWebpElem.setAttribute('srcset', `${srcsetPath}&format=webp`);
    pictureElem.prepend(sourceWebpElem);
  });

  return pictureElem;
}

function processBackground(block) {
  const parts = block.querySelectorAll(':scope > div');

  const images = {};
  parts.forEach((part) => {
    const partChildren = part.children;
    if (partChildren.length > 1) {
      const key = partChildren.item(0).innerText.toLowerCase();

      if (key.endsWith('image')) {
        const imageType = key.substring(0, key.indexOf(' '));
        const imagePathFull = partChildren.item(1).firstElementChild.firstElementChild.srcset;
        const imagePath = imagePathFull.substr(0, imagePathFull.indexOf('?'));

        images[imageType] = imagePath;

        part.remove();
      }
    }
  });

  if (Object.keys(images).length > 0) {
    const backgroundPictureElem = buildPicture(images);
    backgroundPictureElem.classList.add('multi-hero-background');

    const multiHeroSection = block.closest('.multi-hero-container');

    multiHeroSection.prepend(backgroundPictureElem);

    const mobileBackground = createElem('div', 'multi-hero-mobile-background');
    multiHeroSection.prepend(mobileBackground);
  }
}

function processCarousel(block) {
  const parts = block.querySelectorAll(':scope > div');

  // const carouselContainer = createElem('div', 'multi-hero-carousel');
  const carouselBlock = document.createElement('div');
  carouselBlock.classList.add('multi-hero', 'carousel', 'style-1', 'auto-play', 'block');

  parts.forEach((part) => {
    const partChildren = part.children;

    if (partChildren.length > 1) {
      const key = partChildren.item(0).innerText.toLowerCase();

      if (key === 'carousel') {
        // carouselContainer.append(partChildren.item(1));
        const div = document.createElement('div');
        div.append(partChildren.item(1));
        carouselBlock.append(div);
      }

      part.remove();
    }
  });

  block.append(carouselBlock);
  decorateCarousel(carouselBlock);

  // load css
  const cssBase = `${window.hlx.serverPath}${window.hlx.codeBasePath}`;
  loadCSS(`${cssBase}/blocks/carousel/carousel.css`, null);

  // block.append(carouselContainer);
}

export default function decorate(block) {
  processBackground(block);
  processCarousel(block);

  const mainContentContainer = block.firstElementChild;
  mainContentContainer.classList.add('multi-hero-main-container');
  const mainContent = mainContentContainer.firstElementChild;
  mainContent.classList.add('multi-hero-main-content');
  const heroCtas = mainContent.querySelectorAll('.button-container');
  if (heroCtas.length) {
    const heroCtasContainer = createElem('div', 'multi-hero-buttons');

    heroCtas.forEach((buttonContainer) => {
      heroCtasContainer.append(buttonContainer);
    });

    mainContent.append(heroCtasContainer);
  }
}
