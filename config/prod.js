module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
  },
  mini: {},
  h5: {
    /**
     * 如果h5端编译后体积过大，可以使用webpack-bundle-analyzer对打包体积进行优化。
     * webpack-bundle-analyzer: https://www.npmjs.com/package/webpack-bundle-analyzer
     */
    miniCssExtractPluginOption: {
      ignoreOrder: true,
    },
  }
}
