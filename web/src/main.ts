import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import { devMode } from "./utils";

let mounted = false;
const mount = () => {
    if (mounted) return;
    mounted = true;
    createApp(App).use(createPinia()).mount("#app");
};

// The app starts after lb-phone components are loaded into the iframe
// Nothing is rendered on the script's own full-screen NUI page (outside the phone iframe)
const insidePhone = window.parent !== window;

if (devMode || (insidePhone && window.name === "")) {
    if (devMode) {
        document.body.classList.add("dev");
        mount();
    } else {
        window.addEventListener("message", (event) => {
            if (event.data === "componentsLoaded") mount();
        });
    }
}
