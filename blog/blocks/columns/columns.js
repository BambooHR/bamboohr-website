import { hasClassStartsWith, getValuesFromClassName, loadCSS } from '../../scripts/scripts.js';
import decorateWistia from '../wistia/wistia.js';

function addIconBtnClass(buttonContainer, icon) {
  const iconClass = [...icon.classList].find(c => c.startsWith('icon-'));
  const iconName = iconClass.substring(5);
  buttonContainer.classList.add(`btn-${iconName}`);
}

function addLinkToIconSVG(icon, link) {
  // Clone the link: 
  if (link?.tagName === 'A') {
    const imageLink = link.cloneNode(true);
    imageLink.innerText = '';
    imageLink.classList.add('column-svg-link');
    if (icon.firstElementChild) imageLink.append(icon.firstElementChild);
    icon.append(imageLink);
  } 
}

function addIconContainer(col) {
  if (!col.classList.contains('columns-title-span')) {
    const icons = col.querySelectorAll('span.icon');
    if (icons.length) {
      const iconContainer = document.createElement('div');
      iconContainer.classList.add('column-small-icons-container', 'column-multi-element');

      icons.forEach(icon => {
        let link = icon.parentElement.querySelector('a');
        if (link) {
          const buttonContainer = document.createElement('p');
          buttonContainer.classList.add('button-container');
          buttonContainer.append(link);
          icon.parentElement.append(buttonContainer);

          addLinkToIconSVG(icon, link);
          addIconBtnClass(buttonContainer, icon);
        } else if (icon.parentElement.nextElementSibling?.tagName === 'P'
            && icon.parentElement.nextElementSibling.classList.contains('button-container')) {
          link = icon.parentElement.nextElementSibling.firstElementChild;
          if (link?.tagName === 'A') link.classList.remove('button', 'accent', 'small');
          addLinkToIconSVG(icon, link);
          addIconBtnClass(icon.parentElement.nextElementSibling, icon);
          icon.parentElement.append(icon.parentElement.nextElementSibling);
        }

        if (link) iconContainer.append(icon.parentElement);
      });

      if (iconContainer.children) col.appendChild(iconContainer);
    }
  }
}

function addWistia(col, loadWistiaCSS) {
  const wistiaBlock = document.createElement('div');
  wistiaBlock.classList.add('wistia', 'block');

  const colChildren = [...col.children];
  let addAllChildren = false;
  if (colChildren.length == 2 &&
      colChildren[0].firstElementChild.tagName === 'PICTURE' &&
      colChildren[1].firstElementChild.tagName === 'A') {
    addAllChildren = true;
  }

  colChildren?.forEach((child) => {
    if (addAllChildren || child.querySelector('a')?.href?.includes('wistia')) {
      if (!addAllChildren) col.insertBefore(wistiaBlock, child);
      wistiaBlock.append(child);
    }
  });

  if (addAllChildren) col.append(wistiaBlock);
  decorateWistia(wistiaBlock);

  if (loadWistiaCSS) {
    // load css
    const cssBase = `${window.hlx.serverPath}${window.hlx.codeBasePath}`;
    loadCSS(`${cssBase}/blocks/wistia/wistia.css`, null);
    loadWistiaCSS = false;
  }

  col.classList.add('img-col');
}

function buildSplit(splitVal) {
  const newCol = document.createElement('div');
  newCol.classList.add(`column${splitVal}`);
  return newCol;
}

function findSplitSubType(val) {
  let isSplitSubType = false;
  let splitVals = null;
  // Looking for sub types like: 8-4, 6-6, 3-9, 2-10, 2-5-3-2, or 4-8-4
  if (val?.length < 12 && val?.includes('-')) {
    splitVals = val.split('-');
    // Make sure all splitVals are 1-2 digit numbers
    isSplitSubType = splitVals.every((s) => s.match(/^\d{1,2}$/));
  }

  return isSplitSubType ? splitVals : null;
}

