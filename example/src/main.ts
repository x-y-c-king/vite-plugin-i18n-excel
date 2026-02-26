import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import i18n from './locales/i18n';

const app = createApp(App)

app.use(i18n).use(router).mount('#app')
