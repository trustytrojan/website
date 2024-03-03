import { max, min } from '../utils/arrays.js';

export const audioOnly = (formats) => formats.filter(format => !format.hasVideo && format.hasAudio);
export const videoOnly = (formats) => formats.filter(format => format.hasVideo && !format.hasAudio);
export const audioAndVideo = (formats) => formats.filter(format => format.hasVideo && format.hasAudio);
export const ofContainer = (formats, container) => formats.filter(format => format.mimeType.includes(container));

export const highestBitrate = (formats) => max(formats, format => format.bitrate);
export const lowestBitrate = (formats) => min(formats, format => format.bitrate);
export const bitrateClosestTo = (formats, bitrate) => min(formats, format => Math.abs(format.bitrate - bitrate));