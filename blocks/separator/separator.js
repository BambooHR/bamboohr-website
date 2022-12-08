export default function decorate(block) {
  const separatorHR = document.createElement('hr');
  separatorHR.classList.add('separator-horiz-line');
  block.classList.add('separator');
  block.append(separatorHR);
}
