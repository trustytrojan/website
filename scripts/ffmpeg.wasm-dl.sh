DEST_DIR='public/res/js/@ffmpeg'

dl() {
	mkdir -p $DEST_DIR/$1
	curl "https://registry.npmjs.org/@ffmpeg/$1/-/$1-$2.tgz" | tar -xzC "$DEST_DIR/$1"
}

dl ffmpeg 0.12.10
dl util 0.12.1
dl core-mt 0.12.6
unset dl
