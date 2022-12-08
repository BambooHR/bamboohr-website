export default function decorate(block) {
  block.querySelectorAll('li').forEach((li) => {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    li.prepend(cb);
  });
}
