/** @type {HTMLVideoElement} */
export const player = document.getElementById('player');
player.onfullscreenchange = () => player.classList[document.fullscreenElement ? 'remove' : 'add']('tt-border');

/** @type {HTMLDivElement} */
export const searchResults = document.getElementById('search-results');

/** @type {HTMLInputElement} */
export const ytSearch = document.getElementById('yt-search');

/** @type {HTMLDivElement} */
export const srLoading = document.getElementById('sr-loading');