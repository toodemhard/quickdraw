import { HSV, clamp, hsvToRGB, offsetPos } from "./color";
import { Drawing, Editor, Tool, CanvasCtx, onPointerDown, rebuild, onPointerHeld, onZoom, onUndo, onRedo, onPointerUp } from "./draw";
import { Action, App, Key, Keybind } from "./main";
import { Context } from "./router";

function slider(onInput: (value: number) => void): Element {
    const template = document.createElement("template");
    template.innerHTML = `
    <div id="thing" class="relative bg-bg1 w-full h-6">
        <div id="meter" class="bg-blue-700 w-3/5 h-full">
        <span id="slider-value" class="mx-auto table absolute left-0 right-0">50px</span>
        </div>
    </div>
    `

    const element = template.content.getElementById("thing")!

    let rect = element.getBoundingClientRect();
    let held = false;


    element.addEventListener("pointerdown", (e: PointerEvent) => {
        rect = element.getBoundingClientRect();
        held = true;
        onInput((e.clientX - rect.x) / element.clientWidth);
    })

    document.addEventListener("pointermove", (e:PointerEvent) => {
        if (!held) {
            return;
        }

        onInput((e.clientX - rect.x) / element.clientWidth);
    })

    document.addEventListener("pointerup", () => {
        held = false;
    })

    document.addEventListener("pointerleave", () => {
        held = false;
    })
    
    return template.content.firstElementChild!;
}

