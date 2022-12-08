import { readBlockConfig } from '../../scripts/scripts.js';

const loadScript = (url, callback, type) => {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  if (type) {
    script.setAttribute('type', type);
  }
  head.append(script);
  script.onload = callback;
  return script;
};

function createSelect(fd, multiSelect = false) {
  const select = document.createElement('select');
  if (multiSelect === true) {
    select.setAttribute('multiple', true);
  }
  select.id = fd.Field;
  if (fd.Mandatory === 'x') {
    select.setAttribute('required', '');
  }

  if (fd.Placeholder) {
    const ph = document.createElement('option');
    ph.textContent = fd.Placeholder;
    ph.setAttribute('selected', '');
    ph.setAttribute('disabled', '');
    ph.value = '';
    select.append(ph);
  }
  fd.Options.split('|').forEach((o) => {
    const option = document.createElement('option');
    option.textContent = o.trim();
    option.value = o.trim();
    select.append(option);
  });
  return select;
}

function getURLParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function createOptions(fd) {
  const options = document.createElement('div');
  const optionType = fd.Type;
  options.classList.add(`form-${optionType}-options`);
  fd.Options.split('|').forEach((o, k) => {
    const option = document.createElement('div');
    option.classList.add(`form-${optionType}-option`);
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = optionType;
    input.name = fd.Field;
    input.id = fd.Field;
    input.required = !!fd.Mandatory;
    label.setAttribute('for', fd.Field);
    if (fd.Options.split('|').length > 1) {
      input.id = fd.Field + k;
      label.setAttribute('for', fd.Field + k);
    }
    // set radio data to url params if exists
    const param = getURLParam(o.trim().toLowerCase());
    if (param) {
      label.textContent = param.trim();
      input.value = param.trim();
    } else {
      input.value = o.trim();
      if (fd.Extra && fd.Options.split('|').length === 1) {
        label.innerHTML = `<a href="${fd.Extra}">${o.trim()}</a>`;
      } else {
        label.textContent = o.trim();
      }
    }
    option.append(input, label);
    options.append(option);
  });
  return options;
}

function removeValidationError(el) {
  el.parentNode.classList.remove('error');
}

function addValidationError(el) {
  el.parentNode.classList.add('error');
}

function constructPayload(form) {
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (fe.type === 'checkbox') {
      if (fe.checked) payload[fe.id] = fe.value;
    } else if (fe.id) {
      payload[fe.id] = fe.value;
    }
  });
  return payload;
}

function sanitizeInput(input) {
  const output = input
    .replace(/<script[^>]*?>.*?<\/script>/gi, '')
    // eslint-disable-next-line no-useless-escape
    .replace(/<[\/\!]*?[^<>]*?>/gi, '')
    .replace(/<style[^>]*?>.*?<\/style>/gi, '')
    .replace(/<![\s\S]*?--[ \t\n\r]*>/gi, '')
    .replace(/&nbsp;/g, '');
  return output;
}

async function submitForm(form) {
  let isError = false;
  const payload = {};
  const formEl = [...form.elements];
  let checkboxGroup = [];
  payload.entryDate = new Date().toLocaleDateString();
  formEl.forEach((fe, k) => {
    removeValidationError(fe);
    if (!fe.closest('.hidden')) {
      if (fe.required && fe.value === '') {
        isError = true;
        addValidationError(fe);
      }
      if (fe.type === 'checkbox') {
        if (fe.required && !form.querySelector(`input[name="${fe.name}"]:checked`)) {
          isError = true;
          addValidationError(fe);
        }
        if (fe.checked) {
          if (formEl[k + 1] && formEl[k].name === formEl[k + 1].name) {
            checkboxGroup.push(sanitizeInput(formEl[k].value));
            payload[fe.name] = checkboxGroup.join(', ');
          } else {
            checkboxGroup = [];
            payload[fe.name] = sanitizeInput(fe.value);
          }
        }
      } else if (fe.type === 'select-multiple') {
        const selected = [...fe.selectedOptions].map((option) => sanitizeInput(option.value));
        payload[fe.id] = selected.join(', ');
      } else if (fe.id) {
        payload[fe.id] = sanitizeInput(fe.value);
      }
    }
  });
  return isError ? false : payload;
}

