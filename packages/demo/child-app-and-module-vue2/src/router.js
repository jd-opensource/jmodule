import Vue from 'vue'
import VueRouter from 'vue-router'

// hack
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location, onResolve, onReject) {
    if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject)
    return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

export const initRouter = (base = process.env.BASE_URL, module) => new VueRouter({
    mode: 'history',
    base,
    routes: [
        {
            path: '/',
            component: {
                render: h => h('div', module ? 'Running as child app' : 'Independent Running'),
            },
        }
    ]
});