export function index_view(c: Context, app : App) {
    const root = document.querySelector<HTMLDivElement>("#app")!
    root.focus();

    const keybinds = app.keybinds;
    const editor = app.editor
    let drawing = app.drawing;

    root.innerHTML = `
<div class="flex h-screen flex-col">
    <div class="flex w-full gap-2 p-2">
        <button id="new" class="text-2xl">New</button>
        <button class="text-2xl">Save</button>
        <button class="text-2xl">Open</button>
        <button class="text-2xl">Export</button>
    </div>
    <csr-link href="/settings">Settings</csr-link>

    <div class="flex flex-1">
        <div id="canvas-field" class="relative w-full overflow-hidden bg-bg2 cursor-cell">
            <div id="canvas-stack" class="w-[800px] h-[600px] absolute left-1/2 top-1/2 border-[2px] border-red-600 box-content">
                <canvas id="canvas" width="${drawing.width}" height="${drawing.height}" class="absolute"></canvas>
                <canvas id="temp" width="${drawing.width}" height="${drawing.height}" class="absolute"></canvas>
            </div>
        </div>
        <div class="right-0 h-full select-none p-9">
            <div class="flex flex-col gap-3.5">
                <div id="output" class="h-8 rounded-md" draggable="false"></div>
                <div id="color-picker" class="relative h-72 w-72 select-none">
                    <div id="hue" class="absolute h-full w-full rounded-md"></div>
                    <div id="saturation" class="absolute h-full w-full rounded-md"></div>
                    <div id="brightness" class="absolute h-full w-full rounded-md translate-y-px"></div>
                    <div id="pointer"
                        class="absolute z-20 h-4 w-4 -translate-x-1/2 translate-y-1/2 select-none rounded-full border-2 border-white">
                    </div>
                </div>
                <div id="hue-slider" class="relative z-0 my-2 h-8 w-72 rounded-md">
                    <div id="hue-window"
                        class="absolute top-1/2 z-10 h-12 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white">
                    </div>
                </div>

                <div id=scale-slider></div>

                <div id="toolbox" class="flex w-72 flex-wrap"></div>
            </div>
        </div>
    </div>

    <div id="create-canvas-popup" class="invisible p-8 absolute bg-bg0 m-auto top-0 bottom-0 left-0 right-0 h-fit w-fit ">
        <div>
            <span>width:</span> <input id="width" type="number" class="bg-bg2"> <span>px</span>
        </div>
        <div>
            <span>height:</span> <input id="height" type="number" class="bg-bg2"> <span>px</span>
        </div>

        <button id="new-drawing" class="bg-white text-bg0 p-2 px-4 rounded-full text-xl font-bold">Create</button>

    </div>
</div>
    `;


    const setBrushSize = (value: number) => {
        value = clamp(value, 0, maxScale);
        editor.brushScale = value;
        updateMeter(value);
    }


    const scaleInput = (fraction: number) => {
        setBrushSize(maxScale * fraction);
    }
    
    const maxScale = 100;
    const scaleSlider = slider(scaleInput);

    document.getElementById("scale-slider")!.replaceWith(scaleSlider);

    
    const updateMeter = (value: number) => {
        document.getElementById("meter")!.style.width=`${value/maxScale * 100}%`;
        document.getElementById("slider-value")!.innerHTML = `${Math.round(value)} px`
    }
    updateMeter(editor.brushScale);


    const canvasField = document.getElementById("canvas-field")!;
    const canvasStack = document.getElementById("canvas-stack")!;

    const canvas = canvasStack.querySelector<HTMLCanvasElement>("#canvas")!;
    const mainCtx = canvas.getContext("2d")!;
    const temp = canvasField.querySelector<HTMLCanvasElement>("#temp")!;
    const tempCtx = temp.getContext("2d")!;

    const rebuildCanvasStack = () => {
        canvas.width = drawing.width;
        canvas.height = drawing.height;
        temp.width = drawing.width;
        temp.height = drawing.height;
    }

    const attachDrawingListeners = () => {
        drawing.historyEvent.subscribe(() => {
            rebuild(drawing, mainCtx);
        });

        drawing.canvasMoveEvent.subscribe(() => {
            updateCanvasUI();
        })
    }

    attachDrawingListeners();

    rebuildCanvasStack();


    let popupShown = false;

    const createCanvasPopup = document.getElementById("create-canvas-popup")!;

    const newBtn = document.getElementById("new")!;
    newBtn.addEventListener("click", () => {
        popupShown = !popupShown;
        let visibility = popupShown ? "visible" : "hidden";
        createCanvasPopup.style.visibility = visibility;
    });

    const widthInput = document.querySelector<HTMLInputElement>("#width")!;
    const heightInput = document.querySelector<HTMLInputElement>("#height")!;


    document.getElementById("new-drawing")!.addEventListener("click", () => {
        app.drawing = new Drawing(Number(widthInput.value), Number(heightInput.value));
        drawing = app.drawing;
        attachDrawingListeners();
        rebuildCanvasStack();
    });

    let colorPickerHeld = false;
    let hueSliderHeld = false;

    const output = document.getElementById("output")!;
    const colorPicker = document.getElementById("color-picker")!;
    const backgroundHue = document.getElementById("hue")!;
    const hueSlider = document.getElementById("hue-slider")!;
    const hueWindow = document.getElementById("hue-window")!;
    const pointer = document.getElementById("pointer")!;


    const update_color_ui = (hsv: HSV) => {
        output.style.backgroundColor = hsvToRGB(hsv).toString();
        backgroundHue.style.backgroundColor = `${hsvToRGB({h:hsv.h, s:255, v:255})}`;
        pointer.style.left = `${(hsv.s / 255) * 100}%`;
        pointer.style.bottom = `${(hsv.v / 255) * 100}%`;
        hueWindow.style.left = `${(hsv.h / 255) * 100}%`;
    };

    const set_hsv = (hsv : HSV) => {
        editor.hsv = hsv;
        update_color_ui(hsv)
    };

    update_color_ui(editor.hsv);

    root.addEventListener("pointermove", (e: PointerEvent) => {
        if (!colorPickerHeld) {
            return;
        }

        const [offsetX, offsetY] = offsetPos(colorPicker, e.x, e.y);

        const x = clamp(offsetX / colorPicker.clientWidth, 0, 1);
        const y = clamp(1 - offsetY / colorPicker.clientWidth, 0, 1);

        let newHsv = editor.hsv;
        newHsv.s = x * 255;
        newHsv.v = y * 255;
        set_hsv(newHsv);
    });


    root.addEventListener("pointermove", (e: PointerEvent) => {
        if (!hueSliderHeld) {
            return;
        }

        let x = e.x - hueSlider.getBoundingClientRect().left;
        x /= hueSlider.clientWidth;
        x = clamp(x, 0, 1);

        let newHsv = editor.hsv;
        newHsv.h = x * 255;
        set_hsv(newHsv);
    });

    colorPicker.addEventListener("pointerdown", (e: PointerEvent) => {
        colorPickerHeld = true;

        const [offsetX, offsetY] = offsetPos(colorPicker, e.x, e.y);

        let newHsv = editor.hsv;
        newHsv.s = (offsetX / colorPicker.clientWidth) * 255;
        newHsv.v = (1 - offsetY / colorPicker.clientHeight) * 255;
        set_hsv(newHsv);
    });

    hueSlider.addEventListener("pointerdown", (e: PointerEvent) => {
        hueSliderHeld = true;

        let offsetX = e.x - hueSlider.getBoundingClientRect().left;
        const x = offsetX / hueSlider.clientWidth;

        let newHsv = editor.hsv;
        newHsv.h = x * 255;
        set_hsv(newHsv);
    });

    root.addEventListener("pointerup", () => {
        colorPickerHeld = false;
        hueSliderHeld = false;
    });

    root.addEventListener("pointercancel", () => {
        colorPickerHeld = false;
        hueSliderHeld = false;
    });

    const toolbox = document.getElementById("toolbox")!;
    let html = "";
    for (let tool in Tool) {
        if (isNaN(Number(tool))) {
            continue;
        }

        const style = (editor.selectedTool === Number(tool)) ? "selected" : "unselected";
        const id = `tool-${tool}`;
        html += `
        <button id=${id} class="${style} m-1 bg-bg1 py-1 px-2 rounded">${Tool[tool]}</button>
        `;
    }
    toolbox.innerHTML = html;

    const update_tools_ui = (last_selected: Tool, current_selected: Tool) => {
        const last_button = toolbox.querySelector<HTMLButtonElement>(`#tool-${last_selected}`)!
        last_button.className = last_button.className.replace("selected", "unselected");

        const current_button = toolbox.querySelector<HTMLButtonElement>(`#tool-${current_selected}`)!
        current_button.className = last_button.className.replace("unselected", "selected");
    }

    for (let tool in Tool) {
        if (isNaN(Number(tool))) {
            continue;
        }

        toolbox
            .querySelector(`#tool-${tool}`)
            ?.addEventListener("click", () => {
                const new_selected = Number(tool);
                update_tools_ui(editor.selectedTool, new_selected)
                editor.selectedTool = new_selected;
            });
    }

    
    let pointer_held = false;

    rebuild(drawing, mainCtx);

    let lastPointerEvent: PointerEvent | undefined;

    canvasField.addEventListener("pointermove", (e:PointerEvent) => {
        lastPointerEvent = e;
        if (!pointer_held) {
            return;
        }

        const thing: CanvasCtx = {
            main: canvas,
            mainCtx: mainCtx,
            temp:temp,
            tempCtx: tempCtx,
        }
        onPointerHeld(editor, drawing, e, thing);
    });

    canvasField.addEventListener("wheel", (e: WheelEvent) => {
        onZoom(drawing, e.deltaY/5);
    }, {passive: true});


    const checkMods = (e: KeyboardEvent, mods: string[]): boolean => {
        for (let i = 0; i < mods.length; i++) {
            const mod = mods[i];
            if (!e.getModifierState(mod)) {
                return false;
            }
        }

        return true;
    }

    const getKeyAction = (e: KeyboardEvent, keybinds: Keybind[]): Action | null => {
        const potentialMatches: {action: Action, mod?: string[]}[] = [];
        for (let i = 0; i < keybinds.length; i++) {
            const kb = keybinds[i];
            for (let j = 0; j < kb.keys.length; j ++) {
                const k = kb.keys[j];

                if (k.modifier && !checkMods(e, k.modifier)) {
                    continue;
                }

                if (k.key === e.key.toLowerCase()) {
                    potentialMatches.push({action: kb.action, mod: k.modifier});
                }
            }
        }

        if (potentialMatches.length === 0) {
            return null;
        }
        
        let mostSpecific = 0;

        for (let i = 1; i < potentialMatches.length; i++) {
            const current = potentialMatches[i];
            const max = potentialMatches[mostSpecific];
            const currentModLength = (current.mod !== undefined) ? current.mod.length : 0;
            const maxModLength = (max.mod !== undefined) ? max.mod.length : 0;

            if (currentModLength > maxModLength) {
                mostSpecific = i;
            }
        }

        return potentialMatches[mostSpecific].action;
    }

    root.addEventListener("keydown", (e:KeyboardEvent) => {
        const action = getKeyAction(e, app.keybinds);

        if (action === null) { 
            return;
        }

        switch (action) {
            case Action.zoomIn:
                break;
            case Action.zoomOut:
                break;
            case Action.undo:
                onUndo(drawing);
                break;
            case Action.redo:
                onRedo(drawing);
                break;
            case Action.decreaseBrushSize:
                setBrushSize(editor.brushScale - 10);
                break;
            case Action.increaseBrushSize: 
                setBrushSize(editor.brushScale + 10);
                break;
        }
    });

    const updateCanvasUI = () => {
        console.log(canvasStack);
        canvasStack.style.transform = `
        scale(${drawing.canvasScale}) 
        translate(${drawing.canvasPos.x - 400}px, ${drawing.canvasPos.y - 300}px)
        `;
    }

    updateCanvasUI();
    

    canvasField.addEventListener("pointerdown", () => {
        pointer_held = true;
        onPointerDown(editor);
    });


    const pointerUp = () => {
        if (pointer_held) {
            pointer_held = false;

            const thing: CanvasCtx = {
                main: canvas,
                mainCtx: mainCtx,
                temp:temp,
                tempCtx: tempCtx,
            }
            onPointerUp(editor, drawing, thing);
        }
    }

    root.addEventListener("pointerup", () => {
        pointerUp()
    });

    root.addEventListener("pointerleave", () => {
        pointerUp();
    });
}
