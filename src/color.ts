import { Getter, Setter, createEffect } from "./lib/reactivity";

function clamp(number: number, min: number, max: number) {
    return Math.max(min, Math.min(number, max));
}

export class HSV {
    h: number;
    s: number;
    v: number;

    constructor(h: number, s: number, v: number) {
        this.h = h;
        this.s = s;
        this.v = v;
    }
}

export class RGB {
    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    toString(): string {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }
}

function scale(color: RGB, scale: number): RGB {
    color.r *= scale;
    color.g *= scale;
    color.b *= scale;
    return color;
}

//source: https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
//h:0-255 s:0-1 v:0-1
//r:0-1 g:0-1 b:0-1
export function hsvToRGB(hsv: HSV): RGB {
    let { h, s, v } = hsv;
    v /= 255;
    s /= 255;
    if (h == 255) {
        h = 0;
    }
    const c = v * s;
    const H = h / 42.5;
    const x = c * (1 - Math.abs((H % 2) - 1));
    let rgb1 = new RGB(0, 0, 0);

    switch (true) {
        case H < 1:
            rgb1 = new RGB(c, x, 0);
            break;
        case H < 2:
            rgb1 = new RGB(x, c, 0);
            break;
        case H < 3:
            rgb1 = new RGB(0, c, x);
            break;
        case H < 4:
            rgb1 = new RGB(0, x, c);
            break;
        case H < 5:
            rgb1 = new RGB(x, 0, c);
            break;
        case H < 6:
            rgb1 = new RGB(c, 0, x);
            break;
    }

    const m = v - c;
    const { r: r1, g: g1, b: b1 } = rgb1;
    return scale(new RGB(r1 + m, g1 + m, b1 + m), 255);
}

export function offsetPos(
    el: HTMLElement,
    x: number,
    y: number,
): [number, number] {
    const rect = el.getBoundingClientRect();
    return [x - rect.left, y - rect.top];
}


export function ColorOutput(rgb: Getter<RGB>) {
    const output = document.getElementById("output")!;

    createEffect(() => {
        output.style.backgroundColor = rgb().toString();
    })
}


export function ColorPicker(hsv: Getter<HSV>, setHsv: Setter<HSV>) {
    let colorPickerHeld = false;
    let hueSliderHeld = false;

    const colorPicker = document.getElementById("color-picker")!;
    const satGradient = document.getElementById("saturation")!;
    const hueSlider = document.getElementById("hue-slider")!;
    const hueWindow = document.getElementById("hue-window")!;
    const pointer = document.getElementById("pointer")!;

    createEffect(() => {
        satGradient.style.backgroundImage = `linear-gradient(90deg, white, ${hsvToRGB(new HSV(hsv().h, 255, 255))})`;
        pointer.style.left = `${(hsv().s / 255) * 100}%`;
        pointer.style.bottom = `${(hsv().v / 255) * 100}%`;
        hueWindow.style.left = `${(hsv().h / 255) * 100}%`;

    })

    document.addEventListener("pointermove", (e: PointerEvent) => {
        if (!colorPickerHeld) {
            return;
        }

        const [offsetX, offsetY] = offsetPos(colorPicker, e.x, e.y);

        const x = clamp(offsetX / colorPicker.clientWidth, 0, 1);
        const y = clamp(
            1 - offsetY / colorPicker.clientWidth,
            0,
            1,
        );

        let newHsv = hsv();
        newHsv.s = x * 255;
        newHsv.v = y * 255;
        setHsv(newHsv);
    });

    document.addEventListener("pointermove", (e: PointerEvent) => {
        if (!hueSliderHeld) {
            return;
        }

        let x = e.x - hueSlider.getBoundingClientRect().left;
        x /= hueSlider.clientWidth;
        x = clamp(x, 0, 1);

        let newHsv = hsv();
        newHsv.h = x * 255;
        setHsv(newHsv);
    });

    colorPicker.addEventListener("pointerdown", (e: PointerEvent) => {
        colorPickerHeld = true;

        const [offsetX, offsetY] = offsetPos(colorPicker, e.x, e.y);

        let newHsv = hsv();
        newHsv.s = (offsetX / colorPicker.clientWidth) * 255;
        newHsv.v = (1 - offsetY / colorPicker.clientHeight) * 255;
        setHsv(newHsv);
    });

    hueSlider.addEventListener("pointerdown", (e: PointerEvent) => {
        hueSliderHeld = true;

        let offsetX = e.x - hueSlider.getBoundingClientRect().left;
        const x = offsetX / hueSlider.clientWidth;

        let newHsv = hsv();
        newHsv.h = x * 255;
        setHsv(newHsv);
    });

    document.addEventListener("pointerup", () => {
        colorPickerHeld = false;
        hueSliderHeld = false;
    });

    document.addEventListener("pointercancel", () => {
        colorPickerHeld = false;
        hueSliderHeld = false;
    });
}

