# build stage
FROM b3ckontwitch/sls-b3ck-edit
COPY sls.conf /etc/sls/

EXPOSE 8080 8181/udp

ENTRYPOINT [ "sls", "-c", "/etc/sls/sls.conf"]
