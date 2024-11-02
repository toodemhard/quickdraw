import {
    For,
    Index,
    JSXElement,
    createEffect,
    createSignal,
    onCleanup,
    onMount,
    useContext,
} from "solid-js";
import type { JSX } from "solid-js";

import {
    CanvasCtx,
    Drawing,
    Editor,
    Tool,
    onPointerDown,
    onPointerHeld,
    onPointerUp,
    onRedo,
    onUndo,
    rebuild,
} from "../draw";
import { HSV, clamp, hsvToRGB } from "../color";
import { createMutable, createStore } from "solid-js/store";
import { A } from "@solidjs/router";
import { Action, Keybind, getKeyAction } from "../keybindings";
import { appContext } from "..";
import { basePath } from "../base_path";

function Slider(props: {
    value: number;
    max: number;
    onInput: (value: number) => void;
}) {
    let slider!: HTMLDivElement;
    let held = false;

    const onPointerDown = (e: PointerEvent) => {
        held = true;
        onMove(e);
    };

    const onMove = (e: PointerEvent) => {
        const rect = slider.getBoundingClientRect();
        props.onInput(
            Math.round(
                clamp((e.clientX - rect.x) / slider.clientWidth, 0, 1) *
                    props.max,
            ),
        );
    };

    document.addEventListener("pointermove", (e: PointerEvent) => {
        if (!held) {
            return;
        }
        onMove(e);
    });

    document.addEventListener("pointerup", () => {
        held = false;
    });
    document.addEventListener("pointerleave", () => {
        held = false;
    });

    return (
        <div
            ref={slider}
            onPointerDown={onPointerDown}
            class="bg-bg1 relative h-7 w-full overflow-hidden rounded-md bg-neutral-800"
        >
            <div
                style={{ width: `${(props.value / props.max) * 100}%` }}
                class="h-full w-3/5 bg-blue-700"
            ></div>
            <span
                id="slider-value"
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
                {props.value} px
            </span>
        </div>
    );
}

