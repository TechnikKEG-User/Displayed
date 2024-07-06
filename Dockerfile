FROM node:20-bookworm

VOLUME [ "/data", "/mount" ]

RUN mkdir -p /app
ADD Server /app/Server

EXPOSE 80

RUN mkdir -p /data /mount && \
    ln -s /data /app/Server/_exec && \
    ln -s /mount /app/Server/mount && \
    cd /app/Server && \
    npm install

WORKDIR /app/_exec
ENTRYPOINT [ "node", "../Server/index.js" ]