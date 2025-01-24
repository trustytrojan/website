import { createElement } from '../utils/elements.js';
import { downloadWithProgress } from '../@ffmpeg/util/package/dist/esm/index.js';

const ffmpeg = new (await import('../@ffmpeg/ffmpeg/package/dist/esm/index.js')).FFmpeg;

export default async (formats, details, logFunc) => {
	ffmpeg.on('log', ({ message }) => logFunc(message));

	if (!ffmpeg.loaded)
		await ffmpeg.load();

	const onlyOneAudio = (formats.length === 1) && (formats[0].type === 'audio');
	const urls = formats.map(f => f.url);

	let promises = [];
	promises.push(downloadWithProgress(urls[0], console.log).then(f => ffmpeg.writeFile('f1', f)));
	urls[1] &&
		promises.push(downloadWithProgress(urls[1], console.log).then(f => ffmpeg.writeFile('f2', f)));
	logFunc('Downloading media...');
	await Promise.all(promises);

	await ffmpeg.exec([
		'-hide_banner',
		'-i', 'f1',
		...(urls[1] ? ['-i', 'f2'] : []),
		...(!onlyOneAudio ? ['-c', 'copy'] : []),
		'-metadata', `title=${details.title}`,
		'-metadata', `artist=${details.author}`,
		'-metadata', `date=${details.publishDate.substring(0, 10)}`,
		'-metadata', `duration=${details.lengthSeconds}`,
		'-f', (onlyOneAudio ? 'mp3' : 'matroska'),
		'output'
	]);

	const fileData = await ffmpeg.readFile('output');
	const blob = new Blob([fileData], { type: onlyOneAudio ? 'audio/mp3' : 'video/mkv' });
	createElement('a', {
		href: URL.createObjectURL(blob),
		download: `${details.title}.${onlyOneAudio ? 'mp3' : 'mkv'}`
	}).click();
};