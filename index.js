import express from "express";
import https from "https";
import http from "http";
import fs from "fs";

const app = express();

/** @type {{ [_: string]: number }} */
const PORT_MAP = {
	chat: 7000
};

// to serve the homepage
app.use(express.static("public"));

app.get("*", (req, res) => {
	/** @type {string} */
	// remove duplicate slashes between path components
	const path = req.url.replaceAll(/\/\/+/g, "/");
	const secondSlash = path.indexOf("/", 1);
	const firstComponent = path.substring(0, secondSlash);
	const rest = path.substring(secondSlash);
	const port = PORT_MAP[firstComponent];
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
