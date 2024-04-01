import { index_view } from ".";
import { config_view } from "./config";
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
    squareBrush,
    pan,
}

export type Keybind = {
    name: string,
    action: Action,
    keys: Key[],
}

export function defaultKeybindings() : Keybind[] {
    return [
        {
            name: "Undo",
            action: Action.undo,
            keys: [ {key:"u"}, {modifier: ["Control"], key: "z"} ],
        },
        {
            name: "Redo",
            action: Action.redo,
            keys: [{key: "i"}, {modifier: ["Control", "Shift"], key:"z"}, {modifier: ["Control"], key:"y"}],
        },
        {
            name: "Decrease Brush Size",
            action: Action.decreaseBrushSize,
            keys: [{key: "["}],
        },
        {
            name: "Increase Brush Size",
            action: Action.increaseBrushSize,
            keys: [{key: "]"}],
        },
        {
            name: "Square Brush",
            action: Action.squareBrush,
            keys: [{key: "k"}, {key: "j"}],
        },
        {
            name: "Pan",
            action: Action.pan,
            keys: [{key: "c"}, {key: "n"}]
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
        config_view(app);
    });

    r.start(document.getElementById("app")!);
}

main();
