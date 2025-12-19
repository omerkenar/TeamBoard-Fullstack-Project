import { createPinia } from "pinia";
import { createApp } from "vue";
import { vuetify } from "./plugins/vuetify";
import "@mdi/font/css/materialdesignicons.css";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(vuetify);

app.mount("#app");
