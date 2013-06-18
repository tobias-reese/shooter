#!/bin/bash
echo "This file need environment Variables"

echo "Copy Files to $TARGET_HOST:$TARGET_DIR"
rsync --delete-delay -vrz --progress * $TARGET_HOST:$TARGET_DIR || exit 1
ssh $TARGET_HOST "cd $TARGET_DIR && /etc/init.d/shooter stop && npm install && SERVER_URL='$LIVE_URL' bash setup.sh && /etc/init.d/shooter start"
