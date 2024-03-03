import { createElement } from '../utils/elements.js';
import { player, searchResults, srLoading, ytSearch } from './elements.js';
import * as yts from './search.js';
import dl from './dl.js';

/**
 * @param {yts.VideoResult[]} results 
 */
const displaySearchResults = (results) => {
	for (const { title, channelTitle, length, thumbnails, id, live, viewsText } of results)
		searchResults.append(
			createElement('div', {
				className: 'search-result tt-border',
			}, [
				createElement('img', { src: thumbnails ? thumbnails[0].url : null, className: 'sr-thumbnail' }),
				createElement('div', { className: 'sr-metadata' }, [
					createElement('b', { innerHTML: title }),
					createElement('div', { innerHTML: channelTitle }),
					createElement('div', { innerHTML: `${viewsText.short} • ${live ? 'live!' : length}` }),
					createElement('div', { innerHTML: id, className: 'sr-id' }),
				]),
				createElement('div', { className: 'tt-vert sr-btns' }, [
					createElement('img', {
						src: 'res/img/play-icon.png',
						className: 'tt-clickable',
						onclick: () => stream(id, title)
					}),
					createElement('img', {
						src: 'res/img/download-icon.png',
						className: 'tt-clickable',
						onclick: () => dl(id)
					})
				])
			])
		);
};

export const stream = async (idOrUrl, title) => {
	player.src = `https://api.trustytrojan.dev/yt/stream/${encodeURIComponent(idOrUrl)}`;
	player.hidden = false;
	document.title = title;
};

/** @type {yts.Search} */
let _search;

export const search = async () => {
	srLoading.hidden = false;
	searchResults.replaceChildren();
	_search = new yts.Search(ytSearch.value, { type: 'video' });
	await _search.getResults().then(displaySearchResults);
	document.getElementById('sr-container').style.display = 'flex';
	srLoading.hidden = true;
};

export const nextPage = () => _search.getNextPage().then(displaySearchResults);
