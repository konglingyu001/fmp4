const { defineConfig } = require('@vue/cli-service')
const port = process.env.port || process.env.npm_config_port || 9528 // dev port
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './',
  outputDir:'dist',
  assetsDir: 'static',
  devServer: {
    port: port,
    open: true,
    proxy: {
      '/api': {
        // target: 'http://10.0.0.26', // 开发环境
        target: 'http://10.0.0.72', // 开发环境
        // target: 'http://192.168.100.101', // 开发环境
        ws: false, // 如果要代理 websockets，配置这个参数
        secure: false, // 如果是https接口，需要配置这个参数
        changeOrigin: true, // 是否跨域
        pathRewrite: {
          '^/api': ''
        }
      },
    }
    // before: require('./mock/mock-server.js')
  },
})
