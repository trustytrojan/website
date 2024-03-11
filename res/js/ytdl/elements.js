/** @type {HTMLTableSectionElement} */
export const videoTb = document.getElementById('video-tb');

/** @type {HTMLTableSectionElement} */
export const audioTb = document.getElementById('audio-tb');

/** @type {HTMLTableSectionElement} */
export const avTb = document.getElementById('av-tb');

/** @type {HTMLInputElement} */
export const ytIdOrUrl = document.getElementById('yt-id-or-url');

export const details = Object.freeze({
	/** @type {HTMLAnchorElement} */
	root: document.getElementById('details-root'),

	/** @type {HTMLImageElement} */
	thumbnail: document.getElementById('details-thumbnail'),
	
	title: document.getElementById('details-title'),
	
	/** @type {HTMLDivElement} */
	channel: document.getElementById('details-channel'),
	
	/** @type {HTMLDivElement} */
	viewsLength: document.getElementById('details-views-length'),
});

/** @type {HTMLAnchorElement} */
export const dlButton = document.getElementById('dl-button');
