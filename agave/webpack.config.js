/* eslint-disable no-undef */

const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const urlDev = "https://localhost:3000/";
const urlProd = "https://addin.red.traynrex.com/";

async function getHttpsOptions()
{
    const httpsOptions = await devCerts.getHttpsServerOptions();
    return { cacert: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) =>
{
    const dev = options.mode === "development";
    const buildType = dev ? "dev" : "prod";
    const config = {
        devtool: "source-map",
        entry: {
            polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
            vendor: ["react", "react-dom", "core-js", "@fluentui/react"],
            taskpane: ["react-hot-loader/patch", "./src/taskpane/index.tsx"],
        },
        output: {
            devtoolModuleFilenameTemplate: "webpack:///[resource-path]?[loaders]",
            clean: true,
        },
        resolve: {
            extensions: [".ts", ".tsx", ".html", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-typescript"],
                        },
                    },
                },
                {
                    test: /\.tsx?$/,
                    use: ["react-hot-loader/webpack", "ts-loader"],
                    exclude: /node_modules/,
                },
                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    use: "html-loader",
                },
                {
                    test: /\.(png|jpg|jpeg|gif|ico)$/,
                    type: "asset/resource",
                    generator: {
                        filename: "assets/[name][ext][query]",
                    },
                },
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        'css-loader'
                    ]
                }
            ],
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: "help/",
                        to: "help/"
                    },
                    {
                        from: "assets/*",
                        to: "assets/[name][ext][query]",
                    },
                    {
                        from: "manifest*.xml",
                        to: "[name]." + buildType + "[ext]",
                        transform(content)
                        {
                            if (dev)
                            {
                                return content;
                            }
                            else
                            {
                                return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
                            }
                        },
                    },
                ],
            }),
            new HtmlWebpackPlugin({
                filename: "taskpane.html",
                template: "./src/taskpane/taskpane.html",
                chunks: ["taskpane", "vendor", "polyfills"],
            }),
            new webpack.ProvidePlugin({
                Promise: ["es6-promise", "Promise"],
            }),
        ],
        devServer: {
            hot: true,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            https: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
            port: process.env.npm_package_config_dev_server_port || 3000
        },
    };

    return config;
};