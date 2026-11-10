import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import { devMode, installTypingFocus, isCodem, isCylex } from "./utils/phone";

let mounted = false;
const mount = () => {
    if (mounted) return;
    mounted = true;
    createApp(App).use(createPinia()).mount("#app");
};

// lb-phone: the app starts after lb-phone components are loaded into the iframe.
// Nothing is rendered on the script's own full-screen NUI page (outside the phone iframe).
const insidePhone = window.parent !== window;

if (devMode) {
    document.body.classList.add("dev");
    mount();
} else if (isCylex || isCodem) {
    if (insidePhone) {
        installTypingFocus();
        mount();
    }
} else if (insidePhone && window.name === "") {
    window.addEventListener("message", (event) => {
        if (event.data === "componentsLoaded") mount();
    });
}
