import { createElement } from '../utils/elements.js';
import * as els from './dl-fw-elements.js';
import ffmpegDl from './ffmpeg-dl.js';
import { max } from '../utils/arrays.js';
import * as ytdl from '../ytdl-core/lib/info.js';

// let baseHref;
let formats, details;

/**
 * @param {string | number} seconds 
 */
const secondsToHms = (seconds) => {
	if (seconds < 0)
		throw TypeError('seconds must be nonnegative');
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	const pad = (x) => String(x).padStart(2, '0');
	return (h > 0)
		? `${h}:${pad(m)}:${pad(s)}`
		: `${m}:${pad(s)}`;
};

/**
 * @param {string | number} n 
 */
const threeDigitAbbreviation = (n) => {
	const abbreviations = ['', 'K', 'M', 'B', 'T'];
	const suffixIndex = Math.floor(Math.log10(n) / 3);
	const abbreviatedNumber = (n / Math.pow(1000, suffixIndex)).toFixed(0);
	return abbreviatedNumber + abbreviations[suffixIndex];
};

const extendFormat = (format) => {
	const bitrateKbps = format.hasVideo
		? Math.round((format.averageBitrate || format.bitrate) / 1000)
		: format.audioBitrate;
	format.bitrateKbpsText = `${bitrateKbps}kbps`;
	format.type = (format.hasVideo && format.hasAudio)
		? 'av'
		: (format.hasVideo ? 'video' : 'audio');
};

/** @type {Record<string, HTMLDivElement?>} */
const selectedFormat = Object.preventExtensions({ audio: null, video: null, av: null });

/**
 * @param {HTMLElement} 
 */
const itagFromId = ({ id }) => {
	const split = id.split('-');
	return split[split.length - 1];
};

const clearFfmpegOutput = () => {
	els.ffmpegOutput.hidden = false;
	els.ffmpegOutput.innerHTML = '';
};

const onLog = ({ message }) => els.ffmpegOutput.innerHTML += message;

const updateDlButton = () => {
	const { audio, video, av } = selectedFormat;
	els.dlButton.disabled = false;
	if (av)
		els.dlButton.onclick = () => {
			clearFfmpegOutput();
			const itag = itagFromId(av);
			ffmpegDl(formats.filter(f => f.itag === itag), details, onLog);
		};
	else if (audio || video) {
		if (audio && video)
			els.dlButton.onclick = () => {
				clearFfmpegOutput();
				const audioItag = itagFromId(audio);
				const videoItag = itagFromId(video);
				ffmpegDl(formats.filter(f => f.itag === audioItag || f.itag === videoItag), details, onLog);
			};
		else {
			if (audio)
				els.dlButton.onclick = () => {
					clearFfmpegOutput();
					const audioItag = itagFromId(audio);
					ffmpegDl(formats.filter(f => f.itag === audioItag), details, onLog);
				};
			if (video)
				els.dlButton.onclick = () => {
					clearFfmpegOutput();
					const videoItag = itagFromId(video);
					ffmpegDl(formats.filter(f => f.itag === videoItag), details, onLog);
				};
		}
	} else
		els.dlButton.disabled = true;
};

const createTableRow = (
	{ itag, type, codecs, hasVideo, bitrateKbpsText, qualityLabel, audioQuality, url },
	{ videoId }
) => {
	const el = createElement('tr', {
		id: `${videoId}-${itag}`,

		// easiest way to catch right-clicks
		oncontextmenu: (ev) => {
			ev.preventDefault();
			navigator.clipboard.writeText(url).then(() => els.copiedPopup.showAt(ev));
		},

		onclick: () => {
			// get references to currently selected formats
			let { audio, video, av } = selectedFormat;

			if (selectedFormat[type] === el) {
				// if this format is already selected, de-select it
				el.classList.remove('selected-format');
				selectedFormat[type] = null;
			} else {
				// keep mutual exclusivity
				if (type === 'av') {
					audio?.classList.remove('selected-format');
					video?.classList.remove('selected-format');
					selectedFormat.audio = null;
					selectedFormat.video = null;
				} else {
					av?.classList.remove('selected-format');
					selectedFormat.av = null;
				}

				// select self, deselect other
				el.classList.add('selected-format');
				selectedFormat[type]?.classList.remove('selected-format');
				selectedFormat[type] = el;
			}

			updateDlButton();
		},
	}, [
		createElement('td', { innerText: itag }),
		createElement('td', { innerText: hasVideo ? qualityLabel : audioQuality.split('_')[2].toLowerCase() }),
		createElement('td', { innerText: (type === 'av') ? codecs.replace(', ', '\n') : codecs }),
		createElement('td', { innerText: bitrateKbpsText })
	]);
	return el;
};

// const baseUrl = 'https://api.trustytrojan.dev';

export const getInfo = async () => {
	const idOrUrl = els.ytIdOrUrl.value;
	if (!idOrUrl.length) return;

	els.loading.hidden = false;
	els.everythingElse.style.display = 'none';
	els.videoTb.replaceChildren();
	els.audioTb.replaceChildren();
	for (const k in selectedFormat)
		selectedFormat[k] = null;
	updateDlButton();

	({ formats, videoDetails: details } = await ytdl.getInfo(idOrUrl));

	els.details.root.href = `https://youtu.be/${details.videoId}`;
	els.details.thumbnail.src = details.thumbnails[0].url;
	els.details.title.innerHTML = details.title;
	els.details.channel.innerHTML = details.ownerChannelName;
	els.details.viewsLength.innerHTML = `${threeDigitAbbreviation(details.viewCount)} views • ${secondsToHms(details.lengthSeconds)}`;

	for (const format of formats) {
		extendFormat(format);
		els[format.type + 'Tb'].append(createTableRow(format, details));
	}

	const hqa = max(formats.filter(f => f.type === 'audio'), f => f.audioBitrate);
	const hqv = max(formats.filter(f => f.type === 'video'), f => f.bitrate);

	els.hqBtn.onclick = () => {
		clearFfmpegOutput();
		ffmpegDl([hqa, hqv], details, onLog);
	};

	els.hqaBtn.onclick = () => {
		clearFfmpegOutput();
		ffmpegDl([hqa], details, onLog);
	};

	els.hqvBtn.onclick = () => {
		clearFfmpegOutput();
		ffmpegDl([hqv], details, onLog);
	};

	els.everythingElse.style.display = 'flex';
	els.loading.hidden = true;
};
