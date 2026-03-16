const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // 开发服务器配置
  devServer: {
    port: 8080,
    proxy: {
      // 将所有 /api 开头的请求代理到后端服务
      '/api': {
        target: process.env.VUE_APP_API_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api' // 保持 /api 前缀
        }
      }
    }
  },
  
  chainWebpack: config => {
    // 显式定义Vue特性开关，解决 esm-bundler 提示
    config.plugin('define').tap(args => {
      args[0]['__VUE_PROD_HYDRATION_MISMATCH_DETAILS__'] = JSON.stringify(false)
      // 可选：一起定义常见开关，利于摇树优化
      if (typeof args[0]['__VUE_OPTIONS_API__'] === 'undefined') {
        args[0]['__VUE_OPTIONS_API__'] = JSON.stringify(true)
      }
      if (typeof args[0]['__VUE_PROD_DEVTOOLS__'] === 'undefined') {
        args[0]['__VUE_PROD_DEVTOOLS__'] = JSON.stringify(false)
      }
      return args
    })
    
    // 解决HTML文件冲突问题
    config.plugin('html').tap(args => {
      args[0].filename = 'index.html'
      args[0].template = 'public/index.html'
      return args
    })
    
    // 确保只有一个HTML输出
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')
    
    // 配置copy插件，排除所有HTML文件
    config.plugin('copy').tap(args => {
      args[0].patterns[0].globOptions = {
        ...args[0].patterns[0].globOptions,
        ignore: ['**/*.html']
      }
      return args
    })
  },
  
  // 添加webpack配置
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src')
      }
    }
  }
})
