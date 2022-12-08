export default function decorate(block) {
  // convert "number" classes
  [...block.classList].forEach((name) => {
    if (!Number.isNaN(+name.split('').at(0))) {
      block.classList.remove(name);
      block.classList.add(`style-${name}`);
    }
  });

  // clean up markup, move all "columns" as block children
  block.querySelectorAll(':scope > div').forEach((row, key) => {
    row.querySelectorAll(':scope > div').forEach((col) => {
      const pictures = col.querySelectorAll('picture');

      if (pictures.length > 1) {
        col.classList.add('images');

        // move to parent div and remove empty p
        pictures.forEach((picture) => {
          picture.parentNode.remove();
          col.append(picture);
        });
      } else {
        col.classList.add('content');
      }

      if (
        key === 1 &&
        (block.classList.contains('extra') || block.classList.contains('extra-right'))
      ) {
        col.classList.add('extra');
      }

      block.append(col);
    });

    row.remove();
  });
}
