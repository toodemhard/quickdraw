import { HSV, clamp, hsvToRGB, offsetPos } from "./color";
import { Drawing } from "./draw";
import { Context } from "./router";

export function index_view(c: Context): HTMLCollection {
    const draw = new Drawing;

    const template = document.createElement("template");
    template.innerHTML = `
<div class="flex h-screen flex-col">
    <div class="flex w-full gap-2 p-2">
        <button class="text-2xl">New</button>
        <button class="text-2xl">Save</button>
        <button class="text-2xl">Open</button>
        <button class="text-2xl">Export</button>
    </div>
    <csr-link href="/settings">Settings</csr-link>

    <div class="flex flex-1">
        <div id="canvas-field" class="relative w-full overflow-hidden">
            <div id="canvas-stack" class="absolute left-1/2 top-1/2">
                <canvas id="canvas" width="800" height="600" class="absolute box-border border-2 border-black"></canvas>
                <canvas id="temp" width="800" height="600" class="absolute box-border border-2 border-red-600"></canvas>
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
                <input type="range" id="scale-slider" />
                <div id="hue-slider" class="relative z-0 my-2 h-8 w-72 rounded-md">
                    <div id="hue-window"
                        class="absolute top-1/2 z-10 h-12 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white">
                    </div>
                </div>

                <div id="toolbox" class="flex w-72 flex-wrap"></div>
            </div>
        </div>
    </div>
</div>
`;
    const root = template.content;

    let colorPickerHeld = false;
    let hueSliderHeld = false;

    const output = root.getElementById("output")!;
    const colorPicker = root.getElementById("color-picker")!;
    const backgroundHue = root.getElementById("hue")!;
    const hueSlider = root.getElementById("hue-slider")!;
    const hueWindow = root.getElementById("hue-window")!;
    const pointer = root.getElementById("pointer")!;


    const update_color_ui = (hsv: HSV) => {
        output.style.backgroundColor = hsvToRGB(hsv).toString();
        backgroundHue.style.backgroundColor = `${hsvToRGB(new HSV(hsv.h, 255, 255))}`;
        pointer.style.left = `${(hsv.s / 255) * 100}%`;
        pointer.style.bottom = `${(hsv.v / 255) * 100}%`;
        hueWindow.style.left = `${(hsv.h / 255) * 100}%`;
    };

    const set_hsv = (hsv : HSV) => {
        draw.hsv = hsv;
        update_color_ui(hsv)
    };

    update_color_ui(draw.hsv);

    document.addEventListener("pointermove", (e: PointerEvent) => {
        if (!colorPickerHeld) {
            return;
        }

        const [offsetX, offsetY] = offsetPos(colorPicker, e.x, e.y);

        const x = clamp(offsetX / colorPicker.clientWidth, 0, 1);
        const y = clamp(1 - offsetY / colorPicker.clientWidth, 0, 1);

        let newHsv = draw.hsv;
        newHsv.s = x * 255;
        newHsv.v = y * 255;
        set_hsv(newHsv);
    });

    document.addEventListener("pointermove", (e: PointerEvent) => {
        if (!hueSliderHeld) {
            return;
        }

        let x = e.x - hueSlider.getBoundingClientRect().left;
        x /= hueSlider.clientWidth;
        x = clamp(x, 0, 1);

        let newHsv = draw.hsv;
        newHsv.h = x * 255;
        set_hsv(newHsv);
    });

    colorPicker.addEventListener("pointerdown", (e: PointerEvent) => {
        colorPickerHeld = true;

        const [offsetX, offsetY] = offsetPos(colorPicker, e.x, e.y);

        let newHsv = draw.hsv;
        newHsv.s = (offsetX / colorPicker.clientWidth) * 255;
        newHsv.v = (1 - offsetY / colorPicker.clientHeight) * 255;
        set_hsv(newHsv);
    });

    hueSlider.addEventListener("pointerdown", (e: PointerEvent) => {
        hueSliderHeld = true;

        let offsetX = e.x - hueSlider.getBoundingClientRect().left;
        const x = offsetX / hueSlider.clientWidth;

        let newHsv = draw.hsv;
        newHsv.h = x * 255;
        set_hsv(newHsv);
    });

    document.addEventListener("pointerup", () => {
        colorPickerHeld = false;
        hueSliderHeld = false;
    });

    document.addEventListener("pointercancel", () => {
        colorPickerHeld = false;
        hueSliderHeld = false;
    });

    return template.content.children!;
}
