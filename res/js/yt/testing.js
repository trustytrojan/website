import { getInfo } from '../tt-ytdl-core/info.js';
import { highestBitrate, audioOnly, videoOnly } from '../tt-ytdl-core/format-filters.js';
import { player, audioPlayer } from './elements.js';

window.separateElements = async () => {
	const { formats } = await getInfo('05MQCSWV4fU');
	const audioFormat = highestBitrate(audioOnly(formats));
	const videoFormat = highestBitrate(videoOnly(formats));
	audioPlayer.src = audioFormat.url;
	player.src = videoFormat.url;
};
