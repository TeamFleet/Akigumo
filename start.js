const Koa = require('koa');
const helmet = require('koa-helmet');
const send = require('koa-send');
const path = require('path');
const LRU = require('lru-cache');

const maxage = 1 * 365 * 24 * 60 * 60 * 1000; // 1 year
/** 内存缓存 */
const cache = new LRU({
    max: 500,
    maxAge: maxage,
});
/** 图片文件地址缓存 */
const cacheFile = new Map();
const extentions = ['png', 'webp'];
const { dirImages, dirCache } = require('./index');

const sendOptions = {
    maxage,
    immutable: true,
};

const start = async () => {
    const app = new Koa();
    app.use(helmet());
    app.use(async (ctx, next) => {
        // TODO use cache here
        // TODO use cacheFile here

        const paths = ctx.path.split('/').filter((s) => !!s);
        const md5 = paths.shift();
        if (typeof md5 !== 'string' || md5.length !== 32) return await next();

        let ext = 'png';
        let mask = false;

        if (paths.length) {
            if (extentions.includes(paths[paths.length - 1])) ext = paths.pop();
            if (paths.length && /^m[0-9]+$/.test(paths[0]))
                mask = paths[0].substr(1);
        }

        if (!mask && ext === 'png') {
            // TODO gzip and read gzip from cache
            // TODO use cache
            return await send(
                ctx,
                `${md5.substr(0, 2)}/${md5.substr(2)}.${ext}`,
                {
                    ...sendOptions,
                    root: dirImages,
                }
            );
        }

        console.log({
            md5,
            mask,
            ext,
        });
    });
    app.listen(8080);
};

start().catch((err) => {
    console.error(err);
});

// https://akigumo.fleet.moe/9076b364b2cb6012d520670bfbb6988b
// https://akigumo.fleet.moe/9076b364b2cb6012d520670bfbb6988b/webp
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/webp
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/m1
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/m1/webp
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/m2
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/m2/webp
