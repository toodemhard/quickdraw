import { index_view } from ".";
import { Drawing, Editor } from "./draw";
import * as router from "./router"

export type Key = {
    modifier?: string[],
    key: string,
}

export enum Action {
    undo,
    redo,
    zoomIn,
    zoomOut,
    decreaseBrushSize,
    increaseBrushSize,
}

export type Keybind = {
    action: Action,
    keys: Key[],
}

function defaultKeybindings() : Keybind[] {
    return [
        {
            action: Action.undo,
            keys: [ {key:"u"}, {modifier: ["Control"], key: "z"} ],
        },
        {
            action: Action.redo,
            keys: [{key: "i"}, {modifier: ["Control", "Shift"], key:"z"}, {modifier: ["Control"], key:"y"}],
        },
        {
            action: Action.decreaseBrushSize,
            keys: [{key: "["}],
        },
        {
            action: Action.increaseBrushSize,
            keys: [{key: "]"}],
        },
    ]
}


export class App {
    editor: Editor = new Editor();
    drawing: Drawing = new Drawing(800, 600);
    keybinds: Keybind[] = defaultKeybindings();
}
function main() {
    const r = router.newRouter();

    const app = new App();

    r.add("/", (c: router.Context) => {
        index_view(c, app);
    });
    r.add("/settings", () => {
        const template = document.createElement("template")
        return template.content.children;
    });

    r.start(document.getElementById("app")!);
}

main();
