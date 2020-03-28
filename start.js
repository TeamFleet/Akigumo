const App = require('./src/app');

const start = async () => {
    const app = new App(8080);
    await app.start();
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

// entity image
// https://akigumo.fleet.moe/0a3ade3a779b51b6a39742b6e1aa4e5f

// entity banner
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/webp
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/m1
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/m1/webp
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/m2
// https://akigumo.fleet.moe/0a9d5a3ce91c4be10756000b0dc025fe/m2/webp
