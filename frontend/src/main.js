import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import router, { setupGuards } from './router'

const app = createApp(App)
app.use(router)
setupGuards(router)
app.mount('#app')
