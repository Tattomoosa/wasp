const path = require('path')

let mode = 'development'

module.exports = {
  mode,
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'wasp.js',
    library: 'wasp',
    libraryTarget: 'umd'
  },
  devServer:{
    contentBase: ['.', 'tests'],
    hot: true,
    index: 'index.html',
    writeToDisk: true,
  },
}
