// 'use strict';

// var path = require('path'),
//     webpack = require('webpack'),
//     HTMLWebpackPlugin = require('html-webpack-plugin');

// module.exports = {
//     entry: 'client/index.js',

//     output: {
//         path: path.join(__dirname, "/dist/"),
//         filename: "app.js"
//         // publicPath: '/'
//     },

//     watch: false,

//     watchOptions: {
//         aggregateTimeout:100
//     },

//     devtool: 'source-map',// false,

//     resolve: {
//         modules: [
//             path.join(__dirname, '/'),
//             path.join(__dirname, '/src')
//         ]
//     },

//     module:{
//         loaders:[{
//                 test:/\.js$/,
//                 include:[
//                     path.resolve(__dirname, '/'),
//                 ],
//                 exclude: [
//                    path.resolve(__dirname, 'node_modules'),
//                    path.resolve(__dirname, 'vendor')
//                 ],
//                 loader:'babel-loader',
//                 query:{
//                     presets:['es2015', 'stage-2']
//                 }
//             }
//         ]
//     },

// plugins: [
//     new HTMLWebpackPlugin({
//         title: "Lockstep sandbox",
//         filename: 'index.html',
//         template: 'index.html.ejs',
//         inject: 'body',
//         hash : true
//     })]
// };

const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = (env) => {
  return {
    entry: path.join(__dirname, 'src', 'client', 'index.js'),
    output: {
      filename: 'app.js',
      // path: path.join(__dirname, 'app'),
    },

    devServer: {
      https: true,
    },

    watch: false,

    node: {
      fs: 'empty',
    },

    watchOptions: {
      aggregateTimeout: 100,
    },

    devtool: env.dev ? 'source-map' : false,

    resolve: {
      modules: [path.join(__dirname, '.'), path.join(__dirname, 'src')],
    },

    plugins: [
      new HTMLWebpackPlugin({
        title: 'Lockstep',
        filename: 'index.html',
        template: 'index.html',
        inject: 'body',
        hash: true,
        debug: env.dev,
      }),
    ],

    module: {
      rules: [
        {
          test: /.jsx?$/,
          include: [path.join(__dirname)],
          exclude: [path.join(__dirname, 'vendor')],
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.css$/,
          include: [path.join(__dirname)],
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          include: [path.join(__dirname)],
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'fonts/',
              },
            },
          ],
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/,
          include: [path.join(__dirname)],
          use: ['file-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['*', '.js', '.jsx', '.css'],
    },
  }
}
