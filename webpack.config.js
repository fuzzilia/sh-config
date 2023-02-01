const path = require('path');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  target: process.env.NODE_ENV !== 'production' ? 'web' : 'browserslist',

  entry: './src/index.tsx',

  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'docs'),
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              plugins: [isDevelopment && require.resolve('react-refresh/babel')].filter(Boolean),
            },
          },
        ],
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.web.ts', '.ts', '.tsx', '.css'],
  },

  devServer: {
    port: 8081,
    static: {
      directory: path.resolve(__dirname, 'public'),
    }
  },

  plugins: [
    isDevelopment && new ReactRefreshWebpackPlugin(),
    new CopyPlugin({
      patterns: [{from: 'public', to: ''}],
    }),
  ].filter(Boolean),
};
