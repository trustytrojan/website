/** @type {HTMLVideoElement} */
export const player = document.getElementById('player');
player.onfullscreenchange = () => player.classList[document.fullscreenElement ? 'remove' : 'add']('tt-border');

/** @type {HTMLAudioElement} */
export const audioPlayer = document.getElementById('audio-player');
player.onplay = audioPlayer.play.bind(audioPlayer);
player.onpause = audioPlayer.pause.bind(audioPlayer);
player.onseeking = () => audioPlayer.currentTime = player.currentTime;
player.onvolumechange = () => audioPlayer.volume = player.volume;
player.onratechange = () => audioPlayer.playbackRate = player.playbackRate;

/** @type {HTMLDivElement} */
export const searchResults = document.getElementById('search-results');

/** @type {HTMLInputElement} */
export const ytSearch = document.getElementById('yt-search');

/** @type {HTMLDivElement} */
export const srLoading = document.getElementById('sr-loading');