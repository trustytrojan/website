// NewPipeExtractor regexps
const DECIPHER_NAME_REGEXPS = [
	'\\bm=([a-zA-Z0-9$]{2,})\\(decodeURIComponent\\(h\\.s\\)\\);',
	'\\bc&&\\(c=([a-zA-Z0-9$]{2,})\\(decodeURIComponent\\(c\\)\\)',
	'(?:\\b|[^a-zA-Z0-9$])([a-zA-Z0-9$]{2,})\\s*=\\s*function\\(\\s*a\\s*\\)\\s*\\{\\s*a\\s*=\\s*a\\.split\\(\\s*""\\s*\\)',
	'([\\w$]+)\\s*=\\s*function\\((\\w+)\\)\\{\\s*\\2=\\s*\\2\\.split\\(""\\)\\s*;',
];

// LavaPlayer regexps
const VARIABLE_PART = '[a-zA-Z_\\$][a-zA-Z_0-9]*';
const VARIABLE_PART_DEFINE = `\\"?${VARIABLE_PART}\\"?`;
const BEFORE_ACCESS = '(?:\\[\\"|\\.)';
const AFTER_ACCESS = '(?:\\"\\]|)';
const VARIABLE_PART_ACCESS = BEFORE_ACCESS + VARIABLE_PART + AFTER_ACCESS;
const REVERSE_PART = ':function\\(a\\)\\{(?:return )?a\\.reverse\\(\\)\\}';
const SLICE_PART = ':function\\(a,b\\)\\{return a\\.slice\\(b\\)\\}';
const SPLICE_PART = ':function\\(a,b\\)\\{a\\.splice\\(0,b\\)\\}';
const SWAP_PART = ':function\\(a,b\\)\\{' +
	'var c=a\\[0\\];a\\[0\\]=a\\[b%a\\.length\\];a\\[b(?:%a.length|)\\]=c(?:;return a)?\\}';

const DECIPHER_REGEXP = `function(?: ${VARIABLE_PART})?\\(a\\)\\{` +
	`a=a\\.split\\(""\\);\\s*` +
	`((?:(?:a=)?${VARIABLE_PART}${VARIABLE_PART_ACCESS}\\(a,\\d+\\);)+)` +
	`return a\\.join\\(""\\)` +
	`\\}`;

const HELPER_REGEXP = `var (${VARIABLE_PART})=\\{((?:(?:${VARIABLE_PART_DEFINE}${REVERSE_PART}|${VARIABLE_PART_DEFINE}${SLICE_PART}|${VARIABLE_PART_DEFINE}${SPLICE_PART}|${VARIABLE_PART_DEFINE}${SWAP_PART}),?\\n?)+)\\};`;

const N_TRANSFORM_REGEXP = 'function\\(\\s*(\\w+)\\s*\\)\\s*\\{' +
	'var\\s*(\\w+)=(?:\\1\\.split\\(""\\)|String\\.prototype\\.split\\.call\\(\\1,""\\)),' +
	'\\s*(\\w+)=(\\[.*?]);\\s*\\3\\[\\d+]' +
	'(.*?try)(\\{.*?})catch\\(\\s*(\\w+)\\s*\\)\\s*\\' +
	'{\\s*return"enhanced_except_([A-z0-9-]+)"\\s*\\+\\s*\\1\\s*}' +
	'\\s*return\\s*(\\2\\.join\\(""\\)|Array\\.prototype\\.join\\.call\\(\\2,""\\))};';

const DECIPHER_ARGUMENT = 'sig';
const N_ARGUMENT = 'ncode';

const matchRegex = (regex, str) => {
	const match = str.match(new RegExp(regex, 's'));
	if (!match) throw new Error(`Could not match ${regex}`);
	return match;
};

const matchFirst = (regex, str) => matchRegex(regex, str)[0];

const matchGroup1 = (regex, str) => matchRegex(regex, str)[1];

const getFuncName = (body, regexps) => {
	let fn;
	for (const regex of regexps) {
		try {
			fn = matchGroup1(regex, body);
			const idx = fn.indexOf('[0]');
			if (idx > -1)
				fn = matchGroup1(`${fn.substring(idx, 0).replace(/\$/g, '\\$')}=\\[([a-zA-Z0-9$\\[\\]]{2,})\\]`, body);
			break;
		} catch {
			continue;
		}
	}
	if (!fn || fn.includes('[')) throw Error();
	return fn;
};