function createButton(fd) {
  const button = document.createElement('a');
  button.classList.add('button');
  button.href = '';
  button.textContent = fd.Label;
  if (fd.Field === 'submit') {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      button.setAttribute('disabled', '');
      const payload = await submitForm(button.closest('form'));

      if (!payload) {
        button.removeAttribute('disabled');
        return;
      }

      const resp = await fetch(button.closest('form').dataset.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: payload }),
      });

      if (resp.ok) {
        window.location.href = fd.Extra;
      } else {
        // eslint-disable-next-line no-console
        console.error(`Error submitting form: ${resp.status}`, resp);
      }
    });
  }
  return button;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = fd.Type;
  input.id = fd.Field;

  if (fd.Value) {
    input.value = fd.Value;
  }

  const param = getURLParam(input.id);
  if (param) {
    input.value = param;
  }

  input.setAttribute('placeholder', fd.Placeholder);

  if (fd.Mandatory === 'x') {
    input.setAttribute('required', '');

    input.addEventListener('change, blur', () => {
      if (input.value && input.parentNode.classList.contains('error')) {
        input.parentNode.classList.remove('error');
      } else {
        input.parentNode.classList.add('error');
      }
    });
  }

  return input;
}

function createTextarea(fd) {
  const textarea = document.createElement('textarea');
  textarea.id = fd.Field;
  textarea.setAttribute('placeholder', fd.Placeholder);

  if (fd.Mandatory === 'x') {
    textarea.setAttribute('required', '');

    textarea.addEventListener('change', () => {
      if (textarea.value && textarea.parentNode.classList.contains('error')) {
        textarea.parentNode.classList.remove('error');
      } else {
        textarea.parentNode.classList.add('error');
      }
    });
  }

  return textarea;
}

function createLabel(fd) {
  const label = document.createElement('label');
  if (fd.Label) {
    label.setAttribute('for', fd.Field);
    if (fd.Extra) {
      label.innerHTML = `<a href="${fd.Extra}">${fd.Label}</a>`;
    } else {
      label.textContent = fd.Label;
    }

    if (fd.Mandatory === 'x') {
      label.insertAdjacentHTML('beforeend', '<span class="required">*</span>');
    }
  }
  return label;
}

function createDescription(fd) {
  const desc = document.createElement('p');
  desc.className = 'form-description';
  desc.textContent = fd.Description;
  return desc;
}

function applyRules(form, rules) {
  const payload = constructPayload(form);
  const usp = new URLSearchParams(window.location.search);
  rules.forEach((field) => {
    const {
      type,
      condition: { key, operator, value },
    } = field.rule;
    if (type === 'visible') {
      if (operator === 'eq') {
        if (payload[key] === value || [...usp.getAll(key)].includes(value)) {
          form.querySelector(`.${field.fieldId}`).classList.remove('hidden');
        } else {
          form.querySelector(`.${field.fieldId}`).classList.add('hidden');
        }
      }
    }
  });
}

