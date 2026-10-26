# cs2-items-i18n

Rolling build of [ByMykel/CSGO-API](https://github.com/ByMykel/CSGO-API) `all.json` for every language the generator supports.

Upstream's hosted API only ships `en` and `zh-CN`. The Pricempire paid API (`GET /v4/paid/items?language=...`) serves all 28, so this repo runs the upstream generator itself and publishes the results.

## Assets

Everything is published to the `latest` release and replaced in place:

```
https://github.com/pricempire/cs2-items-i18n/releases/download/latest/{lang}.all.json
https://github.com/pricempire/cs2-items-i18n/releases/download/latest/version.txt
```

`{lang}` is an upstream folder code: `en`, `zh-CN`, `pt-BR`, `ru`, `es-ES`, `bg`, `cs`, `da`, `nl`, `fi`, `fr`, `de`, `el`, `hu`, `it`, `ja`, `ko`, `es-MX`, `no`, `pl`, `pt-PT`, `ro`, `sv`, `zh-TW`, `th`, `tr`, `uk`, `vi`.

`version.txt` is an opaque build key (`<CS2 manifest id>:<images.json sha>`). It is uploaded after all language files, so a changed value means every asset is current. Consumers use it to invalidate their caches.

## How it works

[`.github/workflows/build.yml`](.github/workflows/build.yml) runs every 30 minutes:

1. Reads the same inputs upstream's `update.js` checks (the CS2 manifest id and the image tracker's `images.json` sha) and compares them with `state/version.txt`. If nothing changed, it stops.
2. Checks out `ByMykel/CSGO-API@main` and runs `update.js` and `group.js` with `--languages all`.
3. [`scripts/stage.mjs`](scripts/stage.mjs) refuses to publish if any language is missing, unparsable, or has fewer than 95% of the English entry count.
4. Uploads the files to the `latest` release, then commits the new `state/version.txt`. Those commits also keep GitHub from disabling the schedule for inactivity.

Run it by hand from **Actions > Build all languages > Run workflow**; tick `force` to rebuild without an upstream change.

Output is not committed to git on purpose: 28 languages at roughly 80 to 100 MB each would add several GB to the repository on every game update.
