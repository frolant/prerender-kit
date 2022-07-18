const defaultOptions = {
    //# stable configurations
    port: 45678,
    source: 'build',
    destination: null,
    concurrency: 8,
    include: [
        '/'
    ],
    exclude: [],
    proxy: {},
    userAgent: 'Prerender',
    // 4 params below will be refactored to one: `puppeteer: {}`
    // https://github.com/stereobooster/react-snap/issues/120
    headless: true,
    puppeteer: {
        cache: true,
        navigationTimeout: 40000
    },
    puppeteerArgs: [],
    puppeteerExecutablePath: undefined,
    puppeteerIgnoreHTTPSErrors: false,
    publicPath: '/',
    minifyCss: {},
    minifyHtml: {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        decodeEntities: true,
        keepClosingSlash: true,
        sortAttributes: true,
        sortClassName: false
    },
    // mobile first approach
    viewport: {
        width: 480,
        height: 850
    },
    removeBlobs: true,
    fixInsertRule: true,
    skipThirdPartyRequests: false,
    cacheAjaxRequests: false,
    http2PushManifest: false,
    // may use some glob solution in the future, if required
    // works when http2PushManifest: true
    ignoreForPreload: [
        'service-worker.js'
    ],
    //# unstable configurations
    preconnectThirdParty: false,
    crawl: true,
    waitFor: false,
    //# even more workarounds
    removeStyleTags: true,
    preloadImages: false,
    // add async true to script tags
    asyncScriptTags: false,
    //# another feature creep
    // tribute to Netflix Server Side Only React https://twitter.com/NetflixUIE/status/923374215041912833
    // but this will also remove code which registers service worker
    removeScriptTags: false
};

module.exports = {
    defaultOptions
};
