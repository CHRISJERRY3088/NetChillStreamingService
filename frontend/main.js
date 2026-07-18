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
const heroContentElement = document.getElementById('win');
const subtitleElements = Array.from(document.querySelectorAll('#slide-subtitle'));
const prevButton = document.getElementById('slideshowPrevButton');
const nextButton = document.getElementById('slideshowNextButton');
const trailerButton = document.getElementById('trailerButton');
const trailerModal = document.getElementById('trailerModal');
const closeTrailerModalButton = document.getElementById('closeTrailerModal');
const trailerVideo = document.getElementById('trailerVideo');
const heroAutoTrailer = document.getElementById('heroAutoTrailer');
const AUTO_PLAY_SECONDS = 15;
let trailerAutoPlayTimer = null;
const trailerVideoDefaultSrc = trailerVideo?.querySelector('source')?.getAttribute('src') || '';
const localTrailerVideoPath = '../Hexed%20-%20Official%20Teaser%20Trailer.mp4';

function decodeHexVideoName(input) {
  if (!input) return null;
  const normalizedInput = input.trim();
  if (!normalizedInput) return null;

  const hexPattern = /^[0-9a-f]+$/i;
  if (!hexPattern.test(normalizedInput)) {
    return normalizedInput;
  }

  try {
    const bytes = [];
    for (let index = 0; index < normalizedInput.length; index += 2) {
      const chunk = normalizedInput.slice(index, index + 2);
      if (chunk.length !== 2) return null;
      bytes.push(String.fromCharCode(parseInt(chunk, 16)));
    }
    return bytes.join('');
  } catch (error) {
    console.warn('Unable to decode trailer video name', error);
    return null;
  }
}

function resolveTrailerVideoUrl() {
  const encodedName = new URLSearchParams(window.location.search).get('videoHex');
  const decodedName = decodeHexVideoName(encodedName);
  if (!decodedName) return localTrailerVideoPath;

  const normalizedName = decodedName.toLowerCase().trim();
  if (normalizedName === 'tease.mp4' || normalizedName.includes('tease') || normalizedName.includes('hexed')) {
    return localTrailerVideoPath;
  }

  if (/^https?:\/\//i.test(decodedName) || decodedName.startsWith('/') || decodedName.startsWith('./')) {
    return decodedName;
  }

  return `./${decodedName.replace(/^\.?\//, '')}`;
}

function setTrailerVideoSource(videoUrl) {
  if (!trailerVideo) return;
  const sourceElement = trailerVideo.querySelector('source');
  if (sourceElement) {
    sourceElement.src = videoUrl;
    sourceElement.type = 'video/mp4';
  }
  trailerVideo.load();
}

function stopTrailerAutoPlayTimer() {
  if (trailerAutoPlayTimer) {
    clearTimeout(trailerAutoPlayTimer);
    trailerAutoPlayTimer = null;
  }
}

async function openTrailerModal(videoUrl = null) {
  if (!trailerModal) return;
  stopTrailerAutoPlayTimer();
  trailerModal.classList.remove('hidden');
  trailerModal.classList.add('flex');
  document.body.classList.add('overflow-hidden');

  if (trailerVideo) {
    const nextVideoUrl = videoUrl || trailerVideoDefaultSrc;
    setTrailerVideoSource(nextVideoUrl);
    trailerVideo.currentTime = 0;
    try {
      if (document.fullscreenElement !== trailerModal) {
        await trailerModal.requestFullscreen?.();
      }
    } catch (error) {
      console.warn('Fullscreen request failed', error);
    }
    trailerVideo.play().catch(() => {});
  }
}

function closeTrailerModal() {
  if (!trailerModal) return;
  stopTrailerAutoPlayTimer();
  trailerModal.classList.add('hidden');
  trailerModal.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
  if (document.fullscreenElement === trailerModal) {
    document.exitFullscreen?.().catch(() => {});
  }
  if (trailerVideo) {
    trailerVideo.pause();
    trailerVideo.currentTime = 0;
    setTrailerVideoSource(trailerVideoDefaultSrc);
  }
}

function autoplayTrailerFromHexVideo() {
  const videoUrl = resolveTrailerVideoUrl();
  if (!videoUrl) return;

  const startHeroTrailer = () => {
    if (!heroAutoTrailer) return;
    const heroSource = heroAutoTrailer.querySelector('source');
    if (heroSource) {
      heroSource.src = videoUrl;
      heroSource.type = 'video/mp4';
    }
    heroAutoTrailer.load();
    heroAutoTrailer.currentTime = 0;
    heroAutoTrailer.muted = true;
    heroAutoTrailer.play().catch(() => {
      setTimeout(() => {
        heroAutoTrailer.play().catch(() => {});
      }, 250);
    });
  };

  if (heroAutoTrailer) {
    startHeroTrailer();
  }

  // Only autoplay the hero preview when a hex video is provided.
  if (heroAutoTrailer) {
    startHeroTrailer();
  }
}

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
  if (heroContentElement) {
    const heroHeading = heroContentElement.querySelector('h2');
    const heroParagraph = heroContentElement.querySelector('p');
    if (heroHeading) heroHeading.textContent = slide.title;
    if (heroParagraph) heroParagraph.textContent = slide.subtitle;
  }
  subtitleElements.forEach((el) => {
    el.textContent = slide.subtitle;
  });
}

// Initialize first slide after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  updateSlide(currentIndex);

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlide(currentIndex);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide(currentIndex);
    });
  }

  if (trailerButton) {
    trailerButton.addEventListener('click', (event) => {
      event.preventDefault();
      openTrailerModal(resolveTrailerVideoUrl());
    });
  }

  if (closeTrailerModalButton) {
    closeTrailerModalButton.addEventListener('click', closeTrailerModal);
  }

  if (trailerModal) {
    trailerModal.addEventListener('click', (event) => {
      if (event.target === trailerModal) {
        closeTrailerModal();
      }
    });
  }

  document.addEventListener('click', (event) => {
    const triggerButton = event.target.closest('.trailer-trigger');
    if (triggerButton) {
      event.preventDefault();
      openTrailerModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && trailerModal && !trailerModal.classList.contains('hidden')) {
      closeTrailerModal();
    }
  });

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
