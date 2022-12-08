export default function decorate(block) {
  const backIcon = document.createElement('div');
  backIcon.className = 'back-icon';
  block.append(backIcon);

  const goToTop = () => {
    document.body.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const showOnPx = 1000;
  const scrollContainer = () => document.documentElement || document.body;

  document.addEventListener('scroll', () => {
    if (scrollContainer().scrollTop > showOnPx) {
      backIcon.style.display = 'block';
    } else {
      backIcon.style.display = 'none';
    }
  });

  backIcon.addEventListener('click', goToTop);
}
