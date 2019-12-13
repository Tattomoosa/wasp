const path = require('path')

module.exports = {
  entry: './src/index.js',
  // entry: './index.html',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'wasp.js',
    library: 'wasp',
    libraryTarget: 'umd'
  }
}
