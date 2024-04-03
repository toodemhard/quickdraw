import { For, Index, JSXElement, createEffect, createSignal, onMount, useContext } from "solid-js";
import type { JSX } from "solid-js";

import { CanvasCtx, Drawing, Editor, Tool, onPointerDown, onPointerHeld, onPointerUp } from "../draw";
import { HSV, clamp, hsvToRGB } from "../color";
import { createMutable, createStore } from "solid-js/store";
import { A } from "@solidjs/router";
import { Keybind } from "../keybindings";
import { context } from "..";

function Slider(props: { value: number, max: number, onInput: (value: number)=>void}) {
    let slider!: HTMLDivElement;
    let held = false;

    const onPointerDown = (e: PointerEvent) => {
        held = true;
        onMove(e)
    }

    const onMove = (e:PointerEvent) => {
        const rect = slider.getBoundingClientRect();
        props.onInput(Math.round(clamp((e.clientX - rect.x) / slider.clientWidth, 0, 1) * props.max));
    };

    document.addEventListener("pointermove", (e: PointerEvent) => {
        if (!held) {
            return;
        }
        onMove(e);
    })

    document.addEventListener("pointerup", () => {held = false;})
    document.addEventListener("pointerleave", () => {held = false;})

    return (
        <div ref={slider} onPointerDown={onPointerDown} class="bg-bg1 relative h-7 w-full bg-neutral-800 rounded-md overflow-hidden">
            <div style={{width: `${props.value / props.max * 100}%`}} class="h-full w-3/5 bg-blue-700"></div>
            <span id="slider-value" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {props.value} px
            </span>
        </div>
    );
}

class Sub {
    x: number = 432;
}


class Thing {
    sub: Sub = createMutable(new Sub);
    y: number = 65;
}

function mod(thing: Thing) {
    const sub = thing.sub;
    sub.x++;
}

function modNoRef(thing: Thing) {
    thing.sub.x++;
    thing.y++;
}

