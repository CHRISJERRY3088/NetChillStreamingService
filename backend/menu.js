const initApp = () => {
    console.log('App initialized');
    const hamburgerBtn = document.getElementById('hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-menu-button');

    if (!hamburgerBtn || !mobileMenu || !closeMenuBtn) {
        console.error('One or more elements not found');
        return;
    }

    const toggleMenu = () => {
        console.log('Toggling menu');
        hamburgerBtn.classList.toggle('hidden');
        mobileMenu.classList.toggle('flex');
        mobileMenu.classList.toggle('hidden');
        closeMenuBtn.classList.toggle('close')
    };

    hamburgerBtn.addEventListener('click', toggleMenu);
    closeMenuBtn.addEventListener('click', toggleMenu);
    console.log('Event listeners added');
};

document.addEventListener('DOMContentLoaded', initApp);

const openBtn = document.getElementById("open-download-btn");
const closeBtn = document.getElementById("close-download-btn");
const downloadContainer = document.getElementById("download-container");

if (openBtn && closeBtn && downloadContainer) {
  openBtn.addEventListener("click", () => {
    downloadContainer.classList.remove("opacity-0", "pointer-events-none");
    downloadContainer.classList.add("opacity-100");
  });

  closeBtn.addEventListener("click", () => {
    downloadContainer.classList.remove("opacity-100");
    downloadContainer.classList.add("opacity-0", "pointer-events-none");
  });
}

document.addEventListener('DOMContentLoaded', initApp);