const DECIPHER_FUNC_NAME = 'DisTubeDecipherFunc';
const extractDecipherFunc = (body) => {
	try {
		const helperObject = matchFirst(HELPER_REGEXP, body);
		const decipherFunc = matchFirst(DECIPHER_REGEXP, body);
		const resultFunc = `var ${DECIPHER_FUNC_NAME}=${decipherFunc};`;
		const callerFunc = `${DECIPHER_FUNC_NAME}(${DECIPHER_ARGUMENT});`;
		return helperObject + resultFunc + 'return ' + callerFunc;
	} catch {
		return null;
	}
};

const extractDecipherWithName = (body) => {
	try {
		const decipherFuncName = getFuncName(body, DECIPHER_NAME_REGEXPS);
		const funcPattern = `(${decipherFuncName.replace(/\$/g, '\\$')}=function\\([a-zA-Z0-9_]+\\)\\{.+?\\})`;
		const decipherFunc = `var ${matchGroup1(funcPattern, body)};`;
		const helperObjectName = matchGroup1(';([A-Za-z0-9_\\$]{2,})\\.\\w+\\(', decipherFunc);
		const helperPattern = `(var ${helperObjectName.replace(/\$/g, '\\$')}=\\{[\\s\\S]+?\\}\\};)`;
		const helperObject = matchGroup1(helperPattern, body);
		const callerFunc = `${decipherFuncName}(${DECIPHER_ARGUMENT});`;
		return helperObject + decipherFunc + 'return ' + callerFunc;
	} catch {
		return null;
	}
};

const getExtractFunctions = (extractFunctions, body) => {
	for (const extractFunction of extractFunctions) {
		try {
			const func = extractFunction(body);
			if (!func) continue;
			return new Function('sig', 'ncode', func);
		} catch {
			continue;
		}
	}
	return null;
};

let decipherWarning = false;
const extractDecipher = (body) => {
	const decipherFunc = getExtractFunctions([extractDecipherWithName, extractDecipherFunc], body);
	if (!decipherFunc && !decipherWarning) {
		console.warn('\x1b[33mWARNING:\x1B[0m Could not parse decipher function.\nStream URL will be missing.');
		decipherWarning = true;
	}
	return decipherFunc;
};

const N_TRANSFORM_FUNC_NAME = 'DisTubeNTransformFunc';
const extractNTransformFunc = (body) => {
	try {
		const nFunc = matchFirst(N_TRANSFORM_REGEXP, body);
		const resultFunc = `var ${N_TRANSFORM_FUNC_NAME}=${nFunc}`;
		const callerFunc = `${N_TRANSFORM_FUNC_NAME}(${N_ARGUMENT});`;
		return resultFunc + 'return ' + callerFunc;
	} catch {
		return null;
	}
};

let nTransformWarning = false;
const extractNTransform = (body) => {
	const nTransformFunc = getExtractFunctions([extractNTransformFunc], body);
	if (!nTransformFunc && !nTransformWarning) {
		console.warn('\x1b[33mWARNING:\x1B[0m Could not parse n transform function.\nStream URL may be slow but still works.');
		nTransformWarning = true;
	}
	return nTransformFunc;
};

const extractFunctions = (body) => [
	extractDecipher(body),
	extractNTransform(body),
];

const getFunctions = async (html5playerfile) => {
	const body = await (await fetch(html5playerfile)).text();
	return extractFunctions(body);
};

const setDownloadURL = (format, decipherScript, nTransformScript) => {
	if (!decipherScript) return;
	const decipher = url => {
		const args = Object.fromEntries(new URLSearchParams(url).entries());
		if (!args.s) return args.url;
		const components = new URL(decodeURIComponent(args.url));
		components.searchParams.set(args.sp || 'sig', decipherScript(decodeURIComponent(args.s)));
		return components.toString();
	};
	const nTransform = url => {
		const components = new URL(decodeURIComponent(url));
		const n = components.searchParams.get('n');
		if (!n || !nTransformScript) return url;
		components.searchParams.set('n', nTransformScript(undefined, n));
		return components.toString();
	};
	const cipher = !format.url;
	const url = format.url || format.signatureCipher || format.cipher;
	format.url = cipher ? nTransform(decipher(url)) : nTransform(url);
	delete format.signatureCipher;
	delete format.cipher;
};

export const decipherFormats = async (formats, html5player, options) => {
	const funcs = await getFunctions(html5player, options);
	for (const format of formats)
		setDownloadURL(format, ...funcs);
};
