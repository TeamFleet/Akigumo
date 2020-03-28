const path = require('path');

module.exports = {
    dirImages: path.resolve(__dirname, 'images'),
    dirCache: path.resolve(__dirname, '.cache'),
    dirMasks: path.resolve(__dirname, './src/masks'),

    App: require('./src/app'),
};
