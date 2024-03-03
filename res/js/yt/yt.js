import { createElement } from '../utils/elements.js';
import { player, searchResults, srLoading, ytSearch } from './elements.js';

const displaySearchResults = (items) => {
	for (const { title, channelTitle, length, thumbnails, id, isLive } of items) {
		const thumbnail = createElement('img', { src: thumbnails ? thumbnails[0].url : null, className: 'sr-thumbnail' })
		searchResults.append(
			createElement('div', {
				className: 'search-result tt-clickable',
				onclick: (ev) => {
					if (ev.target !== ev.currentTarget)
						return;
					yt.stream(id, title);
					scrollTo({ top: 0, behavior: 'smooth' })
				}
			}, [
				thumbnail,
				createElement('div', { className: 'sr-metadata' }, [
					createElement('b', { innerHTML: title }),
					createElement('div', { innerHTML: channelTitle }),
					createElement('div', { innerHTML: isLive ? '(Live)' : length.text }),
					createElement('div', { innerHTML: id, className: 'sr-id' })
				])
			])
		);
	}
};

const baseUrl = 'https://api.trustytrojan.dev/yt';
let nextpageObj;

export const stream = async (idOrUrl, title) => {
	player.src = `${baseUrl}/stream/${encodeURIComponent(idOrUrl)}`;
	player.hidden = false;
	document.title = title;
};

export const search = async () => {
	srLoading.hidden = false;
	searchResults.replaceChildren();
	const query = encodeURIComponent(ytSearch.value);
	const url = `${baseUrl}/search/${query}?type=video`;
	const { items, nextPage } = await fetch(url).then(r => r.json());
	nextpageObj = nextPage;
	displaySearchResults(items);
	document.getElementById('sr-container').style.display = 'flex';
	srLoading.hidden = true;
};

export const nextpage = async () => {
	const url = `${baseUrl}/search/nextpage`;
	const init = {
		method: 'POST',
		body: JSON.stringify(nextpageObj),
		headers: { 'Content-Type': 'application/json' }
	};
	const { items, nextPage } = await fetch(url, init).then(r => r.json());
	nextpageObj = nextPage;
	displaySearchResults(items);
};
