const getStyledMessage = require('../../utils/getStyledMessage');

const errorToString = (jsHandle) => jsHandle.executionContext().evaluate(e => e.toString(), jsHandle);
const objectToJson = (jsHandle) => jsHandle.jsonValue();

/**
 * @param {{page: Page, options: {skipThirdPartyRequests: true}, basePath: string }} opt
 * @return {Promise<void>}
 */
const skipThirdPartyRequests = async (opt) => {
    const { page, options, basePath } = opt;

    if (!options.skipThirdPartyRequests) {
        return;
    }

    await page.setRequestInterception(true);

    page.on('request', (request) => {
        if (request.url().startsWith(basePath)) {
            request.continue();
        } else {
            request.abort();
        }
    });
};

/**
 * @param {{page: Page, options: {sourceMaps: boolean}, route: string, onError: ?function }} opt
 * @return {void}
 */
const enableLogging = (opt) => {
    const { page, options, route, onError } = opt;

    page.on('console', (msg) => {
        const text = msg.text();

        if (text === 'JSHandle@object') {
            Promise.all(msg.args().map(objectToJson)).then((args) => console.log(getStyledMessage.warning(`console.log at ${route}:`), ...args));
        } else if (text === 'JSHandle@error') {
            Promise.all(msg.args().map(errorToString)).then((args) => console.log(getStyledMessage.warning(`console.log at ${route}:`), ...args));
        } else {
            console.log(getStyledMessage.warning(`console.log at ${route}:`), text);
        }
    });

    page.on('error', (msg) => {
        console.log(getStyledMessage.error(`common-error at ${route}:`), msg);
        onError && onError();
    });

    page.on('pageerror', (e) => {
        console.log(getStyledMessage.error(`page-error at ${route}:`), e);
        onError && onError();
    });

    page.on('response', response => {
        if (response.status() >= 400) {
            let route = '';

            try {
                route = response._request.headers().referer.replace(`http://localhost:${options.port}`, '');
            } catch (e) {}

            console.log(getStyledMessage.warning(`warning at ${route}: got ${response.status()} HTTP code for ${response.url()}`));
        }
    });
};

/**
 * @param {{page: Page}} opt
 * @return {Promise<Array<string>>}
 */
const getLinks = async (opt) => {
    const { page } = opt;
    const anchors = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a')).map((anchor) => {
            if (anchor.href.baseVal) {
                const a = document.createElement('a');

                a.href = anchor.href.baseVal;

                return a.href;
            }

            return anchor.href;
        })
    );

    const iframes = await page.evaluate(() => Array.from(document.querySelectorAll('iframe')).map((iframe) => iframe.src));

    return anchors.concat(iframes);
};

module.exports = {
    skipThirdPartyRequests,
    enableLogging,
    getLinks
};
