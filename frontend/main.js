const slides = [
  {
    image: "url('./assets/bg.png')",
    badge: 'Now Showing',
    eyebrow: 'Watch the latest movies & shows',
    title: 'Stream your favorites anytime',
    subtitle: 'A cinematic home for your next binge.'
  },
  {
    image: "url('./assets/td.png')",
    badge: 'New Release',
    eyebrow: 'Discover new releases',
    title: 'Fresh stories, ready to stream',
    subtitle: 'Catch the biggest premieres before they hit the mainstream.'
  },
  {
    image: "url('./assets/yd.png')",
    badge: 'Top Rated',
    eyebrow: 'Stream top-rated picks',
    title: 'Critics love these scenes',
    subtitle: 'A handpicked lineup of fan favorites and hidden gems.'
  },
  {
    image: "url('./assets/tb.png')",
    badge: 'Blockbuster',
    eyebrow: 'Enjoy blockbuster hits',
    title: 'Big action, bigger energy',
    subtitle: 'Turn every night into a premium movie night.'
  },
  {
    image: "url('./assets/tf.png')",
    badge: 'Fan Favorite',
    eyebrow: 'Find your next favorite',
    title: 'Your next obsession starts here',
    subtitle: 'Explore stories crafted for late-night marathons.'
  }
];

let currentIndex = 0;
const bgElement = document.getElementById('slideshow-bg');
const captionElement = document.getElementById('slide-caption');
const badgeElement = document.getElementById('slide-badge');
const subtitleElement = document.getElementById('slide-subtitle');

function updateSlide(index) {
  if (!bgElement) return;
  const slide = slides[index];
  bgElement.style.backgroundImage = slide.image;

  if (captionElement) {
    const eyebrow = captionElement.querySelector('p');
    const heading = captionElement.querySelector('h1');
    if (eyebrow) eyebrow.textContent = slide.eyebrow;
    if (heading) heading.textContent = slide.title;
  }

  if (badgeElement) badgeElement.textContent = slide.badge;
  if (subtitleElement) subtitleElement.textContent = slide.subtitle;
}

// Initialize first slide after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  updateSlide(currentIndex);

  setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlide(currentIndex);
  }, 5000);
});

// Small helper: handle an input key if present
const inputElement = document.getElementById('myInput');
if (inputElement) {
  inputElement.onkeydown = function(event) {
    if (event.key === 'Enter') {
      // keep minimal behavior for now
      console.log('Enter pressed in search input');
    }
  };
}
