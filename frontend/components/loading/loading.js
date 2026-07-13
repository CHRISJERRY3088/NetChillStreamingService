// Reusable Alpine-compatible skeleton loader
window.skeletonLoader = (el) => {
    const ds = el && el.dataset ? el.dataset : {};
    const duration = parseInt(ds.duration) || 3000;
    const items = parseInt(ds.items) || 4;
    const rows = parseInt(ds.rows) || 2;
    const variant = ds.variant || 'card';
    const rounded = ds.rounded || 'md';
    const extraClass = ds.class || '';
    const autostart = ds.autostart !== 'false';

    const radiusMap = { none: 'rounded-none', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-xl', full: 'rounded-full' };

    function buildSkeleton() {
        // If markup already present, don't override
        if (el.innerHTML.trim()) return;

        const wrapperClass = ('skeleton-grid ' + extraClass).trim();
        let html = `<div class="${wrapperClass}" aria-hidden="true">`;

        for (let i = 0; i < items; i++) {
            let lines = '';
            for (let r = 0; r < rows; r++) {
                const short = (r === rows - 1 && Math.random() > 0.5) ? ' short' : '';
                lines += `<div class="line${short}"></div>`;
            }

            html += `<div class="skeleton ${radiusMap[rounded] || radiusMap.md}">`;
            if (variant !== 'list') html += `<div class="title"></div>`;
            html += lines;
            html += `</div>`;
        }

        html += `</div>`;
        el.innerHTML = html;
    }

    const api = {
        show: true,
        _timeout: null,
        duration,
        start() {
            buildSkeleton();
            this.show = true;
            if (this._timeout) clearTimeout(this._timeout);
            this._timeout = setTimeout(() => { this.show = false; this._timeout = null; }, this.duration);
        },
        stop() {
            this.show = false;
            if (this._timeout) { clearTimeout(this._timeout); this._timeout = null; }
        },
        toggle() { this.show = !this.show; }
    };

    // Attach a simple element-level API so other scripts can control the loader
    try {
        if (el) {
            el.skeletonAPI = {
                start: () => api.start(),
                stop: () => api.stop(),
                toggle: () => api.toggle(),
                getState: () => ({ show: api.show, duration: api.duration, items, rows, variant, rounded })
            };

            // Register in a global map by id for convenience
            window.skeletonLoaders = window.skeletonLoaders || {};
            if (el.id) window.skeletonLoaders[el.id] = el.skeletonAPI;
        }
    } catch (e) {
        // ignore attach errors
    }

    return api;
};
