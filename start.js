const fs = require('fs-extra');
const path = require('path');
const Koa = require('koa');
const helmet = require('koa-helmet');
const send = require('koa-send');
const cash = require('koa-cash');
const convert = require('koa-convert');
const LRU = require('lru-cache');
const sharp = require('sharp');

const maxage = 1 * 365 * 24 * 60 * 60 * 1000; // 1 year
/** 内存缓存 */
const cache = new LRU({
    max: 500,
    maxAge: maxage,
});
/** 访问地址 -> 文件名 */
const filenameMap = {};
const extentions = ['png', 'webp'];
const { dirImages, dirCache } = require('./index');

const sendOptions = {
    maxage,
    immutable: true,
    root: dirCache,
};

const start = async () => {
    if (process.env.NODE_ENV === 'development') await fs.emptyDir(dirCache);

    const app = new Koa();
    app.use(helmet());
    app.use(
        convert(
            cash({
                get: (key) => cache.get(key),
                set: (key, value) => cache.set(key, value),
            })
        )
    );
    app.use(async function (ctx, next) {
        const cashed = await ctx.cashed();
        if (cashed) return;
        if (ctx.method !== 'GET') return await next();

        const filenameFromMap = filenameMap[ctx.path];
        if (filenameFromMap) {
            if (fs.existsSync(path.resolve(dirCache, filenameFromMap))) {
                return await send(ctx, filenameFromMap, sendOptions);
            }
            // 缓存文件名对应的文件不存在，删除缓存
            delete filenameMap[ctx.path];
        }

        const paths = ctx.path.split('/').filter((s) => !!s);
        const md5 = paths.shift();
        if (typeof md5 !== 'string' || md5.length !== 32) return await next();

        let ext = 'png';
        let mask = false;

        if (paths.length) {
            if (extentions.includes(paths[paths.length - 1])) ext = paths.pop();
            if (paths.length && /^m.+$/.test(paths[0]))
                mask = paths[0].substr(1);
        }

        const basename = `${md5.substr(0, 2)}/${md5.substr(2)}`;
        const fileOriginal = path.resolve(dirImages, `${basename}.png`);

        if (!fs.existsSync(fileOriginal))
            throw new Error(`file for ${basename} not exist`);

        const baseFilename = `${basename}${mask ? `.m${mask}` : ''}`;
        let filename = `${baseFilename}.png`;
        let file = path.resolve(dirCache, filename);
        await fs.ensureDir(path.dirname(file));

        if (!mask) {
            await fs.copyFile(fileOriginal, path.resolve(dirCache, filename));
        } else if (mask) {
            const image = sharp(fileOriginal);
            const { width, height } = await image.metadata();
            const maskType =
                width === 240 && height === 60
                    ? 'ship'
                    : width === 160 && height === 40
                    ? 'entity'
                    : false;
            if (!maskType) throw new Error(`no matched mask type`);
            const maskName = `${maskType}-${mask}`;
            await image
                .composite([
                    {
                        input: path.resolve(
                            __dirname,
                            `./libs/masks/${maskName}.png`
                        ),
                        blend: 'dest-in',
                    },
                ])
                .toFile(file);
        }

        if (ext === 'webp') {
            const filePNG = file;
            filename = `${baseFilename}.${ext}`;
            file = path.resolve(dirCache, filename);

            await sharp(filePNG).webp({ lossless: true }).toFile(file);
        } else {
        }

        filenameMap[ctx.path] = filename;
        if (process.env.NODE_ENV === 'development')
            console.warn({
                md5,
                mask,
                ext,
                filename,
            });

        return await send(ctx, filename, sendOptions);
    });
    app.listen(8080);
};

start().catch((err) => {
    console.error(err);
});

// ship image
// https://akigumo.fleet.moe/9076b364b2cb6012d520670bfbb6988b
// https://akigumo.fleet.moe/9076b364b2cb6012d520670bfbb6988b/webp

// ship banner
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/webp
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/m1
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/m1/webp
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/m2
// https://akigumo.fleet.moe/d5a0046cd109ab7c66219c7f375c9126/m2/webp

// entity banner
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/webp
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/m1
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/m1/webp
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/m2
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/m2/webp
