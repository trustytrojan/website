import { createElement } from '../utils/elements.js';
import { searchResults, srLoading, ytSearchQuery } from './search-elements.js';
import * as yts from '../youtube-search-api.js';

const displaySearchResults = (results) => {
	for (const { title, channel, lengthText, thumbnails, id, live, viewsText } of results)
		searchResults.append(
			createElement('div', {
				className: 'search-result tt-border',
				href: `https://youtu.be/${id}`
			}, [
				createElement('img', {
					src: thumbnails ? thumbnails[0].url : null,
					className: 'sr-thumbnail'
				}),
				createElement('div', { className: 'sr-metadata' }, [
					createElement('b', { innerHTML: title }),
					createElement('div', { innerHTML: channel.title }),
					createElement('div', { innerHTML: `${viewsText.short} • ${live ? 'live!' : lengthText}` }),
					createElement('div', { innerHTML: id, className: 'sr-id' }),
				]),
				createElement('div', { className: 'tt-vert sr-btns' }, [
					createElement('a', {
						className: 'tt-clickable',
						href: `/yt/dl?v=${id}`
					}, [createElement('img', { src: '/res/img/download-icon.png' })]),
					createElement('a', {
						className: 'tt-clickable',
						href: `https://youtu.be/${id}`
					}, [createElement('img', { src: 'https://youtube.com/s/desktop/375de707/img/favicon_32x32.png' })])
				])
			])
		);
};

let nextPageCtx;

export const search = async () => {
	srLoading.hidden = false;
	searchResults.replaceChildren();
	const { results, nextPageCtx: npCtx } = await yts.search(ytSearchQuery.value, 'video');
	nextPageCtx = npCtx;
	displaySearchResults(results);
	document.getElementById('sr-container').style.display = 'flex';
	srLoading.hidden = true;
};

export const nextPage = async () => {
	const results = await yts.nextPage(nextPageCtx);
	displaySearchResults(results);
};