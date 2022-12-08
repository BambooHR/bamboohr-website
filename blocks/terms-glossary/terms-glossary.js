import {
    lookupPages,
    readBlockConfig,
  } from '../../scripts/scripts.js';

import { sortOptions } from '../app-cards/app-cards.js';
  
  export async function filterTerms(config, block) {
  
    await lookupPages([], 'hrGlossary');
    const index = window.pageIndex.hrGlossary;
    const sortBy = 'term';
    if (sortBy && sortOptions(sortBy)) index.data.sort(sortOptions(sortBy));
    const glossaryTermContainer = document.createElement('div');
    glossaryTermContainer.className = 'glossary-term-container';
    block.append(glossaryTermContainer);

    index.data.forEach((glossaryItem) => {
      if (glossaryItem.term != '') {
        const term = glossaryItem.term;
        const glossaryLetter = term.charAt(0);
        if (glossaryLetter >= '0' && glossaryLetter <= '9') {
          glossaryItem.groupLetter = '#';
        } else {
          glossaryItem.groupLetter = glossaryLetter;
        }
      }
    });

    const groupBy = (array, key) => {
      return array.reduce((result, currentValue) => {
        (result[currentValue[key]] = result[currentValue[key]] || []).push(
          currentValue
        );
        return result;
      }, {});
    };

    const glossaryGroupedByLetter = groupBy(index.data, 'groupLetter');
    
    const glossaryGroups = Object.entries(glossaryGroupedByLetter);

    glossaryGroups.forEach((glossaryGroup) => {
      if (glossaryGroup[0] != 'undefined') {
        const glossaryGroupContainer = document.createElement('div');
        glossaryGroupContainer.className = 'glossary-group-container';
        glossaryTermContainer.append(glossaryGroupContainer);
        const glossaryGroupLetter = document.createElement('div');
        glossaryGroupLetter.className = 'glossary-group-letter typ-title1';
        glossaryGroupContainer.append(glossaryGroupLetter);
        glossaryGroupLetter.textContent = glossaryGroup[0];
        glossaryGroupLetter.id = glossaryGroup[0];

        glossaryGroup[1].forEach((glossaryGroupItem) => {
          const glossaryLink = document.createElement('a');
          glossaryLink.textContent = glossaryGroupItem.term;
          glossaryLink.href = glossaryGroupItem.path;
          glossaryLink.className = 'glossary-link';
          glossaryGroupContainer.append(glossaryLink);
        });
      }
    });
  }
  
  export default async function decorate(block) {
    const config = readBlockConfig(block);
    filterTerms(config, block);
    block.innerHTML = '';
  }
  