async function createForm(formURL) {
  const { pathname } = new URL(formURL);
  const resp = await fetch(pathname);
  const json = await resp.json();
  const form = document.createElement('form');
  const rules = [];

  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];
  json.data.forEach((fd) => {
    fd.Type = fd.Type || 'text';
    const fieldWrapper = document.createElement('div');
    const style = fd.Style ? ` form-${fd.Style}` : '';
    fieldWrapper.className = `form-${fd.Type}-wrapper${style}`;
    const fieldId = `form-${fd.Field}-wrapper${style}`;
    fieldWrapper.className = fieldId;
    switch (fd.Type) {
      case 'select':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createDescription(fd));
        fieldWrapper.append(createSelect(fd));
        break;
      case 'multiselect':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createDescription(fd));
        fieldWrapper.append(createSelect(fd, true));
        break;
      case 'button':
        fieldWrapper.append(createButton(fd));
        break;
      case 'checkbox':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createDescription(fd));
        fieldWrapper.append(createOptions(fd));
        break;
      case 'radio':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createDescription(fd));
        fieldWrapper.append(createOptions(fd));
        break;
      case 'textarea':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createDescription(fd));
        fieldWrapper.append(createTextarea(fd));
        break;
      default:
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createDescription(fd));
        fieldWrapper.append(createInput(fd));
    }
    form.append(fieldWrapper);

    if (fd.Rules) {
      try {
        rules.push({ fieldId, rule: JSON.parse(fd.Rules) });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Invalid Rule ${fd.Rules}: ${e}`);
      }
    }
  });

  form.addEventListener('change', () => applyRules(form, rules));
  applyRules(form, rules);

  return form;
}

function mktoFormReset(form, moreStyles) {
  const formId = `mktoForm_${form.getId()}`;
  const formEl = form.getFormElem()[0];

  const rando = Math.floor(Math.random() * 1000000);
  formEl.querySelectorAll('label[for]').forEach((labelEl) => {
    const forEl = formEl.querySelector(`[id="${labelEl.htmlFor}"]`);
    if (forEl) {
      const newId = `${forEl.id}_${rando}`;
      labelEl.htmlFor = newId;
      forEl.id = newId;
      if (forEl.classList.contains('mktoField')) {
        forEl.nextElementSibling.htmlFor = newId;
      }
    }
  });

  // remove element styles from <form> and children
  const styledEls = [...formEl.querySelectorAll('[style]')].concat(formEl);
  styledEls.forEach((el) => {
    el.removeAttribute('style');
  });

  const formStyleTag = formEl.querySelector('style[type="text/css"]');
  if (formStyleTag) formStyleTag.remove();

  document.getElementById('mktoForms2BaseStyle').disabled = true;
  document.getElementById('mktoForms2ThemeStyle').disabled = true;

  document.querySelectorAll('.mktoAsterix').forEach((el) => {
    el.remove();
  });
  document.querySelectorAll('.mktoOffset').forEach((el) => {
    el.remove();
  });
  document.querySelectorAll('.mktoGutter').forEach((el) => {
    el.remove();
  });
  document.querySelectorAll('.mktoClear').forEach((el) => {
    el.remove();
  });

  formEl.querySelector('[name="Country"]').addEventListener('change', () => {
    document.querySelectorAll('.mktoAsterix').forEach((el) => {
      el.remove();
    });
    document.querySelectorAll('.mktoHtmlText').forEach((el) => {
      el.removeAttribute('style');
    });
    if (document.getElementById(formId).querySelector('[name="Disclaimer__c"]')) {
      const gdprLabel = document.getElementById(formId).querySelector('[for="Disclaimer__c"]');
      const gdprInput = document.getElementById(formId).querySelector('[id="Disclaimer__c"]');
      gdprInput.id = `Disclaimer__c_${rando}`;
      gdprInput.nextElementSibling.htmlFor = `Disclaimer__c_${rando}`;
      gdprLabel.htmlFor = `Disclaimer__c_${rando}`;
      gdprLabel.removeAttribute('style');
      gdprInput.parentElement.classList.add('form-checkbox-option');
      gdprLabel.parentElement.classList.add('form-checkbox-flex');
      gdprLabel.firstElementChild.classList.add('form-gdpr-text');
    }
  });

  formEl.querySelectorAll('[type="checkbox"]').forEach((el) => {
    el.parentElement.classList.add('form-checkbox-option');
    el.parentElement.parentElement.classList.add('form-checkbox-flex');
  });

  if (!moreStyles) {
    formEl.setAttribute('data-styles-ready', 'true');
  }
}

/* Adobe event tracking */
function adobeEventTracking(event, name) {
  window.digitalData.push({
    event,
    component: {
      name
    }
  });
}

function loadFormAndChilipiper(formId, successUrl, chilipiper) {
  loadScript('//grow.bamboohr.com/js/forms2/js/forms2.min.js', () => {
    window.MktoForms2.loadForm('//grow.bamboohr.com', '195-LOZ-515', formId);

    window.MktoForms2.whenReady((form) => {
      if (form.getId().toString() === formId) {
        mktoFormReset(form);

        /* Adobe Form Start event tracking when user click into the first field */
        form.getFormElem()[0].firstElementChild.addEventListener('click', () => {
          adobeEventTracking('Form Start', form.getId());
        });

        form.onSuccess(() => {
          /* GA events tracking */
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'marketoForm',
            formName: form.getId(),
          });

          /* Adobe form complete events tracking */
          adobeEventTracking('Form Complete', form.getId());

          if (successUrl && !chilipiper) window.location.href = successUrl;
          return false;
        });
      }
    });
  });
  if (chilipiper) {
    const timeoutSuccessUrl = chilipiper === 'pricing-request-form' ? '/chilipiper-pricing-timeout-success' : '/chilipiper-demo-timeout-success';
    loadScript('https://js.chilipiper.com/marketing.js', () => {
      function redirectTimeout() {
        return setTimeout(() => { window.location.href = timeoutSuccessUrl; }, '240000');
      }
      //  eslint-disable-next-line
      window.q = (a) => {return function(){ChiliPiper[a].q=(ChiliPiper[a].q||[]).concat([arguments])}};window.ChiliPiper=window.ChiliPiper||"submit scheduling showCalendar submit widget bookMeeting".split(" ").reduce(function(a,b){a[b]=q(b);return a},{});
      // eslint-disable-next-line
      ChiliPiper.scheduling('bamboohr', `${chilipiper}`, {
        title: 'Thanks! What time works best for a quick call?',
        onRouted: redirectTimeout,
        map: true,
      });
    });
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const as = block.querySelectorAll('a');
  let formUrl = as[0] ? as[0].href : '';
  let successUrl = as[1] ? as[1].href : '';
  let chilipiper;

  [...block.classList].forEach((name) => {
    if (!Number.isNaN(+name.split('').at(0))) {
      block.classList.remove(name);
      block.classList.add(`grid-${name}`);
    }
  });

  if (!formUrl) {
    const resp = await fetch('/forms-map.json');
    const json = await resp.json();
    const map = json.data;
    map.forEach((entry) => {
      if (
        entry.URL === window.location.pathname || (entry.URL.endsWith('**') && window.location.pathname.startsWith(entry.URL.split('**')[0]))
      ) {
        formUrl = entry.Form;
        successUrl = entry.Success;
        chilipiper = entry.Chilipiper;
      }
    });
  }

  if (formUrl) {
    if (formUrl.includes('marketo')) {
      const formId = new URL(formUrl).hash.substring(4);
      if (config && !block.classList.contains('has-content')) {
        block.innerHTML = '';
      }
      const mktoForm = `<form id="mktoForm_${formId}"></form>`;
      if (block.classList.contains('has-content')) {
        const cols = block.querySelectorAll(':scope > div > div');
        cols.forEach((col) => {
          const formCol = [...col.children].find((child) => child.textContent.trim().toLowerCase() === 'form');
          if (formCol) {
            col.classList.add('form-col');
            formCol.remove();
            const formContainer = document.createElement('div');
            formContainer.innerHTML = mktoForm;
            col.append(formContainer);
            loadFormAndChilipiper(formId, successUrl, chilipiper);
          } else {
            col.classList.add('content-col');
          }
        });
      } else {
        block.innerHTML = mktoForm;
        loadFormAndChilipiper(formId, successUrl, chilipiper);
      }
    } else {
      const formEl = await createForm(formUrl);
      block.firstElementChild.replaceWith(formEl);
    }
  }
}
