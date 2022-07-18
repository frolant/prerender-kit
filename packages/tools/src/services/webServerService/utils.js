const { createProxyMiddleware } = require('http-proxy-middleware');
const createFallbackMiddleware = require('express-history-api-fallback');
const memoryCache = require('memory-cache');
const { Buffer } = require('buffer');

const backendCache = new memoryCache.Cache();

const getFallbackMiddleware = (sourceDir) => createFallbackMiddleware('200.html', {
    root: sourceDir
});

const getProxyMiddleware = (entry, target) => createProxyMiddleware(entry, {
    target,
    secure: false,
    changeOrigin: true,
    protocolRewrite: 'http',
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Connection': 'keep-alive'
    }
});

const getCacheMiddleware = (allowedPostRequestsEntries) => {
    return (request, response, next) => {
        const { method, originalUrl } = request;
        const isSuitablePOST = method === 'POST' && allowedPostRequestsEntries.some((entry) => originalUrl.startsWith(entry));

        if (method === 'GET' || isSuitablePOST) {
            const key = `__prerender__${method}__${originalUrl}`;

            const cacheContent = backendCache.get(key);

            if (cacheContent) {
                response.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Connection': 'keep-alive'
                });

                response.end(cacheContent);

                return;
            } else {
                const _end = response.end;
                const _write = response.write;

                let buffer = new Buffer.alloc(0);

                response.write = (data) => {
                    buffer = Buffer.concat([
                        buffer,
                        data
                    ]);
                };

                response.end = () => {
                    const body = buffer.toString();

                    backendCache.put(key, body);

                    _write.call(response, body);
                    _end.call(response);
                };

                next();
            }
        } else {
            next();
        }

        return;
    };
}

module.exports = {
    getFallbackMiddleware,
    getProxyMiddleware,
    getCacheMiddleware
};
