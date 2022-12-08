import { createElem } from '../../scripts/scripts.js';

function decorateIconBackground() {
  const iconBackground = createElem('span', 'icon-background');
  fetch(`${window.hlx.serverPath}${window.hlx.codeBasePath}/icons/bg-hex-dual.svg`).then((resp) => {
    if (resp.status === 200) resp.text().then((svg) => { iconBackground.innerHTML = svg; });
  });

  return iconBackground;
}

export default function decorate(block) {
  const cards = block.querySelectorAll(':scope > div');
  let topImageFull = false;

  if (block.classList.contains('image-top-full')) topImageFull = true;

  // convert "number" classes
  [...block.classList].forEach((name) => {
    if (!Number.isNaN(+name.split('').at(0))) {
      block.classList.remove(name);
      block.classList.add(`style-${name}`);
    }
  });

  // empty block
  block.textContent = '';
  cards.forEach((card) => {
    const contents = card.querySelectorAll(':scope > div');
    const icon = card.querySelector('span.icon');

    // loop children
    card.textContent = '';
    contents.forEach((content) => {
      const alignment = content.dataset.align;

      // set alignment
      if (alignment) card.dataset.align = alignment;

      // pull everything into one div or two (if top image is full)
      let textDiv = null;
      [...content.children].forEach((element) => {
        if (topImageFull) {
          // Picture element is separate so it can be full width
          if (element?.firstElementChild?.tagName.toLowerCase() === 'picture') card.append(element);
          else {
            // Everything else goes in it's own div
            if (!textDiv) {
              textDiv = document.createElement('div');
              textDiv.classList.add('has-text-only');
              card.append(textDiv);
            }
            textDiv.append(element);
          }
        } else card.append(element);
      });
    });

    const image = card.querySelector('picture');
    const title = card.querySelector('h4');

    let iconContainer = createElem('span', 'icon-container');

    if (block.classList.contains('hex-background-dual-tone')) {
      iconContainer.append(decorateIconBackground());
      iconContainer.append(icon);
    } else {
      iconContainer = icon;
    }

    // move icon out of p
    if (icon) card.prepend(iconContainer);

    // clear out empties
    card.querySelectorAll(':scope > p:empty').forEach((empty) => empty.remove());

    // add image classes
    if (image) {
      card.classList.add('has-image');
      if (topImageFull) card.classList.add('full');
      image.classList.add('image');
    }

    // add title class
    if (title) title.classList.add('title');

    // add card to block
    card.classList.add('card');
    block.append(card);
  });
}
