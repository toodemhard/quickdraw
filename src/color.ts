function clamp(number: number, min: number, max: number) {
    return Math.max(min, Math.min(number, max));
}

class HSV {
    h: number;
    s: number;
    v: number;

    constructor(h: number, s: number, v: number) {
        this.h = h;
        this.s = s;
        this.v = v;
    }
}

class RGB {
    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
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
function hsvToRGB(hsv: HSV): RGB {
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

// 1. event
// 2. state
// 3. render

function render(elements: ColorPickerElements, color: HSV) {
    const rgb = hsvToRGB(color);
    const idfk = hsvToRGB(new HSV(color.h, 255, 255));

    elements.output.style.backgroundColor = `rgb(${rgb.r},${rgb.g}, ${rgb.b})`;
    elements.satGradient.style.backgroundImage = `linear-gradient(90deg, white, rgb(${idfk.r}, ${idfk.g}, ${idfk.b}))`;
    elements.pointer.style.left = `${(color.s / 255) * 100}%`;
    elements.pointer.style.bottom = `${(color.v / 255) * 100}%`;
    elements.hueWindow.style.left = `${(color.h / 255) * 100}%`;
}

class ColorPickerElements {
    colorPicker = document.getElementById("color-picker") as HTMLElement;
    satGradient = document.getElementById("saturation") as HTMLElement;
    hueSlider = document.getElementById("hue-slider") as HTMLElement;
    hueWindow = document.getElementById("hue-window") as HTMLElement;
    output = document.getElementById("output") as HTMLElement;
    pointer = document.getElementById("pointer") as HTMLElement;
}

export function offsetPos(
    el: HTMLElement,
    x: number,
    y: number,
): [number, number] {
    const rect = el.getBoundingClientRect();
    return [x - rect.left, y - rect.top];
}

const elements = new ColorPickerElements();

//state module
export class ColorPicker {
    static hsv = new HSV(0, 255, 255);
    static rgb = hsvToRGB(ColorPicker.hsv);

    static start() {
        let colorPickerHeld = false;
        let hueSliderHeld = false;

        render(elements, this.hsv);

        const colorPicker = elements.colorPicker;
        document.addEventListener("pointermove", (e: PointerEvent) => {
            if (!colorPickerHeld) {
                return;
            }

            const [offsetX, offsetY] = offsetPos(colorPicker, e.x, e.y);

            const x = clamp(offsetX / elements.colorPicker.clientWidth, 0, 1);
            const y = clamp(
                1 - offsetY / elements.colorPicker.clientWidth,
                0,
                1,
            );

            let hsv = this.hsv;
            hsv.s = x * 255;
            hsv.v = y * 255;
            this.updateColor(hsv);
        });

        document.addEventListener("pointermove", (e: PointerEvent) => {
            if (!hueSliderHeld) {
                return;
            }
            let x = e.x - elements.hueSlider.getBoundingClientRect().left;
            x /= elements.hueSlider.clientWidth;
            x = clamp(x, 0, 1);

            let hsv = this.hsv;
            hsv.h = x * 255;
            this.updateColor(hsv);
        });

        colorPicker.addEventListener("pointerdown", (e: PointerEvent) => {
            colorPickerHeld = true;

            const [offsetX, offsetY] = offsetPos(colorPicker, e.x, e.y);

            let hsv = this.hsv;
            hsv.s = (offsetX / colorPicker.clientWidth) * 255;
            hsv.v = (1 - offsetY / colorPicker.clientHeight) * 255;
            this.updateColor(hsv);
        });

        const hueSlider = elements.hueSlider;
        hueSlider.addEventListener("pointerdown", (e: PointerEvent) => {
            hueSliderHeld = true;

            let offsetX = e.x - hueSlider.getBoundingClientRect().left;
            const x = offsetX / hueSlider.clientWidth;

            let hsv = this.hsv;
            hsv.h = x * 255;
            console.log(e.offsetX, hsv.h);
            this.updateColor(hsv);
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

    static updateColor(hsv: HSV) {
        this.hsv = hsv;
        this.rgb = hsvToRGB(this.hsv);
        render(elements, this.hsv);
    }
}