export default function Canvas() {
    const app = useContext(appContext)!;
    const editor = app.editor;
    const drawing = app.drawing;

    const [newIsOpen, setNewIsOpen] = createSignal(false);

    const tools: string[] = [];
    for (const tool in Tool) {
        if (!isNaN(Number(tool))) {
            continue;
        }

        tools.push(tool);
    }
    const [idk] = createSignal(tools);

    const canvasTransform = () => {
        return `
        translate(${-drawing.width / 2}px, ${-drawing.height / 2}px)
        scale(${drawing.canvasScale})
        translate(${drawing.canvasPos.x}px, ${drawing.canvasPos.y}px)
        `;
    };
    const rgb = () => hsvToRGB(editor.hsv).toString();
    const hueRGB = () =>
        hsvToRGB({ h: editor.hsv.h, s: 255, v: 255 }).toString();

    let localRoot!: HTMLDivElement;

    let colorPicker!: HTMLDivElement;
    let hueSlider!: HTMLDivElement;

    let mainCanvas!: HTMLCanvasElement;
    let tempCanvas!: HTMLCanvasElement;

    let mainCtx!: CanvasRenderingContext2D;
    let tempCtx!: CanvasRenderingContext2D;

    let ctx: CanvasCtx;

    let canvasHeld = false;
    let colorPickerHeld = false;
    let hueSliderHeld = false;

    const abortController = new AbortController;
    const abortSignal = abortController.signal;

    onMount(() => {
        mainCtx = mainCanvas.getContext("2d")!;
        tempCtx = tempCanvas.getContext("2d")!;

        ctx = {
            main: mainCanvas,
            temp: tempCanvas,
            mainCtx: mainCtx,
            tempCtx: tempCtx,
        };

        rebuild(drawing, ctx.mainCtx);
    });

    const colorPickerOnMove = (e: PointerEvent) => {
        if (!colorPickerHeld) {
            return;
        }

        const rect = colorPicker.getBoundingClientRect();

        const x = clamp((e.x - rect.left) / colorPicker.clientWidth, 0, 1);
        const y = clamp(1 - (e.y - rect.top) / colorPicker.clientHeight, 0, 1);

        const hsv = editor.hsv;
        hsv.s = x * 255;
        hsv.v = y * 255;
    };

    const sliderOnInput = (value: number) => {
        editor.brushSize = value;
    };

    const hueSliderOnMove = (e: PointerEvent) => {
        if (!hueSliderHeld) {
            return;
        }

        const rect = hueSlider.getBoundingClientRect();

        const x = clamp((e.x - rect.left) / hueSlider.clientWidth, 0, 1);

        editor.hsv.h = x * 255;
    };

    const colorPickerOnPointerDown: JSX.EventHandler<
        HTMLDivElement,
        PointerEvent
    > = (e) => {
        colorPickerHeld = true;
        colorPickerOnMove(e);
    };

    const hueSliderOnPointerDown: JSX.EventHandler<
        HTMLDivElement,
        PointerEvent
    > = (e) => {
        hueSliderHeld = true;
        hueSliderOnMove(e);
    };

    const canvasOnPointerMove = (e: PointerEvent) => {
        if (!canvasHeld) {
            return;
        }

        onPointerHeld(editor, drawing, e, ctx);
    };

    const canvasOnPointerDown: JSX.EventHandler<
        HTMLDivElement,
        PointerEvent
    > = (e) => {
        canvasHeld = true;
        onPointerDown(editor);
        canvasOnPointerMove(e);
    };

    const canvasOnPointerUp = () => {
        canvasHeld = false;
        onPointerUp(editor, drawing, ctx);
    };

    const selectTool = (i: number) => {
        editor.selectedTool = i;
    };


    drawing.historyEvent.subscribe(() => {
        rebuild(drawing, ctx.mainCtx);
    })

    const keyToAction = (e:KeyboardEvent) => {
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
                editor.brushSize -= 10;
                break;
            case Action.increaseBrushSize: 
                editor.brushSize += 10;
                break;
            case Action.pan:
                selectTool(Tool.Pan);
                break;
            case Action.squareBrush:
                selectTool(Tool.Square);
                break;
            case Action.zoom:
                selectTool(Tool.Zoom);
                break;
        }
    }

    document.addEventListener("pointermove", canvasOnPointerMove, {signal: abortSignal});
    document.addEventListener("pointermove", colorPickerOnMove, {signal: abortSignal});
    document.addEventListener("pointermove", hueSliderOnMove, {signal: abortSignal});
    document.addEventListener("pointerup", () => {
        canvasOnPointerUp();
        colorPickerHeld = false;
        hueSliderHeld = false;
    }, {signal: abortSignal});
    document.addEventListener("pointerleave", () => {
        canvasOnPointerUp();
        colorPickerHeld = false;
        hueSliderHeld = false;
    }, {signal: abortSignal});
    document.addEventListener("keydown", keyToAction, {signal: abortSignal});

    // document.addEventListener("keydown", (e:KeyboardEvent) => {
    //     console.log("aksdfkjlh")
    // });

    onCleanup(() => {
        abortController.abort();
    })

    const exportHandler: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (e) => {
        console.log("export!");
        const imageUrl = mainCanvas.toDataURL("image/png");
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`<img src=${imageUrl} />`);
            newWindow.document.body.style.backgroundColor = "#0f0f0f";
        }
    };

    return (
        <div ref={localRoot} class="flex h-screen flex-col">
            <div class="flex w-full p-2">
                <button
                    // onClick={() => setNewIsOpen(!newIsOpen())}
                    class="text-2xl hover:bg-neutral-800 px-2 py-1"
                >
                    New
                </button>
                <button 
                    class="text-2xl hover:bg-neutral-800 px-2 py-1"
                >Save</button>
                <button 
                    class="text-2xl hover:bg-neutral-800 px-2 py-1"
                >Open</button>
                <button 
                    class="text-2xl hover:bg-neutral-800 px-2 py-1"
                onClick={exportHandler} >Export</button>
                <A
                    href={basePath + "/config"}
                    class="text-2xl hover:bg-neutral-800 px-2 py-1"
                >
                    Config
                </A>
            </div>

            <div class="flex flex-1">
                <div
                    onPointerDown={canvasOnPointerDown}
                    id="canvas-field"
                    class="bg-bg2 relative h-full w-full cursor-crosshair overflow-hidden"
                >
                    <div
                        style={{ transform: canvasTransform() }}
                        id="canvas-stack"
                        class="absolute left-1/2 top-1/2 box-content h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2"
                    >
                        <div
                        class="absolute w-full h-full border-[2px] border-neutral-600"
                        >
                        </div>
                        <canvas
                            ref={mainCanvas}
                            width={drawing.width}
                            height={drawing.height}
                            class="absolute"
                        ></canvas>
                        <canvas
                            ref={tempCanvas}
                            width={drawing.width}
                            height={drawing.height}
                            class="absolute"
                        ></canvas>
                    </div>

                    {/* <div>{editor.hsv.h}</div>
                    <div>
                        {drawing.canvasPos.x} {drawing.canvasPos.y}
                    </div>
                    <div>{rgb()}</div> */}
                </div>
                <div class="right-0 h-full select-none p-9">
                    <div class="flex flex-col gap-4">
                        <div
                            id="output"
                            style={{ "background-color": rgb() }}
                            class="h-8 rounded-md"
                            draggable="false"
                        ></div>
                        <div
                            onPointerDown={colorPickerOnPointerDown}
                            ref={colorPicker}
                            id="color-picker"
                            class="relative h-72 w-72 select-none"
                        >
                            <div
                                id="hue"
                                style={{ "background-color": hueRGB() }}
                                class="absolute h-full w-full rounded-md"
                            ></div>
                            <div
                                id="saturation"
                                class="absolute h-full w-full rounded-md"
                            ></div>
                            <div
                                id="brightness"
                                class="absolute h-full w-full translate-y-px rounded-md"
                            ></div>
                            <div
                                style={{
                                    left: `${(editor.hsv.s / 255) * 100}%`,
                                    bottom: `${(editor.hsv.v / 255) * 100}%`,
                                }}
                                id="pointer"
                                class="absolute z-20 h-4 w-4 -translate-x-1/2 translate-y-1/2 select-none rounded-full border-2 border-white"
                            ></div>
                        </div>
                        <div
                            onPointerDown={hueSliderOnPointerDown}
                            ref={hueSlider}
                            id="hue-slider"
                            class="relative z-0 my-2 h-8 w-72 rounded-md"
                        >
                            <div
                                style={{
                                    left: `${(editor.hsv.h / 255) * 100}%`,
                                }}
                                id="hue-window"
                                class="absolute top-1/2 z-10 h-12 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white"
                            ></div>
                        </div>

                        <Slider
                            value={editor.brushSize}
                            max={150}
                            onInput={sliderOnInput}
                        />

                        <div class="flex gap-4 w-72 flex-wrap">
                            <Index each={idk()}>
                                {(item, index) => (
                                    <button
                                        onClick={() => {
                                            selectTool(index);
                                        }}
                                        class="rounded-md py-1 px-2"
                                        classList={{
                                            "bg-neutral-800":
                                                index !== editor.selectedTool,
                                            "bg-white":
                                                index === editor.selectedTool,
                                            "text-primary-0":
                                                index === editor.selectedTool,
                                        }}
                                    >
                                        {item()}
                                    </button>
                                )}
                            </Index>
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{ visibility: newIsOpen() ? "visible" : "hidden" }}
                id="create-canvas-popup"
                class="invisible absolute bottom-0 left-0 right-0 top-0 m-auto h-fit w-fit rounded-lg bg-primary-1 p-8"
            >
                <div>
                    <span>width:</span>{" "}
                    <input id="width" type="number" class="bg-primary-0" />{" "}
                    <span>px</span>
                </div>
                <div>
                    <span>height:</span>{" "}
                    <input id="height" type="number" class="bg-primary-0" />{" "}
                    <span>px</span>
                </div>

                <button class="mx-auto rounded-full bg-white p-2 px-4 text-xl font-bold text-primary-0">
                    Create
                </button>
            </div>
        </div>
    );
}
