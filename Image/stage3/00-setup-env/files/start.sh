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

# Get all the mDNS packets matching the service and print them
mdns_entries=$(avahi-browse -t -r -k $MDNS_SERVICE | grep '=')
echo "Found mDNS entries:"

# Initialize arrays to store IPs and ports
ips=()
ports=()

# Extract the IPs and ports from the mDNS entries
while IFS= read -r line; do
    if [[ $line == *"address = "* ]]; then
        ip=$(echo "$line" | awk '{print $NF}' | cut -d '[' -f2 | cut -d ']' -f1)
        if [[ $ip == *":"* ]]; then
            ip="[$ip]"
        fi
        ips+=("$ip")
    elif [[ $line == *"port = "* ]]; then
        port=$(echo "$line" | awk '{print $NF}' | cut -d '[' -f2 | cut -d ']' -f1)
        ports+=("$port")
    fi
done <<< "$mdns_entries"

echo "IPs: ${ips[@]}"
echo "Ports: ${ports[@]}"

# Sort IPs so that IPv4 addresses come first
sorted_ips=()
sorted_ports=()

for ((i=0; i<${#ips[@]}; i++)); do
    if [[ ${ips[$i]} != "["* ]]; then
        sorted_ips+=("${ips[$i]}")
        sorted_ports+=("${ports[$i]}")
    fi
done

for ((i=0; i<${#ips[@]}; i++)); do
    if [[ ${ips[$i]} == "["* ]]; then
        sorted_ips+=("${ips[$i]}")
        sorted_ports+=("${ports[$i]}")
    fi
done

echo
echo "Sorted IPs: ${sorted_ips[@]}"
echo "Sorted Ports: ${sorted_ports[@]}"

# Function to check if IP is loopback
is_loopback_ip() {
    local ip=$1
    if [[ $ip == 127.* ]]; then
        return 0
    elif [[ $ip == \[fe80:* ]]; then
        return 0
    fi
    return 1
}

# Find the first non-loopback IP
for ((i=0; i<${#sorted_ips[@]}; i++)); do
    if ! is_loopback_ip "${sorted_ips[$i]}"; then
        export SERVER_IP="${sorted_ips[$i]}"
        export SERVER_PORT="${sorted_ports[$i]}"
        break
    fi
done

# Print the chosen IP and Port
echo
echo "Chosen IP: $SERVER_IP"
echo "Chosen Port: $SERVER_PORT"

# Launch chromium as well as the HDMI-CEC to keyboard emulator
(cec-client | cec2kbd) & \
    chromium --kiosk --noerrdialogs --app="http://$SERVER_IP:$SERVER_PORT/view.html?ref=$MAC"
    # browser --fullscreen "http://$SERVER_IP:$SERVER_PORT/view.html?ref=$MAC"