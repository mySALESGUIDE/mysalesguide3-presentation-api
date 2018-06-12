const webpack = require('webpack');

module.exports = {
    resolve: {
        modules: ['src', 'node_modules'],
        extensions: ['.js']
    },
    entry: 'mySALESGUIDE',
    output: {
        path: 'dist',
        filename: 'mySALESGUIDE.js',
        publicPath: 'dist/mySALESGUIDE.js'
    }
};
