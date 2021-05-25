import Vue from 'vue'
import Router from 'vue-router'
import index from '../controllers/index'

Vue.use(Router)

export default new Router({
  mode: 'history',
  linkActiveClass: 'active',
  routes: [
    {
      path: '/',
      component: index,
      meta: {
        title: '主页',
        keepAlive:false,
      }
    }
  ]
})
