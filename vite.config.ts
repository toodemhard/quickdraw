import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()],
    build: {
        outDir: "docs/"
    },
    server: {
        proxy: {
            "/api" : {
                target: "http://localhost:8080"
            }
        }
    },
    base: "/quickdraw/"
});
