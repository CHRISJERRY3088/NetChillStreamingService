const images = [
  "url('./assets/bg.png')",
  "url('./assets/td.png')",
  "url('./assets/yd.png')",
  "url('./assets/tb.png')",
  "url('./assets/tf.png')"
];

const captions = [
  "Watch the latest movies & shows",
  "Discover new releases",
  "Stream top-rated picks",
  "Enjoy blockbuster hits",
  "Find your next favorite"
];

let currentIndex = 0;
const bgElement = document.getElementById('slideshow-bg');
const captionElement = document.getElementById('slide-caption');

function updateSlide(index) {
  if (!bgElement) return;
  bgElement.style.backgroundImage = images[index];
  if (captionElement) {
    const heading = captionElement.querySelector('h1');
    if (heading) {
      heading.textContent = captions[index];
    }
  }
}

updateSlide(currentIndex);

setInterval(() => {
  currentIndex = (currentIndex + 1) % images.length;
  updateSlide(currentIndex);
}, 5000); // Changes image every 5 seconds


const inputElement = document.getElementById('myInput');

if (inputElement) {
  inputElement.onkeydown = function(event) {
    console.log(`Key pressed: ${event.key}`);

    if (event.key === 'Enter') {
      alert('Enter key pressed!');
    }
  };
}


