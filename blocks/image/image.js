import { buildFigure } from '../../scripts/scripts.js';
import { buildPicture } from '../multi-hero/multi-hero.js';

function buildColumns(rowEl, count) {
  const columnEls = Array.from(rowEl.children);
  columnEls.forEach((columnEl) => {
    const figEl = buildFigure(columnEl);
    columnEl.remove();
    rowEl.append(figEl);
  });
  rowEl.classList.add('image-list', `image-list-${count}`);
}

export default function decorateImage(block) {
  if ([...block.classList].some((c) => c.startsWith('bg-'))) {
    block.parentElement.classList.add('background-image');
  }
  const blockCount = block.firstChild.childElementCount;
  if (blockCount > 1) {
    buildColumns(block.firstChild, blockCount);
  } else if (block?.firstChild?.firstChild) {
    const figEl = buildFigure(block.firstChild.firstChild);
    block.innerHTML = '';
    block.append(figEl);
  } else if (block.classList.contains('has-breakpoint-images')) {
    const images = {};
    const imgSizes = ['tablet', 'laptop', 'desktop'];
    let imgsFoundCnt = 0;
    block.querySelectorAll('picture').forEach(pic => {
      const imagePathFull = pic.firstElementChild.srcset;
      const imagePath = imagePathFull.substr(0, imagePathFull.indexOf('?'));

      images[imgSizes[imgsFoundCnt]] = imagePath;
      imgsFoundCnt++;
    });

    if (imgsFoundCnt > 0) {
      block.firstElementChild.remove();

      const backgroundPictureElem = buildPicture(images);
      block.append(backgroundPictureElem);
    }
  }
}
