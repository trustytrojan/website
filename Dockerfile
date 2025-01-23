FROM nginx

# copy static files, run setup scripts
WORKDIR /website
COPY public public
COPY scripts scripts
# RUN sh scripts/ffmpeg.wasm-dl.sh

# copy nginx configuration and ssl cert/key
# the docker image config will `include /etc/nginx/conf.d/*.conf;` inside its `http` block
COPY nginx.conf /etc/nginx/conf.d/website.conf

# remove default server configuration
RUN rm /etc/nginx/conf.d/default.conf

EXPOSE 80 443
