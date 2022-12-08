import { toClassName } from '../../scripts/scripts.js';

function buildTableCell(col, rowIndex, header, isComparisonTable, isRowHeader) {
  const levels = ['pro', 'elite', 'bamboohr-product'];
  const cell = rowIndex > 0 && !isRowHeader ? document.createElement('td') : document.createElement('th');
  if (isComparisonTable && rowIndex === 3) {
    const levelClass = toClassName(col.textContent?.trim().toLowerCase());
    const levelIdx = levels.indexOf(levelClass);
    if (levelIdx >= 0) {
      cell.innerHTML = `<img src="/icons/${levelClass}-badge.svg">`;
      if (levelIdx < 2) header?.classList.add(`${levelClass}-ribbon`);
    } else cell.innerHTML = col.innerHTML;
  } else cell.innerHTML = col.innerHTML;

  return cell;
}

const handleCloseTooltip = (e) => {
  if (document.body.classList.contains('table-tooltip-is-showing')) {
    if (e.target.tagName !== 'TD') {
      const showedTooltipElems = document.querySelectorAll('.table-tooltip-show');

      showedTooltipElems.forEach((showedTooltipElem) => {
        showedTooltipElem.classList.remove('table-tooltip-show');
      });

      document.body.classList.remove('table-tooltip-is-showing');
      document.body.removeEventListener('click', handleCloseTooltip, { capture: true });
    }
  }
};

const handleTdClick = (evt) => {
  if (evt.target.tagName !== 'TD' || !evt.target.classList.contains('has-popup-data')) return;

  document.body.classList.add('table-tooltip-is-showing');
  const popupDataElems = document.querySelectorAll('td.has-popup-data');
  const isShowed = evt.target.classList.contains('table-tooltip-show');
  popupDataElems.forEach((e) => e.classList.remove('table-tooltip-show'));

  if (!isShowed) {
    evt.target.classList.add('table-tooltip-show');
    document.body.addEventListener('click', handleCloseTooltip, { capture: true });
  }
};

function addPopupDataToFirstCol(popupData, firstCol) {
  const tooltipContainerElem = document.createElement('div');
  tooltipContainerElem.classList.add('table-tooltip-container');
  tooltipContainerElem.innerHTML = popupData.innerHTML;
  popupData.innerHTML = '';

  if (!tooltipContainerElem.querySelector('h3')) {
    // Add H3 if not there.
    const popupHeader = document.createElement('h3');
    popupHeader.textContent = firstCol.textContent;
    tooltipContainerElem.prepend(popupHeader);
  }

  firstCol.append(tooltipContainerElem);
  firstCol.classList.add('has-popup-data');
  // Remove button style from links in the tooltip
  tooltipContainerElem.querySelectorAll('a').forEach((a) => {
    if (a.classList.contains('button')) a.classList.remove('button');
  });
}

function buildMobileTables(block, tableData, colCnt, isComparisonTable) {
  const mobileTableContainer = document.createElement('div');
  mobileTableContainer.className = 'table-mobile-container';
  block.append(mobileTableContainer);
  const tables = [];

  // Create a two column table for each col outside the first.
  // Each table includes col 0 (comparison labels) + a data column
  for (let i = 0; i < colCnt - 1; i += 1) {
    tables.push({
      table: document.createElement('table'),
      head: document.createElement('thead'),
      body: document.createElement('tbody'),
      currentRow: null,
      header: null,
    });
    tables[i].table.classList.add('table-mobile');
  }

  // build rows
  tableData.forEach((row, i) => {
    // Create a new row in each table.
    tables.forEach((t) => {
      t.currentRow = document.createElement('tr');
    });
    // build cells
    row.querySelectorAll('div').forEach((col, j) => {
      const header = j > 0 ? tables[j - 1].header : null;
      const cell = buildTableCell(col, i, header, isComparisonTable);

      if (j === 0) {
        // Add col 0 (comparison labels) to every table
        tables.forEach((t, z) => t.currentRow.append(z > 0 ? cell.cloneNode(true) : cell));
      } else {
        // Save the header for markup later based on level found in row 3
        if (i === 0) tables[j - 1].header = cell;
        // Add data col to each table
        tables[j - 1].currentRow.append(cell);
      }
    });

    // Add each new row to its table
    tables.forEach((t) => {
      if (i > 0) t.body.append(t.currentRow);
      else t.head.append(t.currentRow);
      t.currentRow = null;
    });
  });

  // Add the tables to the mobleTableContainer.
  tables.forEach((t) => {
    // Populate each table.
    t.table.append(t.head, t.body);
    mobileTableContainer.append(t.table);
  });
}

export default async function decorate(block) {
  if (block.classList.contains('first')) {
    block.parentElement.classList.add('first');
  }
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const body = document.createElement('tbody');
  const headers = [];
  const tableData = block.querySelectorAll(':scope > div');
  let colCnt = -1;
  const isComparisonTable = block.classList.contains('comparison');
  const isDataSync = block.classList.contains('data-sync');
  const isXY = block.classList.contains('xy');
  const isStandardTable = !isComparisonTable && !isDataSync;
  let popupDataColIdx = -1;
  let addBlockClickHandler = true;
  const colWidths = [];

  [...block.classList].forEach((c) => {
    if (c.startsWith('width-col-')) {
      const splitVals = c.split('-');
      const [, , colNum] = splitVals;
      const [, , , colWidth] = splitVals;

      colWidths.push({ colNum, colWidth });
    }
  });

  // build rows
  tableData.forEach((row, i) => {
    const tr = document.createElement('tr');
    const colData = row.querySelectorAll('div');
    if (colCnt === -1) colCnt = colData.length;
    // build cells
    colData.forEach((col, j) => {
      if (i === 0 && col.innerText.toLowerCase() === 'popup data') popupDataColIdx = j;
      if (j === popupDataColIdx) {
        // Add popupData to first column.
        if (i > 0 && col.innerHTML) {
          addPopupDataToFirstCol(col, tr.firstElementChild);

          if (addBlockClickHandler) {
            // Only need to do this once
            block.addEventListener('click', handleTdClick);
            block.classList.add('allow-overflow');
            addBlockClickHandler = false;
          }
        }
      } else {
        const isRowHeader = isStandardTable && j === 0 && isXY;
        const cell = buildTableCell(col, i, headers[j], isComparisonTable, isRowHeader);
        if (i === 0) {
          headers.push(cell);
          if (colWidths.length) {
            const val = colWidths.find((v) => parseInt(v.colNum, 10) - 1 === j);
            if (val) {
              if (val.colWidth.endsWith('px')) cell.style.width = val.colWidth;
              else cell.style.width = `${val.colWidth}%`;
            }
          }
        }
        tr.append(cell);
      }
    });
    if (i > 0) body.append(tr);
    else head.append(tr);
  });
  // populate table
  table.append(head, body);
  block.innerHTML = table.outerHTML;

  if (isComparisonTable) {
    buildMobileTables(block, tableData, colCnt, isComparisonTable);
  }
}
