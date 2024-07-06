FROM node:20-bookworm

VOLUME [ "/data", "/mount" ]

RUN mkdir -p /app
ADD Server /app/Server

EXPOSE 80

RUN apt update && apt -y install avahi-daemon avahi-utils libavahi-compat-libdnssd-dev && \
    mkdir -p /data /mount && \
    ln -s /data /app/Server/_exec && \
    ln -s /mount /app/Server/mount && \
    cd /app/Server && \
    npm install

WORKDIR /app/Server/_exec
ENTRYPOINT [ "node", "/app/Server/server.js" ]