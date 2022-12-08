import { loadFragment } from '../../scripts/scripts.js';

function getModalId(path) {
  const segments = path.split('/');
  return `#${segments.pop()}-modal`;
}

export default async function decorate(block) {
  
  if (block.innerHTML === '') {
    const openModal = async (a, path) => {
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        const modalId = getModalId(path);
        const elem = document.getElementById(modalId);
        if (!elem) {
          const wrapper = document.createElement('div');
          wrapper.className = 'modal-wrapper';
          wrapper.id = modalId;

          const modal = document.createElement('div');
          modal.className = 'modal';
          modal.innerHTML = '<div class="modal-close"></div>';
          const modalContent = document.createElement('div');
          modalContent.classList.add('modal-content');
          modal.append(modalContent);
          
          if (a.dataset.path) {
            const fragment = await loadFragment(a.dataset.path);
            const formTitleEl = fragment.querySelector('h2');
            formTitleEl.outerHTML = `<div class="modal-form-title typ-title1">${formTitleEl.innerHTML}</div>`;
            const formSubTitleEl = fragment.querySelector('h3');
            formSubTitleEl.outerHTML = `<p class="modal-form-subtitle">${formSubTitleEl.innerHTML}</p>`;
            modalContent.append(fragment);
          }
          wrapper.append(modal);
          block.append(wrapper);
          wrapper.classList.add('visible');
          document.body.classList.add('modal-open');
          const close = modal.querySelector('.modal-close');
          close.addEventListener('click', () => {
            wrapper.classList.remove('visible');
            document.body.classList.remove('modal-open');
          });
        } else {
          elem.classList.add('visible');
          document.body.classList.add('modal-open');
        }
      });
    };
    document.querySelectorAll('a').forEach((a) => {
      if (a.href.includes('/fragments/modals/')) {
        const path = new URL(a.href).pathname;
        a.dataset.path = path;
        const modalId = getModalId(path);
        a.dataset.modal = modalId;
        a.href = '#';
        openModal(a, path);
      }
    });
  }
}