import Vue from 'vue'
import VueCompositionAPI, { createApp, h } from '@vue/composition-api';

import App from './App.vue'

Vue.use(VueCompositionAPI);

Vue.config.productionTip = false;

// new Vue({
// 	render: h => h(App),
// }).$mount('#app');

const app = createApp({
  render: () => h(App),
});

app.mount('#app');
