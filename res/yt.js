/** @type {HTMLVideoElement} */
const player = document.getElementById('player');
player.onresize = () => player.classList[document.fullscreenElement ? 'remove' : 'add']('tt-border')

/** @type {HTMLDivElement} */
const searchResults = document.getElementById('search-results');

/** @type {HTMLInputElement} */
const ytSearch = document.getElementById('yt-search');

/** @type {HTMLDivElement} */
const srLoading = document.getElementById('sr-loading');

const appendSearchResults = (items) => {
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

const yt = {
	baseUrl: 'https://api.trustytrojan.dev/yt',
	nextpageObj: null,

	/**
	 * @param {string} idOrUrl 
	 * @param {string} title
	 */
	async stream(idOrUrl, title) {
		player.src = `${this.baseUrl}/stream/${encodeURIComponent(idOrUrl)}`;
		player.hidden = false;
		document.title = title;
	},

	async search() {
		srLoading.hidden = false;
		searchResults.replaceChildren();
		const query = encodeURIComponent(ytSearch.value);
		const url = `${this.baseUrl}/search/${query}?type=video`;
		const { items, nextPage } = await (await fetch(url)).json();
		this.nextpageObj = nextPage;
		appendSearchResults(items);
		document.getElementById('sr-container').style.display = 'flex';
		srLoading.hidden = true;
	},

	async nextpage() {
		const url = `${this.baseUrl}/search/nextpage`;
		const init = {
			method: 'POST',
			body: JSON.stringify(this.nextpageObj),
			headers: {
				'Content-Type': 'application/json'
			}
		};
		console.log(init);
		const { items, nextPage } = await (await fetch(url, init)).json();
		this.nextpageObj = nextPage;
		appendSearchResults(items);
	}
};
