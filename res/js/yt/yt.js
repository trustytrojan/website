import { createElement } from '../utils/elements.js';
import { player, searchResults, srLoading, ytSearch } from './elements.js';

const displaySearchResults = (results) => {
	for (const { title, channel, lengthText, thumbnails, id, live, viewsText } of results)
		searchResults.append(
			createElement('div', { className: 'search-result tt-border' }, [
				createElement('img', { src: thumbnails ? thumbnails[0].url : null, className: 'sr-thumbnail' }),
				createElement('div', { className: 'sr-metadata' }, [
					createElement('b', { innerHTML: title }),
					createElement('div', { innerHTML: channel.title }),
					createElement('div', { innerHTML: `${viewsText.short} • ${live ? 'live!' : lengthText}` }),
					createElement('div', { innerHTML: id, className: 'sr-id' }),
				]),
				createElement('div', { className: 'tt-vert sr-btns' }, [
					createElement('img', {
						src: 'res/img/play-icon.png',
						className: 'tt-clickable',
						onclick: () => {
							player.src = baseUrl + `/stream/${encodeURIComponent(id)}`;
							player.hidden = false;
							document.title = title;
						}
					}),
					createElement('img', {
						src: 'res/img/download-icon.png',
						className: 'tt-clickable',
						onclick: () => createElement('a', { href: `${baseUrl}/stream/${id}?dl=1` }).click()
					})
				])
			])
		);
};

const baseUrl = 'https://api.trustytrojan.dev/yt';
let nextPageCtx;

export const search = async () => {
	srLoading.hidden = false;
	searchResults.replaceChildren();
	const query = encodeURIComponent(ytSearch.value);
	const url = `${baseUrl}/search/${query}?type=video`;
	const { results, nextPageCtx: npCtx } = await fetch(url).then(r => r.json());
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