from http.server import SimpleHTTPRequestHandler, HTTPServer

class CustomHandler(SimpleHTTPRequestHandler):
	def end_headers(self):
		self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
		self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
		super().end_headers()

if __name__ == '__main__':
	from sys import argv
	PORT = int(argv[1]) if len(argv) >= 2 else 8000
	print(f'Serving on port {PORT}')
	HTTPServer(('', PORT), CustomHandler).serve_forever()
