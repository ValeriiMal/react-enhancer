const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: {
		main: './index.js',
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './index.html',
		}),
	],
};