function setupColumns(cols, splitVals, block, needToLoadWistiaCSS) {
  const extraSplits = splitVals.length > 2 ? 1 : 0;
  const colParent = cols[0].parentElement;
  let loadWistiaCSS = needToLoadWistiaCSS;
  const colsToRemove = [];

  colParent.classList.add('column-flex-container');
  let hasImage = false;
  let hasWistia = false;
  cols.forEach((col, i) => {
    col.classList.add(`column${splitVals[i + extraSplits]}`);

    if (col.innerText.toLowerCase() === 'title span') {
      if (colParent.nextElementSibling) {
        const secondRowCols = [...colParent.nextElementSibling.children];
        setupColumns(secondRowCols, splitVals, block, loadWistiaCSS);
      }

      cols[1].classList.add('columns-title-span');
      colsToRemove.push(col);
    } else if (col.querySelector('a')?.href?.includes('wistia')) {
      addWistia(col, loadWistiaCSS);
      hasImage = true;
      hasWistia = true;
    } else if (col.querySelector('img')) {
      col.classList.add('img-col');
      hasImage = true;
    } else col.classList.add('non-img-col');
    const noLeftButtons = block.classList.contains('no-left-buttons');
    
    if (!noLeftButtons) {
      const isButtonLinks = block.classList.contains('button-style-link');
      const buttons = col.querySelectorAll('a.button');
      if (isButtonLinks) {
        buttons.forEach((button) => {
          button.classList.add('link');
          button.parentElement.classList.add('left');
        });
      } else {
        buttons.forEach((button) => {
          button.classList.add('small');
          button.parentElement.classList.add('left');
        });
      }
    }

    addIconContainer(col);
  });

  colsToRemove.forEach((col) => col.remove());

  if (hasWistia || !hasImage) colParent.classList.add('columns-align-start');

  if (extraSplits) {
    // Add extra column splits for cases like: 2/5/3/2 or 4/8/4
    if (splitVals[0] !== '0') colParent.insertBefore(buildSplit(splitVals[0]), cols[0]);
    if (splitVals[3] && splitVals[3] !== '0') colParent.appendChild(buildSplit(splitVals[3]));
  }
}

export default function decorate(block) {
  const zIndex1 = 'z-index-1';
  if (block.classList.contains(zIndex1)) {
    block.parentElement.classList.add(zIndex1);
    block.classList.remove(zIndex1);
  }
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  if (block.classList.contains('small-icons')) {
    cols[0].parentElement.classList.add('column-small-icons-container');
    cols.forEach((col) => col.classList.add(`icon-${cols.length}-cols`));
  } else if (block.classList.contains('cards')) {
    const cardsContainer = cols[0].parentElement;
    cardsContainer.classList.add('column-cards-container');
    cols.forEach((col) => {
      col.classList.add('cards-col');
      const cardWrapper = document.createElement('div');
      cardWrapper.classList.add('col-cards-wrapper');
      col.parentElement.appendChild(cardWrapper);
      cardWrapper.appendChild(col);
      const cardBorder = document.createElement('div');
      cardBorder.classList.add('cards-border');
      cardWrapper.appendChild(cardBorder);
    });
  } else if (block.classList.contains('step')) {
    const rows = [...block.children];
    rows.forEach((row) => {
      row.classList.add('step-wrap');
      [...row.children].forEach((col, index) => {
        if (index % 2 === 0) {
          col.classList.add('step-left');
        } else {
          col.classList.add('step-right');
        }
      });
    });
  } else if (cols.length === 2) {
    let splitVals = null;
    [...block.classList].some((c) => {
      splitVals = findSplitSubType(c);
      return splitVals;
    });

    if (splitVals) {
      setupColumns(cols, splitVals, block, true);
    }
  } else if (cols.length === 1) {
    if (block.classList.contains('button-style-link')) {
      const buttons = block.querySelectorAll('a.button');
      buttons.forEach((button) => {
        button.classList.add('link');
        button.parentElement.classList.add('left');
      });
    }
  }

  if (hasClassStartsWith(block, 'margin-')) {
    let colToUse = null;
    const classNames = [...block.classList];

    classNames.forEach((className) => {
      // Handle margins on images
      if (className.startsWith('margin-') && !className.startsWith('margin-on-col')) {
        const marginParams = getValuesFromClassName(className, 'margin-');
        let sideParamIdx = 0;
        let columnParamIdx = 2;

        let marginValue = 0;

        if (marginParams[0] === 'negative') {
          sideParamIdx = 1;
          columnParamIdx = 3;

          if (marginParams.length > 2) {
            marginValue = marginParams[2] * -1;
          }
        } else if (marginParams.length > 1) {
          [, marginValue] = marginParams;
        }

        // If the class includes an `on` param, then we can specify which column to target
        if (marginParams[columnParamIdx] != null && marginParams[columnParamIdx] === 'on') {
          const columnIdx = parseInt(marginParams[columnParamIdx + 1], 10) - 1;
          colToUse = cols[columnIdx];
        } else colToUse = cols.find((col) => col.querySelector('img'));

        if (colToUse) {
          if (marginParams[sideParamIdx] === 'top') {
            colToUse.style.marginTop = `${marginValue}px`;
          } else if (marginParams[sideParamIdx] === 'bottom') {
            colToUse.style.marginBottom = `${marginValue}px`;
          } else if (marginParams[sideParamIdx] === 'right') {
            colToUse.style.marginRight = `${marginValue}px`;
          } else if (marginParams[sideParamIdx] === 'left') {
            colToUse.style.marginLeft = `${marginValue}px`;
          }
        }
      }
    });
  }
}
