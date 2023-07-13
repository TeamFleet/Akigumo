const fs = require('fs-extra');
const path = require('path');
const Koa = require('koa');
const helmet = require('koa-helmet');
const send = require('koa-send');
const cash = require('koa-cash');
const convert = require('koa-convert');
const { LRUCache } = require('lru-cache');
const sharp = require('sharp');
const { dirImages, dirCache, dirMasks } = require('../');

// ============================================================================

/** 默认缓存有效期 (1年) */
const maxage = 1 * 365 * 24 * 60 * 60 * 1000;
/** 基于访问量的缓存 */
const cache = new LRUCache({
    max: 500,
    maxAge: maxage,
});
/** 对照表: 访问地址 -> 文件名 */
const filenameMap = {};
/** 当前有效的扩展名 */
const extentions = ['png', 'webp'];
/** 用于 `koa-send` 的参数 */
const sendOptions = {
    maxage,
    immutable: true,
    root: dirCache,
};

// ============================================================================

class App {
    static parseOptions(options) {
        if (typeof options === 'number')
            return App.parseOptions({ port: options });

        if (typeof options !== 'object') throw new Error(`missing options`);
        if (typeof options.port === 'undefined')
            throw new Error(`missing option: port`);

        return options;
    }

    /** Koa app */
    app = undefined;
    server = undefined;
    silent = false;

    constructor(options = {}) {
        Object.assign(this, App.parseOptions(options));
    }

    async create() {
        if (process.env.NODE_ENV === 'development') await fs.emptyDir(dirCache);

        this.app = new Koa();
        const app = this.app;

        app.use(helmet());
        app.use(
            convert(
                cash({
                    get: (key) => cache.get(key),
                    set: (key, value) => cache.set(key, value),
                }),
            ),
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
            if (typeof md5 !== 'string' || md5.length !== 32)
                return await next();

            let ext = 'png';
            let mask = false;

            if (paths.length) {
                if (extentions.includes(paths[paths.length - 1]))
                    ext = paths.pop();
                if (paths.length && /^m.+$/.test(paths[0]))
                    mask = paths[0].substr(1);
            }

            const basename = `${md5.substr(0, 2)}/${md5.substr(2)}`;
            let fileOriginal = path.resolve(dirImages, `${basename}.png`);

            if (!fs.existsSync(fileOriginal)) {
                fileOriginal = path.resolve(dirImages, `${basename}.jpg`);
                if (!fs.existsSync(fileOriginal))
                    throw new Error(`file for ${basename} not exist`);
            }

            const baseFilename = `${basename}${mask ? `.m${mask}` : ''}`;
            let filename = `${baseFilename}.png`;
            let file = path.resolve(dirCache, filename);
            await fs.ensureDir(path.dirname(file));

            if (!mask) {
                await fs.copyFile(
                    fileOriginal,
                    path.resolve(dirCache, filename),
                );
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
                            input: path.resolve(dirMasks, `${maskName}.png`),
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

        return this.app;
    }

    async start(port = this.port, callback) {
        if (!this.app) await this.create();

        this.server = this.app.listen(port);

        if (!this.silent)
            // eslint-disable-next-line no-console
            console.log(`Akigumo listening port ${port}`);
    }
}

module.exports = App;
