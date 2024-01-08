import express from "express";
import { readFileSync } from "fs";
import httpProxy from "http-proxy";
import { argv, exit } from "process";

if (argv.length < 3 || argv.length > 5) {
	console.error("Required args: <port> [<key_file> <cert_file>]");
	exit(1);
}

const port = Number.parseInt(argv[2]);
const keyPath = argv[3];
const certPath = argv[4];

/** @type {{ [_: string]: number }} */
const PORT_MAP = {
	chat: 7000
};

/** @param {http.IncomingMessage} */
const resolvePort = ({ url }) => {
	/** @type {string} */
	const path = url.replaceAll(/\/\/+/g, "/");
	let secondSlashIndex = path.indexOf("/", 1);
	if (secondSlashIndex === -1)
		secondSlashIndex = path.length;
	const firstComponent = path.substring(1, secondSlashIndex);
	return PORT_MAP[firstComponent];
};

const app = express();
const proxy = httpProxy.createProxyServer();

app.use(express.static("public"));
app.use((req, res) => {
	const port = resolvePort(req);
	if (!port)
		res.sendFile("index.html");
	else
		proxy.web(req, res, { target: `http://localhost:${port}` });
});

proxy.on("error", (err) => console.error("Proxy Error:", err));

const server = (keyPath && certPath)
	? (await import("https")).createServer(
		{ key: readFileSync(keyPath), cert: readFileSync(certPath) }, app)
	: (await import("http")).createServer(app);

server.listen(port, () => console.log(`trustytrojan.dev: listening on port ${port}`));
