import { getValuesFromClassName } from '../../scripts/scripts.js';

function createSpacer(spacerVal, block) {
  const spacerDiv = document.createElement('div');
  spacerDiv.style.height = `${spacerVal}px`;
  block.append(spacerDiv);
  return spacerDiv;
}

export default function decorate(block) {
  // Remove 'spacer' and 'block' classes
  const options = [...block.classList].filter((c) => c !== 'spacer' && c !== 'block');

  // The rest should be: mobile-XX, tablet-XX, laptop-XX, or desktop-XX OR a single number.
  // OR margin-[negative-]top/bottom-XX
  const marginVals = [];
  const values = {
    mobile: '', tablet: '', laptop: '', desktop: '',
  };
  let simpleVal = '';
  options.forEach((o) => {
    if (o.startsWith('margin-')) marginVals.push(o);
    else if (o.startsWith('id-')) {
      const id = o.slice(3);
      block.parentElement.setAttribute('id', id);
      block.classList.remove(o);
    } else {
      const val = o.split('-');
      if (val.length === 2) [, values[val[0]]] = val;
      else if (val.length === 1) [simpleVal] = val;
    }
  });

  if (simpleVal) {
    if (simpleVal !== '0') createSpacer(simpleVal, block);
  } else {
    const keys = Object.keys(values);

    // Count the input values. Remember last val in case there's only 1.
    const valueCnt = keys.reduce((cnt, key) => {
      simpleVal = values[key];
      return values[key] ? cnt + 1 : cnt;
    }, 0);

    if (valueCnt === 1) createSpacer(simpleVal, block);
    else {
      keys.forEach((key, i) => {
        // Create a spacer div for each size, fill in if any are absent.
        // valid sizes are: mobile, tablet, laptop, desktop.
        if (values[key]) {
          const spacerDiv = createSpacer(values[key], block);
          spacerDiv.classList.add(`${key}-spacer`);
        } else {
          // Fill in from next adjacent first, if not there fill in from previous adjacent.
          let nextKey = i + 1;
          while (nextKey < keys.length && !values[keys[nextKey]]) nextKey += 1;

          let fillInKey = -1;
          if (nextKey < keys.length) {
            fillInKey = nextKey;
          } else {
            let prevKey = i - 1;
            while (prevKey >= 0 && !values[keys[prevKey]]) prevKey -= 1;
            fillInKey = prevKey;
          }

          if (fillInKey >= 0) {
            const spacerDiv = createSpacer(values[keys[fillInKey]], block);
            spacerDiv.classList.add(`${key}-spacer`);
          }
        }
      });
    }
  }

  marginVals.forEach((mv) => {
    if (mv.startsWith('margin-')) {
      const marginParams = getValuesFromClassName(mv, 'margin-');
      let sideParamIdx = 0;
      let marginValue = 0;

      if (marginParams[0] === 'negative') {
        sideParamIdx = 1;

        if (marginParams.length > 2) {
          marginValue = marginParams[2] * -1;
        }
      } else if (marginParams.length > 1) {
        [, marginValue] = marginParams;
      }

      if (marginParams[sideParamIdx] === 'top') {
        block.style.marginTop = `${marginValue}px`;
      } else if (marginParams[sideParamIdx] === 'bottom') {
        block.style.marginBottom = `${marginValue}px`;
      }
    }
  });
}
