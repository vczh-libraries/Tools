# Specification

This package starts an http server, serving a website as well as a set of RESTful API.

In src/index.ts it accepts an optional argument (default 8888) for the http port.

Website entry is http://localhost:port

API entry is http://localhost:port/api/...

## Starting the HTTP Server

"yarn portal" to run src/index.ts.

It starts both Website and RESTful API. Awaits for api/stop to stops.

## Website

http://localhost:port is equivalent to http://localhost:port/index.html.

In the assets folder there stores all files for the website.

Requesting for http://localhost:port/index.html returns assets/index.html.

### test.html

This is a test page, when it is loaded, it queries api/test and print the message field to the body.

### index.html

It is blank

## API

All restful read arguments from the path and returns a JSON document.

All title names below represents http://localhost:port/api/TITLE

### test

Returns `{"message":"Hello, world!"}`

### stop

Returns `{}` and stops.
