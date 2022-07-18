const http = require('http');
const express = require('express');
const getServeStaticMiddleware = require('serve-static');

const { getCacheMiddleware, getProxyMiddleware, getFallbackMiddleware } = require('./utils');

const webServerService = ({ sourceDir, options: { publicPath, port, proxy = {} }}) => {
    const { routes = {}, allowedForCachingPostRequestsEntries = [] } = proxy;
    const proxyEntries = Object.keys(routes);
    const proxyMiddlewares = proxyEntries.map((entry) => getProxyMiddleware(entry, routes[entry]));
    const cacheMiddleware = getCacheMiddleware(allowedForCachingPostRequestsEntries);

    const app = express()
        .use(proxyEntries, cacheMiddleware, ...proxyMiddlewares)
        .use(publicPath, getServeStaticMiddleware(sourceDir))
        .use(getFallbackMiddleware(sourceDir));

    const server = http.createServer(app);

    server.listen(port);

    return server;
};

module.exports = webServerService;
