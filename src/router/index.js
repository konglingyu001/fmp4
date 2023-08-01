import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/WsPlayer',
  },
  {
    path: '/WsPlayer',
    name: 'WsPlayer',
    component: () => import('@/views/WsPlayer')
  },
  {
    path: '/Canvas',
    name: 'Canvas',
    component: () => import('@/views/Canvas')
  },
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
