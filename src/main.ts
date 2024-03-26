import { index_view } from ".";
import * as router from "./router"

export type Keybinds = {
    undo: string,
    redo: string,
    zoomIn: string,
    zoomOut: string,
}

function main() {
    const r = router.newRouter();

    let keybinds: Keybinds = {
        undo: "u",
        redo: "i",
        zoomIn: "=",
        zoomOut: "-",
    }

    r.add("/", (c: router.Context) => {
        return index_view(c, keybinds);
    });
    r.add("/settings", ():HTMLCollection => {
        const template = document.createElement("template")
        return template.content.children;
    });

    r.start(document.getElementById("app")!);
}

main();
