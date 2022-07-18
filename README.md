# PRERENDER-KIT

Kit for add single page application pre-rendering process into Webpack build lifecycle or CI application release lifecycle.

Prerender-Kit works with any framework (tested on React). Pre-rendering used the assembled frontend distribution.

#### NOTE: This documentation is under development. Below is a temporary short brief description of use.

## Using

Prerender-Kit can be used to integrate pre-rendering into the webpack build process or the release install process (or both).

### For Webpack

Install webpack-plugin package:

```
npm install @prerender-kit/webpack-plugin --save
```

Add plugin to webpack config:

```ecmascript 6
import PrerenderKitWebpackPlugin from '@prerender-kit/webpack-plugin';

export default (env, argv) => ({
    ...webpackConfig,
    
    plugins: [
        ...webpackConfig.plugins,

        ...(argv.mode === 'production' ? [
            new PrerenderWebpackPlugin({
                source: './dist',
                destination: './result',
                include: [
                   "/",
                   "/404",
                   "/500"
                ]
            })
        ] : [])
    ]
});
```

Thus, the pre-rendering process will be called with the given parameters after building the frontend distribution when issuing the build webpack command.


### For CI

Install launcher package:

```
npm install @prerender-kit/launcher --save
```

Create json config file:

```json
{
    "port": 45678,
    "publicPath": "/",
    "source": "./dist",
    "destination": "./result",
    "include": [
        "/",
        "/404",
        "/500"
    ],
    "puppeteerArgs": [
        "--disable-setuid-sandbox",
        "--no-sandbox"
    ]
}
```

(all options see in @prerender-kit/tools package)

Run pre-rendering process for crawling all site:

```
node ./path-to-launcher-package ./path-to-config.json
```

Run pre-rendering process for specific pages:
```
node ./path-to-launcher-package ./path-to-config.json ./page1 ./page2
```

In both cases:
The first parameter (required) is the path to json configuration file.
The second and subsequent parameters are links to the pages necessary for pre-rendering.
Every url start from a point (`./page.html`).
If parameters with urls are passed, then links on pages will not be searched and `include` field from the config-file will be ignored.

For example see: https://github.com/frolant/prerender-kit/tree/master/packages/launcher/tests

### Conclusion

Using these tools, you can run pre-rendering during the webpack build process (both for testing and for getting the final build) and then repeat pre-rendering to update pages between releases directly on the production server (for example, after updating some backend data) for one or more changed pages or for all site.
