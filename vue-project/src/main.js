// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import './theme/index.css'

import Vue from 'vue'
import VueRouter from 'vue-router'
import router from './router'
import App from './App.vue'
import ElementUI from 'element-ui'
import AMap from 'vue-amap';
import axios from 'axios'

Vue.use(AMap);
// 初始化vue-amap
AMap.initAMapApiLoader({
    key: 'f7d99ae14ec326012331b9b08c83a72a'
});
Vue.prototype.$http = axios

Vue.use(ElementUI, { size: 'small', zIndex: 3000 })

/* eslint-disable no-new */
let vm = new Vue({
  data () {
    return {

    }
  },
  methods: {

  },
  el: '#app',
  router,
  components: { App },
  template: '<App/>',
  render: h => h(App)
})