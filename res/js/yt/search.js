import { createElement } from '../utils/elements.js';
import { searchResults, srLoading, ytSearchQuery } from './search-elements.js';

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

const baseUrl = 'https://api.trustytrojan.dev/yt';
let nextPageCtx;

export const search = async () => {
	srLoading.hidden = false;
	searchResults.replaceChildren();
	const url = `${baseUrl}/search/?q=${encodeURIComponent(ytSearchQuery.value)}&type=video`;
	const { results, nextPageCtx: npCtx } = await (await fetch(url)).json();
	nextPageCtx = npCtx;
	displaySearchResults(results);
	document.getElementById('sr-container').style.display = 'flex';
	srLoading.hidden = true;
};

export const nextPage = async () => {
	const url = baseUrl + '/search/nextpage';
	const init = {
		method: 'POST',
		body: JSON.stringify(nextPageCtx),
		headers: { 'Content-Type': 'application/json' }
	};
	const { results, nextPageCtx: npCtx } = await (await fetch(url, init)).json();
	nextPageCtx = npCtx;
	displaySearchResults(results);
};