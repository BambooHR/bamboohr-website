import {
  decorateIcons,
  getMetadata,
  createElem,
} from '../../scripts/scripts.js';

const FOOTER_LOCATION = '/drafts/hoodoo/footer';

function buildAppButtons(ref) {
  const appButtonElems = ref.querySelectorAll('div:last-child p:nth-of-type(n+2)');

  const containerElem = createElem('div', 'footer-app-buttons');

  appButtonElems.forEach((appButtonElem) => {
    const appAnchorElem = appButtonElem.querySelector('a');
    containerElem.append(appAnchorElem);
    appButtonElem.remove();
  });

  return containerElem;
}

/**
 * decorates the footer
 * @param {Element} block  The footer block element
 */
export default async function decorate(block) {
  block.textContent = '';

  // fetch nav content
  const footerPath = getMetadata('footer') || FOOTER_LOCATION;

  const resp = await fetch(`${footerPath}.plain.html`);
  let html = await resp.text();

  // forward compatibility
  html = html.replaceAll('<ol>', '<ul>');
  html = html.replaceAll('</ol>', '</ul>');

  const ref = createElem('div');

  ref.innerHTML = html;

  const footerRootElem = createElem('div');
  footerRootElem.classList.add('footer-root');

  const navInnerElem = ref.querySelector(':scope > div:nth-child(1)');
  const mouseInnerElem = ref.querySelector(':scope > div:nth-child(2)');

  const socialLinksElem = navInnerElem.querySelector('div:last-child ul:nth-of-type(2)');
  socialLinksElem.classList.add('footer-social-links');
  socialLinksElem.remove();

  const appButtonContainerElem = buildAppButtons(navInnerElem);

  const socialAppsContainerElem = createElem('div', 'footer-social-apps-container');

  socialAppsContainerElem.append(socialLinksElem, appButtonContainerElem);

  // Can't find a good way to get things into the layout between mobile and desktop without copying.
  const mobileSocialAppsContainerElem = socialAppsContainerElem.cloneNode(true);

  socialAppsContainerElem.classList.add('footer-exclude-mobile');

  mobileSocialAppsContainerElem.classList.add('footer-mobile-only');

  navInnerElem.querySelector('.footer-columns > div > div:last-child')?.append(socialAppsContainerElem);

  navInnerElem.querySelector('.footer-columns')?.after(mobileSocialAppsContainerElem);

  navInnerElem.classList.add('footer-navigation-inner');
  navInnerElem.remove();

  mouseInnerElem.classList.add('footer-mouse-inner');
  mouseInnerElem.remove();

  // wrap the element so we can apply some full width styles
  const navElem = createElem('div', 'footer-navigation');
  navElem.appendChild(navInnerElem);
  ref.append(navElem);

  const mouseElem = createElem('div', 'footer-mouse');
  mouseElem.append(mouseInnerElem);
  ref.append(mouseElem);

  footerRootElem.innerHTML = ref.innerHTML;

  decorateIcons(footerRootElem);

  block.append(footerRootElem);
}
