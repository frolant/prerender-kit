const puppeteer = require('puppeteer');
const _ = require('highland');
const url = require('url');
const path = require('path');
const fs = require('fs');

const getStyledMessage = require('../../utils/getStyledMessage');

const { createTracker, augmentTimeoutError } = require('./tracker');
const { skipThirdPartyRequests, enableLogging, getLinks } = require('./utils');

/**
 * can not use null as default for function because of TS error https://github.com/Microsoft/TypeScript/issues/14889
 *
 * @param {{options: *, basePath: string, beforeFetch: ?(function({ page: Page, route: string }):Promise), afterFetch: ?(function({ page: Page, browser: Browser, route: string }):Promise), onEnd: ?(function():void)}} opt
 * @return {Promise}
 */
const puppeteerService = async (opt) => {
    const {
        options,
        basePath,
        beforeFetch,
        afterFetch,
        onEnd,
        sourceDir
    } = opt;

    let shuttingDown = false;
    let streamClosed = false;

    const onSigint = () => {
        if (shuttingDown) {
            process.exit(1);
        } else {
            shuttingDown = true;
            console.log('\nGracefully shutting down. To exit immediately, press ^C again');
        }
    };

    process.on('SIGINT', onSigint);

    const onUnhandledRejection = (error) => {
        console.log(getStyledMessage.error('UnhandledPromiseRejectionWarning'), error);
        shuttingDown = true;
    };

    process.on('unhandledRejection', onUnhandledRejection);

    const queue = _();

    let enqued = 0;
    let processed = 0;

    // use Set instead
    const uniqueUrls = new Set();
    const sourcemapStore = {};

    /**
     * @param {string} newUrl
     * @returns {void}
     */
    const addToQueue = (newUrl) => {
        const { hostname, search, hash, pathname } = url.parse(newUrl);

        newUrl = newUrl.replace(`${search || ''}${hash || ''}`, '');

        if (hostname === 'localhost' && !uniqueUrls.has(newUrl) && !streamClosed) {
            uniqueUrls.add(newUrl);

            if (!options.exclude.find((entry) => pathname.startsWith(entry))) {
                enqued++;
                queue.write(newUrl);
            }
        }
    };

    const browser = await puppeteer.launch({
        headless: options.headless,
        args: options.puppeteerArgs,
        executablePath: options.puppeteerExecutablePath,
        ignoreHTTPSErrors: options.puppeteerIgnoreHTTPSErrors,
        handleSIGINT: false
    });

    /**
     * @param {string} pageUrl
     * @returns {Promise<string>}
     */
    const fetchPage = async (pageUrl) => {
        const route = pageUrl.replace(basePath, '');

        let skipExistingFile = false;

        const routePath = route.replace(/\//g, path.sep);
        const { ext } = path.parse(routePath);

        if (ext !== '.html' && ext !== '') {
            const filePath = path.join(sourceDir, routePath);
            skipExistingFile = fs.existsSync(filePath);
        }

        if (!shuttingDown && !skipExistingFile) {
            try {
                const page = await browser.newPage();

                await page._client.send('ServiceWorker.disable');
                await page.setCacheEnabled(options.puppeteer.cache);
                await page.setDefaultNavigationTimeout(options.puppeteer.navigationTimeout);

                if (options.viewport) {
                    await page.setViewport(options.viewport);
                }

                if (options.skipThirdPartyRequests) {
                    await skipThirdPartyRequests({
                        page,
                        options,
                        basePath
                    });
                }

                enableLogging({
                    page,
                    options,
                    route,
                    onError: () => {
                        shuttingDown = true;
                    },
                    sourcemapStore
                });

                beforeFetch && beforeFetch({ page, route });

                await page.setUserAgent(options.userAgent);

                const tracker = createTracker(page);

                try {
                    await page.goto(pageUrl, {
                        waitUntil: 'networkidle0'
                    });
                } catch (e) {
                    e.message = augmentTimeoutError(e.message, tracker);
                    throw e;
                } finally {
                    tracker.dispose();
                }

                if (options.waitFor) {
                    await page.waitFor(options.waitFor);
                }

                if (options.crawl) {
                    const links = await getLinks({ page });
                    links.forEach(addToQueue);
                }

                afterFetch && (await afterFetch({ page, route, browser, addToQueue }));

                await page.close();

                console.log(`${getStyledMessage.green('crawled')} ${processed + 1} out of ${enqued} (${route})`);
            } catch (e) {
                if (!shuttingDown) {
                    console.log(getStyledMessage.error(`crawling-error at ${route}`), e);
                }
                shuttingDown = true;
            }
        }

        processed++;

        if (enqued === processed) {
            streamClosed = true;
            queue.end();
        }

        return pageUrl;
    };

    if (options.include) {
        options.include.map((x) => addToQueue(`${basePath}${x}`));
    }

    console.log(`\n${getStyledMessage.bold('Prerendering process started')}\n`);

    return new Promise((resolve, reject) => {
        queue
            .map(x => _(fetchPage(x)))
            .mergeWithLimit(options.concurrency)
            .toArray(async () => {
                process.removeListener('SIGINT', onSigint);
                process.removeListener('unhandledRejection', onUnhandledRejection);

                await browser.close();

                onEnd && onEnd();

                if (shuttingDown) {
                    return reject('');
                }

                resolve();
            });
    });
};

module.exports = puppeteerService;
