const { override } = require('customize-cra');
const CspHtmlWebpackPlugin = require("@melloware/csp-webpack-plugin");

const cspConfigPolicy = {
    'default-src': "'none'",
    'base-uri': "'self'",
    'connect-src': "'self'",
    'worker-src': "'self' blob:",
    'img-src': "'self' blob: data: content:",
    'font-src': "'self'",
    'frame-src': "'self'",
    'manifest-src': "'self'",
    'object-src': "'none'",
    'style-src': ["'self'"],
    'script-src': ["'strict-dynamic'"],
    'require-trusted-types-for': ["'script'"]
};

function addCspHtmlWebpackPlugin(config) {
    if (process.env.NODE_ENV === 'production') {
        config.plugins.push(new CspHtmlWebpackPlugin(cspConfigPolicy));
        config.output.crossOriginLoading = "anonymous";
    }
    return config;
}

module.exports = {
    webpack: override(addCspHtmlWebpackPlugin),
};