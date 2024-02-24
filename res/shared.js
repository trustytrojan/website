/**
 * @param {keyof HTMLElementTagNameMap} type
 * @param {HTMLElement | undefined} attributes
 * @param {HTMLElement[] | undefined} children
 */
const createElement = (type, attributes, children) => {
	const element = document.createElement(type);
	if (attributes)
		for (const key in attributes)
			element[key] = attributes[key];
	if (children)
		for (const child of children)
			element.append(child);
	return element;
};
