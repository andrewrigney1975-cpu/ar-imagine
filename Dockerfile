FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY imagine.html manifest.webmanifest sw.js pwa.js /usr/share/nginx/html/
COPY icons/ /usr/share/nginx/html/icons/
