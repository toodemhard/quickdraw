FROM ubuntu:22.04

WORKDIR /app
COPY quickdraw .
COPY dist/ ./dist

EXPOSE 5000
CMD ["./quickdraw"]
