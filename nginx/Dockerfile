FROM ubuntu:22.04 as base
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y build-essential libpcre3-dev zlib1g-dev tclsh cmake libssl-dev git php-fpm php-curl

FROM base as nginx-build

WORKDIR /opt

RUN git clone https://github.com/Haivision/srt

WORKDIR /opt/srt

RUN ./configure && make && make install && ldconfig

WORKDIR /opt

RUN git clone https://github.com/nginx/nginx
RUN git clone https://github.com/kaltura/media-framework
RUN git clone https://github.com/kaltura/nginx-srt-module
RUN git clone https://github.com/kaltura/nginx-stream-preread-str-module

COPY setup.sh /opt/media-framework/conf/setup.sh

WORKDIR /opt/nginx

RUN /opt/media-framework/conf/build.sh /opt/nginx-srt-module /opt/nginx-stream-preread-str-module && make && make install


# FROM ubuntu:22.04 as nginx

# COPY --from=nginx-build /usr/local/nginx /usr/local/nginx
# COPY --from=nginx-build /usr/local/lib /usr/local/lib

# COPY --from=nginx-build /opt/media-framework/conf/nginx.conf /usr/local/nginx/conf/nginx.conf
COPY nginx.conf /usr/local/nginx/conf/nginx.conf
COPY controller.php /opt/media-framework/conf/controller.php
RUN mkdir -p /var/log/nginx /tmp/store/channel \
	&& chown -R www-data:www-data /tmp/store/channel \
	&& chmod -R 777 /tmp/store/channel

WORKDIR /usr/local/nginx

CMD ["./sbin/nginx", "-g", "daemon off;"]
