import { createElem } from '../../scripts/scripts.js';

const bodyElem = document.querySelector('body');
let loaded = false;

const loadModal = () => {
  // skip if loaded
  if (loaded) return;

  // get wistia script
  const scriptElem = createElem('script');
  scriptElem.setAttribute('async', '');
  scriptElem.setAttribute('src', '//fast.wistia.com/assets/external/E-v1.js');

  // create modal
  const wrapperElem = createElem('div', 'modal-wrapper');
  wrapperElem.classList.add('wistia-modal');
  const modalElem = createElem('div', 'modal');
  const closeElem = createElem('div', 'modal-close');
  const contentElem = createElem('div', 'modal-content');
  modalElem.append(closeElem, contentElem);
  wrapperElem.append(modalElem);

  bodyElem.append(wrapperElem, scriptElem);

  // this script is use for defining Wistia
  window.wistiaInitQueue = window.wistiaInitQueue || [];

  loaded = true;
};

const getOembed = (path) => {
  const oembed = new URL('/oembed', 'https://fast.wistia.com');
  const params = new URLSearchParams({
    autoPlay: 'true',
    embedType: 'async',
    url: path,
    videoWidth: '1000',
  });

  return fetch(`${oembed.toString()}?${params.toString()}`)
    .then((response) => response.json())
    .then((data) => data);
};

const handleCloseClick = (event) => {
  // no bubbles
  event.stopImmediatePropagation();

  // skip children clicks
  if (
    !event.target.classList.contains('modal-wrapper') &&
    !event.target.classList.contains('modal-close')
  ) {
    return;
  }

  const wrapperElem = event.target.closest('.modal-wrapper');

  // hide modal
  bodyElem.classList.remove('modal-open');
  wrapperElem.classList.remove('visible');

  // remove existing player
  wrapperElem.querySelector('.modal-content > div').remove();
};

const handleThumbClick = ({ target }) => {
  const wistiaElem = target.closest('.wistia');
  const { embedHeight, embedHtml, embedWidth } = wistiaElem.dataset;
  const wrapperElem = document.querySelector('.wistia-modal');
  const closeElem = wrapperElem.querySelector('.modal-close');
  const contentElem = wrapperElem.querySelector('.modal-content');

  // skip if no html
  if (!embedHtml) return;

  // attach events
  wrapperElem.addEventListener('click', handleCloseClick);
  closeElem.addEventListener('click', handleCloseClick);

  // inject embed
  contentElem.innerHTML = embedHtml;
  const embedElem = contentElem.querySelector(':scope > div');

  // set proportional height
  if (embedHeight > 0 && embedWidth > 0) {
    embedElem.setAttribute('style', `height: calc(var(--width) * ${embedHeight / embedWidth});`);
  }

  // show modal
  bodyElem.classList.add('modal-open');
  wrapperElem.classList.add('visible');
};

const loadWistia = async (block) => {
  if (block.classList.contains('is-loaded')) {
    return;
  }

  const url = block.querySelector('a')?.getAttribute('href') || null;
  let posterElem = block.querySelector('picture');

  // skip if no url
  if (!url) return;

  // create modal
  loadModal();

  // eslint-disable-next-line camelcase
  await getOembed(url).then(({ height, html, thumbnail_url, title, width }) => {
    // set data for modal
    block.dataset.embedHeight = height;
    block.dataset.embedHtml = html;
    block.dataset.embedWidth = width;

    // if no override, use from wistia
    if (!posterElem) {
      const imageElem = createElem('img');
      imageElem.setAttribute('alt', title);
      imageElem.setAttribute('src', thumbnail_url);

      posterElem = createElem('picture');
      posterElem.append(imageElem);
    }

    // attach event
    posterElem.addEventListener('click', handleThumbClick);
  });

  // empty and add elements
  block.innerText = '';
  block.append(posterElem);

  block.classList.add('is-loaded');
};

export default async function decorate(block) {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      loadWistia(block);
    }
  });
  observer.observe(block);
}
