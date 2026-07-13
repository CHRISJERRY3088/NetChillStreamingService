
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('menu-toggle-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const sideMenu = document.getElementById('side-Bar-container');

    if (!toggleBtn || !closeBtn || !sideMenu) {
        return;
    }

    toggleBtn.addEventListener('click', () => {
        sideMenu.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        sideMenu.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === sideMenu) {
            sideMenu.classList.add('hidden');
        }
    });
});