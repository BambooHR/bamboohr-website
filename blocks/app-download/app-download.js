export default function decorate(block) {
  const gridElementList = block.querySelectorAll(':scope > div');
  const gridElements = [...gridElementList];

  block.classList.add('grid');

  gridElements.forEach((grid, index) => {
    grid.classList.add(`grid-item-${index}`);

    if (index === 0) {
      grid.insertAdjacentHTML(
        'beforeend',
        '<svg viewBox="0 0 696 765" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M590.996 219.792c30.35 34.21 40.144 82.012 25.693 125.4l-58.413 175.383c-14.451 43.389-50.952 75.772-95.753 84.952L281.43 642.631c-44.801 9.179-91.096-6.24-121.446-40.449L37.304 463.903c-30.35-34.209-40.144-82.011-25.693-125.4L70.024 163.12c14.451-43.388 50.952-75.772 95.753-84.951L346.87 41.065c44.801-9.18 91.096 6.24 121.446 40.449l122.68 138.278Z" fill="url(#b)"/><path fill="url(#c)" d="M57-50h494v784H57z"/></g><path d="M346.8 654.637a40.958 40.958 0 0 1-32.278-25.218l-51.393-127.203a40.96 40.96 0 0 1 5.7-40.563l84.465-108.109a40.962 40.962 0 0 1 37.979-15.345l135.857 19.094a40.96 40.96 0 0 1 32.278 25.218l51.394 127.203a40.961 40.961 0 0 1-5.701 40.563l-84.464 108.109a40.962 40.962 0 0 1-37.979 15.345L346.8 654.637Z" stroke="var(--theme-tint5)" stroke-width="2"/><defs><radialGradient id="b" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="rotate(5.4 -1322.504 1855.24) scale(465.968 542.064)"><stop stop-color="var(--theme-base)"/><stop offset=".913" stop-color="var(--theme-shade10)"/></radialGradient></defs></svg>',
      );
    }
  });
}
