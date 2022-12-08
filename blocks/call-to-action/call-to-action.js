import { insertNewsletterForm, loadFragment } from '../../scripts/scripts.js';

export default function decorateBlock(block) {
  if (block.classList.contains('bottom')) block.parentElement.parentElement.classList.add('bottom');
  const callToActionModal = async (a) => {
    a.addEventListener('click', async () => {
      const elem = document.getElementById('call-to-action-modal');
      if (!elem) {
        const wrapper = document.createElement('div');
        wrapper.className = 'modal-wrapper';

        const modal = document.createElement('div');
        modal.classList.add('modal', 'call-to-action-modal');
        modal.id = 'call-to-action-modal';
        modal.innerHTML = '<div class="modal-close"></div>';
        const fragment = await loadFragment(a.dataset.modal);
        insertNewsletterForm(fragment, () => {
          wrapper.classList.remove('visible');
        });
        modal.append(fragment);
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
        block.querySelector('.modal-wrapper').classList.add('visible');
        document.body.classList.add('modal-open');
      }
    });
    a.dataset.modal = new URL(a.href).pathname;
    a.href = '#';
  };

  block.querySelectorAll('a').forEach((a) => {
    if (a.href.includes('/fragments/')) {
      callToActionModal(a);
    }
  });
}
