const baseUrl = 'https://proxy.trustytrojan.dev/?uri=';

export const wrapUrl = (url) => `${baseUrl}${encodeURIComponent(url)}`;

/**
 * @param {string} url 
 * @param {RequestInit} [init] 
 */
export default (url, init) => fetch(wrapUrl(url), init);
