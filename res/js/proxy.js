/**
 * @param {string} url 
 * @param {RequestInit} [init] 
 */
export default (url, init) => fetch(`https://proxy.trustytrojan.dev/?uri=${encodeURIComponent(url)}`, init);