const baseUrl = `https://www.youtube.com`;

/**
 * @param {string} url 
 */
const getInitData = async (url) => {
	let apiToken, context;
	const page = await fetch(encodeURI(url)).then(r => r.text());
	const ytInitData = page.split("var ytInitialData =");
	if (ytInitData.length === 1)
		throw new Error("ytInitialData not present in page");
	const data = ytInitData[1].split("</script>")[0].slice(0, -1);
	const itApiKey = page.split("innertubeApiKey");
	if (itApiKey.length > 1)
		apiToken = itApiKey[1].trim().split(",")[0].split('"')[2];
	const itCtx = page.split("INNERTUBE_CONTEXT");
	if (itCtx.length > 1)
		context = JSON.parse(itCtx[1].trim().slice(2, -2));
	return { initdata: JSON.parse(data), apiToken, context };
};

/**
 * @typedef {'video' | 'channel' | 'playlist' | 'movie'} SearchResultType
 */

/**
 * @typedef {object} SearchOptions
 * @prop {boolean} [withPlaylist]
 * @prop {number} [limit]
 * @prop {SearchResultType} [type]
 */

const srTypeMap = {
	video: 'AQ',
	channel: 'Ag',
	playlist: 'Aw',
	movie: 'BA'
};

/**
 * @param {string} keyword 
 * @param {SearchOptions} 
 */
export const search = async (keyword, { withPlaylist, limit, type } = {}) => {
	let endpoint = `${baseUrl}/results?search_query=${keyword}`;
	if (type) endpoint += `&sp=EgIQ${srTypeMap[type]}%3D%3D`;
	const page = await getInitData(endpoint);
	const { sectionListRenderer } = page.initdata.contents.twoColumnSearchResultsRenderer.primaryContents;

	let continuation = null;
	const results = [];

	for (const content of sectionListRenderer.contents)
		if (content.continuationItemRenderer)
			continuation = content.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
		else if (content.itemSectionRenderer)
			for (const item of content.itemSectionRenderer.contents)
				if (VideoResult.canConstruct(item))
					results.push(new VideoResult(item));
				else if (ChannelResult.canConstruct(item))
					results.push(new ChannelResult(item));
				else if (withPlaylist && PlaylistResult.canConstruct(item))
					results.push(new PlaylistResult(item));

	return {
		results: limit ? results.slice(0, limit) : results,
		nextPage: {
			token: page.apiToken,

			// nextPage sends this object as the body
			// YouTube expects this structure, do not touch
			context: { context: page.context, continuation }
		}
	};
};

/**
 * @typedef {object} NextPageOptions
 * @prop {boolean} [withPlaylist]
 * @prop {number} [limit]
 */

/**
 * @param nextPage 
 * @param {NextPageOptions} 
 */
export const nextPage = async (nextPage, { withPlaylist, limit } = {}) => {
	const url = `${baseUrl}/youtubei/v1/search?key=${nextPage.token}`;
	const init = { method: 'POST', body: JSON.stringify(nextPage.context) };
	const page = await fetch(url, init).then(r => r.json());
	const conitems = page.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems;
	const results = [];

	for (const conitem of conitems)
		if (conitem.continuationItemRenderer)
			nextPage.context.continuationToken = conitem.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
		else if (conitem.itemSectionRenderer)
			for (const item of conitem.itemSectionRenderer.contents)
				if (VideoResult.canConstruct(item))
					results.push(new VideoResult(item));
				else if (ChannelResult.canConstruct(item))
					results.push(new ChannelResult(item));
				else if (withPlaylist && PlaylistResult.canConstruct(item))
					results.push(new PlaylistResult(item));

	return {
		results: limit ? results.slice(0, limit) : results,
		nextPage
	};
};

export const getPlaylistData = async (playlistId, limit = 0) => {
	const endpoint = await `${baseUrl}/playlist?list=${playlistId}`;
	try {
		const initData = await getInitData(endpoint);
		const sectionListRenderer = await initData.initdata;
		const metadata = await sectionListRenderer.metadata;
		if (sectionListRenderer && sectionListRenderer.contents) {
			const videoItems = await sectionListRenderer.contents
				.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
				.sectionListRenderer.contents[0].itemSectionRenderer.contents[0]
				.playlistVideoListRenderer.contents;
			let items = await [];
			await videoItems.forEach((item) => {
				let videoRender = item.playlistVideoRenderer;
				if (videoRender && videoRender.videoId) {
					items.push(VideoRender(item));
				}
			});
			const itemsResult = limit != 0 ? items.slice(0, limit) : items;
			return await Promise.resolve({ items: itemsResult, metadata: metadata });
		} else {
			return await Promise.reject("invalid_playlist");
		}
	} catch (ex) {
		await console.error(ex);
		return await Promise.reject(ex);
	}
};

