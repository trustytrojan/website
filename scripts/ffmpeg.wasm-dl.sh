BASE_URL='https://registry.npmjs.org/@ffmpeg'
DEST_DIR='res/js/@ffmpeg'

FFMPEG_VER='0.12.10'
UTIL_VER='0.12.1'
CORE_VER='0.12.6'
CORE_MT_VER='0.12.6'

FFMPEG="$BASE_URL/ffmpeg/-/ffmpeg-$FFMPEG_VER.tgz"
UTIL="$BASE_URL/util/-/util-$UTIL_VER.tgz"
CORE="$BASE_URL/core/-/core-$CORE_VER.tgz"
CORE_MT="$BASE_URL/core-mt/-/core-mt-$CORE_MT_VER.tgz"

mkdir -p $DEST_DIR/ffmpeg $DEST_DIR/util $DEST_DIR/core $DEST_DIR/core-mt
[ -e "$DEST_DIR/ffmpeg/*" ] || curl $FFMPEG | tar -xzC $DEST_DIR
[ -e "$DEST_DIR/util/*" ] || curl $UTIL | tar -xzC $DEST_DIR
[ -e "$DEST_DIR/core/*" ] || curl $CORE | tar -xzC $DEST_DIR
[ -e "$DEST_DIR/core-mt/*" ] || curl $CORE_MT | tar -xzC $DEST_DIR
