#!/bin/bash

HOME="${ROOTFS_DIR}/home/displayed"

install -m 755 -o 1000 -g 1000 -d "${HOME}/software/"
install -m 755 -o 1000 -g 1000 -d "${HOME}/bin/"

install -m 644 -o 1000 -g 1000 files/splash.png "${HOME}/software/splash.png"
install -m 755 -o 1000 -g 1000 files/firstrun.sh "${HOME}/"
install -m 755 -o 1000 -g 1000 files/start.sh "${HOME}/software/start.sh"
install -m 644 -o 1000 -g 1000 files/.profile "${HOME}/"
install -m 644 -o 1000 -g 1000 files/.xinitrc "${HOME}/"
install -m 644 -o 1000 -g 1000 files/.hushlogin "${HOME}/"

install -m 755 -o 1000 -g 1000 files/bin/browser "${HOME}/bin/"
install -m 755 -o 1000 -g 1000 files/bin/cec2kbd "${HOME}/bin/"

# Autologin
install -m 644 -o 1000 -g 1000 files/autologin.conf "${ROOTFS_DIR}/etc/systemd/system/getty@tty1.service.d/autologin.conf"