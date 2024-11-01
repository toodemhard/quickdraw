import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()],
    server: {
        proxy: {
            "/api" : {
                target: "http://localhost:8080"
            }
        }
    },
    base: "https://toodemhard.github.io/quickdraw/"
});
