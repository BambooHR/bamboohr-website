/* Core Web Vitals RUM collection */
/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// eslint-disable-next-line import/no-cycle
import { getMetadata, sampleRUM } from './scripts.js';
import { setObject } from './set-object.min.js';

sampleRUM('cwv');

/**
 * loads a script by adding a script tag to the head.
 * @param {string} where to load the js file ('header' or 'footer')
 * @param {string} url URL of the js file
 * @param {Function} callback callback on load
 * @param {string} type type attribute of script tag
 * @returns {Element} script element
 */
function loadScript(location, url, callback, type) {
  const $head = document.querySelector('head');
  const $body = document.querySelector('body');
  const $script = document.createElement('script');
  $script.src = url;
  if (type) {
    $script.setAttribute('type', type);
  }
  if (location === 'header') {
    $head.append($script);
  } else if (location === 'footer') {
    $body.append($script);
  }
  $script.onload = callback;
  return $script;
}

loadScript('footer', 'https://consent.trustarc.com/v2/notice/qvlbs6', null, 'text/javascript');

/**
 * Adobe Tags
 *
 * To set a Development Environment, from your browser's Developer Tools' Console run
 *   localStorage.setItem('Adobe Tags Development Environment', '#')
 * (where # is 1, 2, 3, 4, or 5) and reload the page.
 *
 * To remove the Development Environment, from your browser's Developer Tools' Console run
 *   localStorage.removeItem('Adobe Tags Development Environment')
 * and reload the page.
 */
let adobeTagsSrc = 'https://assets.adobedtm.com/ae3ff78e29a2/7f43f668d8a7/launch-';
const adobeTagsDevEnvNumber = (localStorage ? localStorage.getItem('Adobe Tags Development Environment') : undefined);
const adobeTagsDevEnvURLList = {
  1: 'f8d48fe68c86-development.min.js',
  2: 'c043b6e2b351-development.min.js',
  3: 'ede0a048d603-development.min.js',
  4: '7565e018a7a2-development.min.js',
  5: '30e70f4281a7-development.min.js'
};
const adobeTagsDevEnv = adobeTagsDevEnvURLList[adobeTagsDevEnvNumber];

if (adobeTagsDevEnv) {
  adobeTagsSrc += adobeTagsDevEnv;
} else {
  const isProdSite = /^(marketplace|partners|www)\.bamboohr\.com$/i.test(document.location.hostname);
  adobeTagsSrc += (isProdSite ? '58a206bf11f0.min.js' : '9e4820bf112c-staging.min.js');
}

loadScript('header', adobeTagsSrc, async () => {
  window.digitalData = {};
  window.digitalData.push = (obj) => {
    Object.assign(window.digitalData, window.digitalData, obj);
  };

  const resp = await fetch('/blog/instrumentation.json');
  const json = await resp.json();
  const digitalDataMap = json.digitaldata.data;
  digitalDataMap.forEach((mapping) => {
    const metaValue = getMetadata(mapping.metadata);
    if (metaValue) {
      setObject(window.digitalData, mapping.digitaldata, metaValue);
    }
  });

  /*
  const digitalDataLists = json['digitaldata-lists'].data;
  digitalDataLists.forEach((listEntry) => {
    const metaValue = getMetadata(listEntry.metadata);
    if (metaValue) {
      // eslint-disable-next-line no-underscore-dangle
      let listValue = digitaldata._get(listEntry.digitaldata) || '';
      const name = listEntry['list-item-name'];
      const metaValueArr = listEntry.delimiter
        ? metaValue.split(listEntry.delimiter)
        : [metaValue];
      metaValueArr.forEach((value) => {
        const escapedValue = value.split('|').join(); // well, well...
        listValue += `${listValue ? ' | ' : ''}${name}: ${escapedValue}`;
      });
      // eslint-disable-next-line no-underscore-dangle
      digitaldata._set(listEntry.digitaldata, listValue);
    }
  */

  window.digitalData.push({
    event: 'Page View',
    page: {
      country: 'us',
      language: 'en',
      platform: 'web',
      site: 'blog'
    }
  });
});

/* google tag manager */
// eslint-disable-next-line
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-ZLCX');
