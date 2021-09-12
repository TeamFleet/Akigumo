const axios = require('axios');
const { readFile } = require('fs/promises');
const path = require('path');

const App = require('../src/app');

const port = 3008;
const tests = [
    // ship avatar
    {
        uri: '/d5a0046cd109ab7c66219c7f375c9126',
        sample: 'd5a0046cd109ab7c66219c7f375c9126.png',
        mime: 'image/png',
    },
    {
        uri: '/d5a0046cd109ab7c66219c7f375c9126/webp',
        sample: 'd5a0046cd109ab7c66219c7f375c9126.webp',
        mime: 'image/webp',
    },
    {
        uri: '/d5a0046cd109ab7c66219c7f375c9126/m1',
        sample: 'd5a0046cd109ab7c66219c7f375c9126-m1.png',
    },
    {
        uri: '/d5a0046cd109ab7c66219c7f375c9126/m1/webp',
        sample: 'd5a0046cd109ab7c66219c7f375c9126-m1.webp',
    },
    {
        uri: '/d5a0046cd109ab7c66219c7f375c9126/m2',
        sample: 'd5a0046cd109ab7c66219c7f375c9126-m2.png',
    },
    {
        uri: '/d5a0046cd109ab7c66219c7f375c9126/m2/webp',
        sample: 'd5a0046cd109ab7c66219c7f375c9126-m2.webp',
    },

    // ship illustration
    {
        uri: '/99c7f356c42b64576d0cf333acd9866f',
        sample: '99c7f356c42b64576d0cf333acd9866f.png',
    },
    {
        uri: '/fb368ffd229ce8f5e7f0b36453f4302d/webp',
        sample: 'fb368ffd229ce8f5e7f0b36453f4302d.webp',
    },
    {
        uri: '/2b7207725021d54e68d42dffcd808dbb',
        sample: '2b7207725021d54e68d42dffcd808dbb.png',
    },
    {
        uri: '/ad3343fc27189e94b5d2b9d47b343efa',
        sample: 'ad3343fc27189e94b5d2b9d47b343efa.png',
    },
    {
        uri: '/b472e5d5a183ae17f7fdba4ef9c020bd/webp',
        sample: 'b472e5d5a183ae17f7fdba4ef9c020bd.webp',
    },
];

// ============================================================================

let app;
beforeAll(() => {
    app = new App(port);
    app.silent = true;
    return app.start();
});

afterAll(() => {
    return app.server.close();
});

// ============================================================================

let index = 0;
for (const { uri, sample, mime } of tests) {
    test(`Test #${index}`, async () => {
        const req = await axios.get(`http://localhost:${port}${uri}`, {
            responseType: 'arraybuffer',
        });

        expect(req.status).toBe(200);
        if (mime) expect(req.headers['content-type']).toBe(mime);

        const loc = await readFile(path.resolve(__dirname, 'results', sample));

        expect(req.data.length).toBe(loc.length);
        expect(Buffer.compare(req.data, loc)).toBe(0);
    });

    index++;
}
