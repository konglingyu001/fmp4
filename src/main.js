import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

let uuid=0
let getUuid=function(){
  uuid++
  return uuid
}
Vue.prototype.$getUuid=getUuid

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
