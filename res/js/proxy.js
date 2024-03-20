export const wrapUrl = (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

/**
 * @param {string} url 
 * @param {RequestInit} [init] 
 */
export default (url, init) => fetch(wrapUrl(url), init);