export const getChannelData = async (channelId) => {
	const endpoint = await `${youtubeEndpoint}/channel/${channelId}`;
	try {
		const page = await GetYoutubeInitData(endpoint);
		const tabs = page.initdata.contents.twoColumnBrowseResultsRenderer.tabs;
		const items = tabs
			.map((json) => {
				if (json && json.tabRenderer) {
					const tabRenderer = json.tabRenderer;
					const title = tabRenderer.title;
					const content = tabRenderer.content;
					return { title, content };
				}
			})
			.filter((y) => typeof y != "undefined");
		return await Promise.resolve(items);
	} catch (ex) {
		return await Promise.reject(ex);
	}
};

export const getHomePageShorts = async () => {
	const page = await getInitData(baseUrl);
	const shortResult =
		page.initdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents
			.filter((x) => {
				return x.richSectionRenderer;
			})
			.map((z) => z.richSectionRenderer.content)
			.filter((y) => y.richShelfRenderer)
			.map((u) => u.richShelfRenderer)
			.find((i) => i.title.runs[0].text == "Shorts");
	const res = shortResult.contents
		.map((z) => z.richItemRenderer)
		.map((y) => y.content.reelItemRenderer);
	return res.map((json) => ({
		id: json.videoId,
		type: "reel",
		thumbnail: json.thumbnail.thumbnails[0],
		title: json.headline.simpleText,
		inlinePlaybackEndpoint: json.inlinePlaybackEndpoint || {}
	}));
};

export const getHomePageVideos = async (limit = 0) => {
	const endpoint = await `${baseUrl}`;
	try {
		const page = await getInitData(endpoint);
		const sectionListRenderer = await page.initdata.contents
			.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
			.richGridRenderer.contents;
		let items = await [];
		let otherItems = await [];
		await sectionListRenderer.forEach((item) => {
			if (item.richItemRenderer && item.richItemRenderer.content) {
				let videoRender = item.richItemRenderer.content.videoRenderer;
				if (videoRender && videoRender.videoId) {
					items.push(VideoRender(item.richItemRenderer.content));
				} else {
					otherItems.push(videoRender);
				}
			}
		});
		const itemsResult = limit != 0 ? items.slice(0, limit) : items;
		return await Promise.resolve({ items: itemsResult });
	} catch (ex) {
		await console.error(ex);
		return await Promise.reject(ex);
	}
};

class VideoResult {
	/**
	 * @param {*} videoRenderer 
	 */
	static isLive({ badges, thumbnailOverlays }) {
		if (badges && badges[0]?.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW')
			return true;
		if (thumbnailOverlays)
			for (const item of thumbnailOverlays)
				if (item?.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE')
					return true;
		return false;
	}

	static canConstruct({ videoRenderer: vr, playlistVideoRenderer: pvr }) {
		return (vr || pvr)?.videoId;
	}

	type = 'video';

	constructor({ videoRenderer: vr, playlistVideoRenderer: pvr }) {
		vr ??= pvr;
		/** @type {string} */
		this.id = vr.videoId;
		this.thumbnails = vr.thumbnail.thumbnails;
		/** @type {string} */
		this.title = vr.title.runs[0].text;
		/** @type {string} */
		this.channelTitle = vr.ownerText?.runs ? vr.ownerText.runs[0].text : null;
		this.length = vr.lengthText;
		this.live = VideoResult.isLive(vr);
		Object.defineProperty(this, 'type', { writable: false });
	}
}

class ChannelResult {
	static canConstruct({ channelRenderer: cr }) {
		return cr;
	}

	type = 'channel';

	constructor({ channelRenderer: cr }) {
		/** @type {string} */
		this.id = cr.channelId;
		this.thumbnail = cr.thumbnail;
		/** @type {string} */
		this.title = cr.title.simpleText;
		Object.defineProperty(this, 'type', { writable: false });
	}
}

class PlaylistResult {
	static canConstruct({ playlistRenderer: pr }) {
		return pr && pr.playlistId;
	}

	type = 'playlist';

	constructor({ playlistRenderer: pr }) {
		/** @type {string} */
		this.id = pr.playlistId;
		this.thumbnail = pr.thumbnails;
		/** @type {string} */
		this.title = pr.title.simpleText;
		this.length = pr.videoCount;
		this.videos = pr.videos;
		this.videoCount = pr.videoCount;
		Object.defineProperty(this, 'type', { writable: false });
	}
}
