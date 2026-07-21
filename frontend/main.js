const slides = [
  {
    image: '',
    badge: 'Now Showing',
    eyebrow: 'Watch the latest movies & shows',
    title: 'Stream your favorites anytime',
    subtitle: 'A cinematic home for your next binge.'
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
const heroTrailerPreviewButton = document.getElementById('heroTrailerPreview');
const trailerModal = document.getElementById('trailerModal');
const closeTrailerModalButton = document.getElementById('closeTrailerModal');
const trailerVideo = document.getElementById('trailerVideo');
const trailerEmbed = document.getElementById('trailerEmbed');
const trailerEmbedContainer = document.getElementById('trailerEmbedContainer');
const heroAutoTrailer = document.getElementById('heroAutoTrailer');
const AUTO_PLAY_SECONDS = 15;
const DEFAULT_FEATURED_EMBED_URL = '';
let trailerAutoPlayTimer = null;
const trailerVideoDefaultSrc = trailerVideo?.querySelector('source')?.getAttribute('src') || '';
const localTrailerVideoPath = '';
let currentTrailerUrl = trailerVideoDefaultSrc || localTrailerVideoPath;

function normalizeSlideData(slide) {
  if (!slide || typeof slide !== 'object') return null;
  return {
    image: slide.image || '',
    badge: slide.badge || 'Now Showing',
    eyebrow: slide.eyebrow || 'Watch the latest movies & shows',
    title: slide.title || 'Stream your favorites anytime',
    subtitle: slide.subtitle || 'A cinematic home for your next binge.',
    trailerUrl: resolvePlayableTrailerUrl(slide.trailer_url || slide.trailerUrl || localTrailerVideoPath) || '',
    trailerButtonText: slide.trailer_button_text || slide.trailerButtonText || 'View Trailer',
  };
}

async function loadSlideTrailers() {
  if (!window.moviesAPI?.getTrailers) return;

  try {
    const response = await window.moviesAPI.getTrailers();
    if (response?.results && Array.isArray(response.results) && response.results.length > 0) {
      const fetchedSlides = response.results
        .map(normalizeSlideData)
        .filter(Boolean);
      if (fetchedSlides.length) {
        slides.splice(0, slides.length, ...fetchedSlides);
      }
    }
  } catch (error) {
    console.warn('Unable to fetch trailer slides from API:', error);
  }

  renderTrailerCards(slides);
}

function isPlayableVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const normalized = url.trim().toLowerCase();
  return normalized.endsWith('.mp4') || normalized.endsWith('.webm') || normalized.endsWith('.ogg');
}

function resolvePlayableTrailerUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  return isPlayableVideoUrl(trimmed) ? trimmed : null;
}

