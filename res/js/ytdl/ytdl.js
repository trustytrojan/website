import { createElement } from '../utils/elements.js';
import * as els from './elements.js';

const typeStr = (format) =>
	(format.hasVideo && format.hasAudio)
		? 'a/v'
		: (format.hasVideo ? 'video' : 'audio');

const getBitrateKbps = (format) => format.hasVideo ? Math.round((format.averageBitrate || format.bitrate) / 1000) : format.audioBitrate;

const createTableRow = (format, details) => {
	const id = `${details.videoId}-${format.itag}`;
	const el = createElement('tr', {
		draggable: true, id,
		dataset: {
			type: typeStr(format),
			itag: format.itag
		},
		ondragstart: (ev) => ev.dataTransfer.setData('id', id)
	}, [
		createElement('td', { innerHTML: typeStr(format) }),
		createElement('td', { innerHTML: format.hasVideo ? format.qualityLabel : format.audioQuality.split('_')[2].toLowerCase() }),
		createElement('td', { innerHTML: format.codecs }),
		createElement('td', { innerHTML: `${getBitrateKbps(format)}kbps` })
	]);
	return el;
}

// const baseUrl = `https://api.trustytrojan.dev`;
const baseUrl = `http://localhost:3000`;
let _details, videoId;

export const getInfo = async () => {
	const idOrUrl = els.ytIdOrUrl.value;
	if (!idOrUrl.length) return;
	const url = `${baseUrl}/yt/info/${encodeURIComponent(idOrUrl)}`;
	const { formats, details } = await (await fetch(url)).json();
	els.details.title.innerHTML = details.title;
	els.details.channel.innerHTML = details.ownerChannelName;
	els.details.viewsLength.innerHTML = `${details.viewCount} views • ${Math.floor(details.lengthSeconds / 60)}:${details.lengthSeconds % 60}`;
	els.details.id.innerHTML = videoId = details.videoId;
	els.details.thumbnail.src = details.thumbnails[0].url;
	for (const format of formats)
		els.tableBody.append(createTableRow(format, details));
	document.getElementById('everything-else').style.display = 'flex';
	_details = {
		title: details.title,
		ownerChannelName: details.ownerChannelName,
		publishDate: details.publishDate,
		lengthSeconds: details.lengthSeconds
	};
};

export const ffmpegDl = async () => {
	const itags = [
		els.videoFormatDrop.firstElementChild?.dataset.itag,
		els.audioFormatDrop.firstElementChild?.dataset.itag
	].filter(x => x).map(x => `itags=${x}`).join('&');
	createElement('a', {
		href: `${baseUrl}/yt/dl/${videoId}?${itags}`,
		download: `${_details.title} - ${_details.ownerChannelName}.mkv`
	}).click();
};
