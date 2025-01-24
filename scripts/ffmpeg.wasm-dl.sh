# you only need to use this for easier development
# having the code locally provides vscode intellisense

DEST_DIR='public/res/js/@ffmpeg'

dl() {
	mkdir -p $DEST_DIR/$1
	curl "https://registry.npmjs.org/@ffmpeg/$1/-/$1-$2.tgz" | tar -xzC "$DEST_DIR/$1"
}

dl ffmpeg 0.12.15
dl util 0.12.2
dl core-mt 0.12.6
unset dl
