### Launch testing examples with internal web-server and test config

#### Testing

Launch Prerender-Module for crawl all entries and found urls:
```
node ./packages/launcher ./packages/launcher/tests/config.json
```

Launch Prerender-Module for crawl specific pages:
```
node ./packages/launcher ./packages/launcher/tests/config.json ./page.html
```

See all results in: `/packages/launcher/tests/result`