export default function Canvas() {
    const editor = createMutable(new Editor);
    const drawing = createMutable(new Drawing(800, 600));

    const [newIsOpen, setNewIsOpen] = createSignal(false);

    const thing = createMutable(
        new Thing
    )

    document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "f") {
            mod(thing);
        }
        if (e.key=== "g") {
            modNoRef(thing);
            console.log(thing.sub.x);
        }
    })

    useContext(context);

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
        translate(${drawing.canvasPos.x }px, ${drawing.canvasPos.y}px)
        `
    }
    const rgb = () => hsvToRGB(editor.hsv).toString();
    const hueRGB = () => hsvToRGB({h: editor.hsv.h, s:255, v:255}).toString();

    let colorPicker!: HTMLDivElement;
    let hueSlider!: HTMLDivElement;

    let mainCanvas!: HTMLCanvasElement;
    let tempCanvas!: HTMLCanvasElement;

    let mainCtx!: CanvasRenderingContext2D;
    let tempCtx!: CanvasRenderingContext2D;

    let ctx: CanvasCtx

    let canvasHeld = false;
    let colorPickerHeld = false;
    let hueSliderHeld = false;


    onMount(() => {
        mainCtx = mainCanvas.getContext("2d")!;
        tempCtx = tempCanvas.getContext("2d")!;

        ctx = {main: mainCanvas, temp: tempCanvas, mainCtx: mainCtx, tempCtx: tempCtx};
    })

    createEffect(() => {
        // console.log(drawing.canvasPos.x);
        // console.log(rgb());
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
    }

    const sliderOnInput = (value: number) => {
        editor.brushSize = value;
    }

    const hueSliderOnMove = (e: PointerEvent) => {
        if (!hueSliderHeld) {
            return;
        }

        const rect = hueSlider.getBoundingClientRect();

        const x = clamp((e.x - rect.left) / hueSlider.clientWidth, 0, 1);

        editor.hsv.h = x * 255;
    }


    const colorPickerOnPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (e) => {
        colorPickerHeld = true;
        colorPickerOnMove(e)
    }


    const hueSliderOnPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (e) => {
        hueSliderHeld = true;
        hueSliderOnMove(e)
    }

    const canvasOnPointerMove = (e: PointerEvent) => {
        if (!canvasHeld) {
            return;
        }

        onPointerHeld(editor, drawing, e, ctx);
    }

    const canvasOnPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (e) => {
        canvasHeld = true;
        onPointerDown(editor);
        canvasOnPointerMove(e);
    }

    const canvasOnPointerUp = () => {
        canvasHeld = false;
        onPointerUp(editor, drawing, ctx);
    }

    const selectTool = (i: number) => {
        editor.selectedTool = i
    }

    document.addEventListener("pointermove", canvasOnPointerMove);
    document.addEventListener("pointermove", colorPickerOnMove);
    document.addEventListener("pointermove", hueSliderOnMove);
    document.addEventListener("pointerup", () => {
        canvasOnPointerUp();
        colorPickerHeld = false;
        hueSliderHeld = false;
    });
    document.addEventListener("pointerleave", () => {
        canvasOnPointerUp();
        colorPickerHeld = false
        hueSliderHeld = false;
    });

    return (
        <div class="flex h-screen flex-col">
            <div class="flex w-full gap-2 p-2">
                <button
                onClick={() => setNewIsOpen(!newIsOpen())}
                class="text-2xl">
                    New
                </button>
                <button class="text-2xl">Save</button>
                <button class="text-2xl">Open</button>
                <button class="text-2xl">Export</button>
                <A href="/config" class="text-2xl text-neutral-400 hover:text-white">Config</A>
            </div>

            <div class="flex flex-1">
                <div
                onPointerDown={canvasOnPointerDown}
                    id="canvas-field"
                    class="bg-bg2 relative w-full cursor-cell overflow-hidden h-full"
                >
                    <div
                        style={{transform: canvasTransform()}}
                        id="canvas-stack"
                        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 box-content h-[600px] w-[800px] border-[2px] border-red-600"
                    >
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

                    <div>{editor.hsv.h}</div>
                    <div>{drawing.canvasPos.x} {drawing.canvasPos.y}</div>
                    <div>{rgb()}</div>
                </div>
                <div class="right-0 h-full select-none p-9">
                    <div class="flex flex-col gap-3.5">
                        <div
                            id="output"
                            style={{"background-color": rgb()}}
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
                                style={{"background-color": hueRGB()}}
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
                                    "left": `${editor.hsv.s / 255 * 100}%`,
                                    "bottom": `${editor.hsv.v / 255 * 100}%`,
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
                                style={{left: `${editor.hsv.h / 255 * 100}%`}}
                                id="hue-window"
                                class="absolute top-1/2 z-10 h-12 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white"
                            ></div>
                        </div>

                        <Slider value={editor.brushSize} max={150} onInput={sliderOnInput} />

                        <div class="flex w-72 flex-wrap">
                            <Index each={idk()}>
                                {(item, index) => (
                                <button
                                onClick={() => {selectTool(index)}}
                                class="rounded-md p-2 m-2"
                                classList={{
                                    "bg-neutral-800": index !== editor.selectedTool,
                                    "bg-white": index === editor.selectedTool,
                                    "text-primary-0": index === editor.selectedTool,
                                }}
                                >{item()}</button>
                                )}
                            </Index>
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{visibility: newIsOpen() ? "visible": "hidden"}}
                id="create-canvas-popup"
                class="bg-primary-1 invisible absolute bottom-0 left-0 right-0 top-0 m-auto h-fit w-fit p-8 rounded-lg"
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

                <button
                    class="text-primary-0 rounded-full mx-auto bg-white p-2 px-4 text-xl font-bold"
                >
                    Create
                </button>
            </div>
        </div>
    );
}
