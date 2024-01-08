import express from "express";
import https from "https";
import http from "http";
import fs from "fs";

const app = express();

/** @type {{ [_: string]: number }} */
const PORT_MAP = {
	chat: 7000
};

app.use(express.static("public"));

app.get("*", (req, res) => {
	/** @type {string} */
	// remove duplicate slashes between path components
	let path = req.url.replaceAll(/\/\/+/g, "/");
	if (!path.endsWith("/"))
		path += "/";
	const secondSlashIndex = path.indexOf("/", 1);
	const firstComponent = path.substring(1, secondSlashIndex);
	const rest = path.substring(secondSlashIndex);
	console.log(rest);
	const port = PORT_MAP[firstComponent];
	console.log(port);
	if (!port)
		res.sendFile("index.html");
	else
		http.request({
			hostname: "localhost",
			port: port,
			path: rest,
			method: req.method,
			headers: req.headers,
		}, (proxyRes) => {
			res.writeHead(proxyRes.statusCode, proxyRes.headers);
			proxyRes.pipe(res);
		});
});

const server = https.createServer({
	key: fs.readFileSync("/etc/letsencrypt/live/trustytrojan.dev/privkey.pem"),
	cert: fs.readFileSync("/etc/letsencrypt/live/trustytrojan.dev/fullchain.pem"),
}, app);

server.listen(443, () => console.log("trustytrojan.dev: listening on port 443"));
