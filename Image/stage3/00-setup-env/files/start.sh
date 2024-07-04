#!/bin/bash
export MDNS_SERVICE="_displayed-srv._tcp"
export MAC=$(cat /sys/class/net/eth0/address | tr : -)

# Never blank the screen
xset s off -dpms

# Open splash screen
feh --bg-scale /home/displayed/software/splash.png

# Wait for first relevant mdns packet to be received
while [ -z "$(avahi-browse -t -r -k $MDNS_SERVICE | grep =)" ]; do
    sleep 1
done

# Get the IP of the server
# => get the mDNS packet                               | extract the IP    | first ln. | split by equals   | Remove the left and right bracket
export SERVER_IP=$(avahi-browse -t -r -k $MDNS_SERVICE | grep 'address = ' | head -n 1 | awk '{print $NF}' | cut -d '[' -f2 | cut -d ']' -f1 )
# Get the port of the server
# => get the mDNS packet                                 | extract port   | first ln. | split by equals   | Remove the left and right bracket
export SERVER_PORT=$(avahi-browse -t -r -k $MDNS_SERVICE | grep 'port = ' | head -n 1 | awk '{print $NF}' | cut -d '[' -f2 | cut -d ']' -f1 )

# Enclose the IP in square brackets if it is an IPv6 address
if [[ $SERVER_IP == *":"* ]]; then
    export SERVER_IP="[$SERVER_IP]"
fi
 
# Launch chromium as well as the HDMI-CEC to keyboard emulator
(cec-client | cec2kbd) & \
    browser --fullscreen "http://$SERVER_IP:$SERVER_PORT/view.html?ref=$MAC"