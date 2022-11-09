module.exports = {
    publicPath: ".",
    configureWebpack: {
        optimization: {
            splitChunks: false
        }
    },
    css: {
        extract: false,
    }
};
