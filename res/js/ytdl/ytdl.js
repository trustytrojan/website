import { createElement } from '../utils/elements.js';
import { max } from '../utils/arrays.js';
import * as els from './elements.js';

let videoId;

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

const updateDlButton = () => {
	const { audio, video, av } = selectedFormat;
	if (av) {
		els.dlButton.classList.remove('dl-btn-disabled');
		els.dlButton.href = `${baseUrl}/yt/dl/${videoId}?itags=${av.id.split('-')[1]}`;
	} else if (audio || video) {
		els.dlButton.classList.remove('dl-btn-disabled');
		if (audio && video)
			els.dlButton.href = `${baseUrl}/yt/dl/${videoId}?itags=${audio.id.split('-')[1]},${video.id.split('-')[1]}`;
		else if (audio)
			els.dlButton.href = `${baseUrl}/yt/dl/${videoId}?itags=${audio.id.split('-')[1]}`;
		else if (video)
			els.dlButton.href = `${baseUrl}/yt/dl/${videoId}?itags=${video.id.split('-')[1]}`;
	} else {
		els.dlButton.classList.add('dl-btn-disabled');
		els.dlButton.href = '';
	}
};

const createTableRow = (
	{ itag, type, codecs, hasVideo, bitrateKbpsText, qualityLabel, audioQuality },
	{ videoId }
) => {
	const el = createElement('tr', {
		className: 'tt-hover',
		id: `${videoId}-${itag}`,
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
		createElement('td', { innerHTML: itag }),
		createElement('td', { innerHTML: hasVideo ? qualityLabel : audioQuality.split('_')[2].toLowerCase() }),
		createElement('td', { innerHTML: codecs }),
		createElement('td', { innerHTML: bitrateKbpsText })
	]);
	return el;
};

const baseUrl = 'https://api.trustytrojan.dev';

export const getInfo = async () => {
	const idOrUrl = els.ytIdOrUrl.value;
	if (!idOrUrl.length) return;

	els.videoTb.replaceChildren();
	els.audioTb.replaceChildren();
	selectedFormat.av = null;

	const url = `${baseUrl}/yt/info/${encodeURIComponent(idOrUrl)}`;
	const { formats, details } = await (await fetch(url)).json();

	({ videoId } = details);
	els.details.root.href = `https://youtu.be/${videoId}`;
	els.details.thumbnail.src = details.thumbnails[0].url;
	els.details.title.innerHTML = details.title;
	els.details.channel.innerHTML = details.ownerChannelName;
	els.details.viewsLength.innerHTML = `${details.viewCount} views • ${Math.floor(details.lengthSeconds / 60)}:${details.lengthSeconds % 60}`;

	for (const format of formats) {
		extendFormat(format);
		els[format.type + 'Tb'].append(createTableRow(format, details));
	}

	const highestVideo = document.getElementById(`${videoId}-${max(formats, format => format.bitrate).itag}`);
	const highestAudio = document.getElementById(`${videoId}-${max(formats, format => format.audioBitrate).itag}`);
	highestVideo.classList.add('selected-format');
	highestAudio.classList.add('selected-format');
	selectedFormat.audio = highestAudio;
	selectedFormat.video = highestVideo;
	updateDlButton();

	document.getElementById('everything-else').style.display = 'flex';
};
