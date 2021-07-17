const path = require('path');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
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
        loader: 'babel-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.web.ts', '.ts', '.tsx', '.css'],
  },

  devServer: {
    port: 8081,
    contentBase: path.resolve(__dirname, 'public'),
  },

  plugins: [
    isDevelopment && new ReactRefreshWebpackPlugin(),
    new CopyPlugin({
      patterns: [{from: 'public', to: ''}],
    }),
  ].filter(Boolean),
};