function renderTrailerCards(trailers) {
  const container = document.getElementById('trailerCards');
  if (!container) return;

  if (!Array.isArray(trailers) || trailers.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-300">No trailer data is available right now.</p>';
    return;
  }

  container.innerHTML = trailers.slice(0, 5).map((trailer) => {
    const title = trailer.title || trailer.eyebrow || 'Trailer';
    const subtitle = trailer.subtitle || 'Watch the latest trailer preview.';
    const image = trailer.image || '';
    const trailerUrl = trailer.trailerUrl || trailer.trailer_url || '';
    const buttonText = trailer.trailerButtonText || trailer.trailer_button_text || 'Watch Trailer';
    const safeTrailerUrl = String(trailerUrl).replace(/'/g, "\\'");
    const playable = isPlayableVideoUrl(trailerUrl);
    const buttonAction = playable
      ? `onclick="openTrailerModal('${safeTrailerUrl}')"`
      : 'disabled';
    const buttonLabel = playable ? buttonText : 'Trailer unavailable';

    return `
      <article class="trailer-card group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-lg transition hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl sm:shadow-xl">
        <div class="relative h-28 bg-cover bg-center sm:h-40 lg:h-52" style="background-image: ${image};">
          <div class="absolute inset-0 bg-black/30"></div>
          <div class="absolute bottom-0 left-0 right-0 p-2 text-white sm:p-4">
            <p class="text-[10px] uppercase tracking-[0.25em] text-blue-200 sm:text-xs">${trailer.badge || 'Trailer'}</p>
            <h3 class="mt-1 text-sm font-bold leading-tight sm:mt-2 sm:text-lg">${title}</h3>
          </div>
        </div>
        <div class="p-2 sm:p-4">
          <p class="text-xs text-slate-300 line-clamp-2 sm:text-sm">${subtitle}</p>
          <button type="button" ${buttonAction} class="mt-3 w-full rounded-full ${playable ? 'bg-blue-500 text-white hover:bg-blue-400' : 'bg-slate-700 text-slate-300 cursor-not-allowed'} px-3 py-1.5 text-xs font-semibold transition sm:mt-4 sm:px-4 sm:py-2 sm:text-sm">${buttonLabel}</button>
        </div>
      </article>
    `;
  }).join('');
}

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
  if (!encodedName) return null;

  const decodedName = decodeHexVideoName(encodedName);
  if (!decodedName) return null;

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

function isIframePlayerUrl(url) {
  return false;
}

function setTrailerPlayerMode(url) {
  if (!trailerVideo) return;

  if (trailerEmbedContainer) {
    trailerEmbedContainer.classList.add('hidden');
  }
  if (trailerEmbed) {
    trailerEmbed.removeAttribute('src');
  }
  trailerVideo.classList.remove('hidden');
}

function updateHeroTrailerSource(url) {
  if (!heroAutoTrailer) return;
  const heroSource = heroAutoTrailer.querySelector('source');
  if (!heroSource) return;

  const heroVideoUrl = resolvePlayableTrailerUrl(url) || '';
  heroSource.src = heroVideoUrl;
  heroSource.type = 'video/mp4';
  heroAutoTrailer.load();
  heroAutoTrailer.currentTime = 0;
  heroAutoTrailer.muted = true;
  heroAutoTrailer.autoplay = true;
  heroAutoTrailer.playsInline = true;
  heroAutoTrailer.loop = true;
  heroAutoTrailer.play().catch(() => {});
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

  const selectedPlayerUrl = videoUrl || currentTrailerUrl || '';
  setTrailerPlayerMode(selectedPlayerUrl);

  const nextVideoUrl = resolvePlayableTrailerUrl(selectedPlayerUrl) || trailerVideoDefaultSrc || localTrailerVideoPath;
  if (trailerVideo) {
    setTrailerVideoSource(nextVideoUrl);
    trailerVideo.currentTime = 0;
    trailerVideo.muted = true;
    trailerVideo.autoplay = true;
    trailerVideo.playsInline = true;

    try {
      if (document.fullscreenElement !== trailerModal) {
        await trailerModal.requestFullscreen?.();
      }
    } catch (error) {
      console.warn('Fullscreen request failed', error);
    }

    setTimeout(() => {
      trailerVideo.play().catch((error) => {
        console.warn('Trailer play failed:', error);
        setTimeout(() => {
          trailerVideo.play().catch(() => {});
        }, 500);
      });
    }, 100);
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
  if (trailerEmbed) {
    trailerEmbed.removeAttribute('src');
  }
  if (trailerEmbedContainer) {
    trailerEmbedContainer.classList.add('hidden');
  }
  if (trailerVideo) {
    trailerVideo.classList.remove('hidden');
  }
}

function autoplayTrailerFromHexVideo() {
  const videoUrl = resolvePlayableTrailerUrl(resolveTrailerVideoUrl()) || currentTrailerUrl || '';
  if (!heroAutoTrailer) return;

  const heroSource = heroAutoTrailer.querySelector('source');
  if (heroSource) {
    heroSource.src = videoUrl;
    heroSource.type = 'video/mp4';
  }

  heroAutoTrailer.load();
  heroAutoTrailer.currentTime = 0;
  heroAutoTrailer.muted = true;
  heroAutoTrailer.autoplay = true;
  heroAutoTrailer.playsInline = true;
  heroAutoTrailer.loop = true;

  const startHeroTrailer = () => {
    heroAutoTrailer.play().catch((error) => {
      console.warn('Initial hero trailer play failed:', error);
      // Retry after a short delay
      setTimeout(() => {
        heroAutoTrailer.play().catch((retryError) => {
          console.warn('Hero trailer play retry failed:', retryError);
        });
      }, 500);
    });
  };

  // Try to play immediately if already loaded
  if (heroAutoTrailer.readyState >= 2) {
    startHeroTrailer();
  } else {
    heroAutoTrailer.addEventListener('canplay', startHeroTrailer, { once: true });
  }
}

function updateSlide(index) {
  if (!bgElement) return;
  const slide = slides[index];
  bgElement.style.backgroundImage = 'none';

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

  if (trailerButton) {
    trailerButton.textContent = slide.trailerButtonText || 'View Trailer';
  }

  currentTrailerUrl = resolvePlayableTrailerUrl(slide.trailerUrl) || currentTrailerUrl || '';
  updateHeroTrailerSource(currentTrailerUrl);

  subtitleElements.forEach((el) => {
    el.textContent = slide.subtitle;
  });
}

// Initialize first slide after DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadSlideTrailers();
  updateSlide(currentIndex);
  autoplayTrailerFromHexVideo();

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
      openTrailerModal(resolveTrailerVideoUrl() || currentTrailerUrl || DEFAULT_FEATURED_EMBED_URL);
    });
  }

  if (heroTrailerPreviewButton) {
    heroTrailerPreviewButton.addEventListener('click', (event) => {
      event.preventDefault();
      openTrailerModal(DEFAULT_FEATURED_EMBED_URL);
    });
  }

  if (heroAutoTrailer) {
    heroAutoTrailer.addEventListener('click', (event) => {
      event.preventDefault();
      openTrailerModal(DEFAULT_FEATURED_EMBED_URL);
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
