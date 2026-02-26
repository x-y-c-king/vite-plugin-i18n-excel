import { createRouter, createWebHashHistory } from "vue-router"

declare module "vue-router" {
	interface RouteMeta {
		title: string
	}
}

export const routes = [
	{
		path: "/",
		name: "home",
		component: () => import("../view/Home.vue"),
		meta: {
			title: "首页"
		}
	}
]

const router = createRouter({
	history: createWebHashHistory(),
	routes,
})

router.beforeEach((to, _from, next) => {
	// \u200E 空title
	document.title = to.meta.title
	next()
})
export default router
