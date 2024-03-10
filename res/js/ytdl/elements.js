import { ffmpegDl } from './ytdl.js';

let cloneCount = 0;

/**
 * @param {HTMLTableSectionElement} el 
 */
const cloneTableRow = (el) => {
	/** @type {HTMLTableSectionElement} */
	const clone = el.cloneNode(true);
	clone.id = `${el.id}-${cloneCount++}`;
	clone.ondragstart = (ev) => ev.dataTransfer.setData('id', clone.id);
	return clone;
};

/** @type {HTMLDivElement} */
export const videoFormatDrop = document.getElementById('video-format-drop');
videoFormatDrop.ondragover = (ev) => ev.preventDefault();
videoFormatDrop.ondrop = (ev) => {
	ev.preventDefault();
	if (videoFormatDrop.childElementCount)
		return;
	const el = document.getElementById(ev.dataTransfer.getData('id'));
	if (el.dataset.type === 'audio')
		return alert('this is not a video format!');
	videoFormatDrop.appendChild(cloneTableRow(el));
	dlButton.hidden = false;
};

/** @type {HTMLDivElement} */
export const audioFormatDrop = document.getElementById('audio-format-drop');
audioFormatDrop.ondragover = (ev) => ev.preventDefault();
audioFormatDrop.ondrop = (ev) => {
	ev.preventDefault();
	if (audioFormatDrop.childElementCount)
		return;
	const el = document.getElementById(ev.dataTransfer.getData('id'));
	if (el.dataset.type !== 'audio')
		return alert('this is not an audio format!');
	audioFormatDrop.appendChild(cloneTableRow(el));
	dlButton.hidden = false;
};

// delete a row if it wasnt dragged from the table
document.ondragover = (ev) => ev.preventDefault();
document.ondrop = (ev) => {
	ev.preventDefault();
	const el = document.getElementById(ev.dataTransfer.getData('id'));
	console.log(el.parentElement);
	if (el.parentElement === tableBody) return;
	el.remove();
	if (!audioFormatDrop.childElementCount && !videoFormatDrop.childElementCount)
		dlButton.hidden = true;
};

/** @type {HTMLButtonElement} */
export const dlButton = document.getElementById('dl-button');

/** @type {HTMLTableSectionElement} */
export const tableBody = document.getElementById('table-body');

/** @type {HTMLInputElement} */
export const ytIdOrUrl = document.getElementById('yt-id-or-url');

export const details = Object.freeze({
	/** @type {HTMLImageElement} */
	thumbnail: document.getElementById('details-thumbnail'),
	
	title: document.getElementById('details-title'),
	
	/** @type {HTMLDivElement} */
	channel: document.getElementById('details-channel'),
	
	/** @type {HTMLDivElement} */
	viewsLength: document.getElementById('details-views-length'),
	
	/** @type {HTMLDivElement} */
	id: document.getElementById('details-id')
});
