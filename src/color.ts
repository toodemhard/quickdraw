function clamp(number: number, min: number, max: number) {
    return Math.max(min, Math.min(number, max));
}

class HSV {
    h: number
    s: number
    v: number

    constructor(h: number, s: number, v: number) {
        this.h = h;
        this.s = s;
        this.v = v;
    }
}

class RGB {
    r: number
    g: number
    b: number

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

function multiply(color: RGB, scale: number): RGB {
    color.r *= scale;
    color.g *= scale;
    color.b *= scale;
    return color;
}

//source: https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
//h:0-255 s:0-1 v:0-1
//r:0-1 g:0-1 b:0-1
function HSV_to_RGB(hsv: HSV): RGB {
    const { h, s, v } = hsv;
    const c = v * s;
    const H = h / 42.5;
    const x = c * (1 - Math.abs(H % 2 - 1));
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
    return new RGB(r1 + m, g1 + m, b1 + m);
}

let pointerPos: PointerEvent;

document.addEventListener("pointermove", (e: PointerEvent) => {
    pointerPos = e;
})

class ColorPickerUI {

    constructor() {

        const colorPicker = document.getElementById("color-picker");
        // const colorOutput = document.getElementById("hex-output");
        // const hueSlider = document.getElementById("hu")

        let setInt: number
        colorPicker?.addEventListener("pointerdown", (e: PointerEvent) => {
            setInt = setInterval(function() {
                console.log("asdf");
                pointerPos.x
                const rect = colorPicker.getBoundingClientRect();

                // rect.top - 

                const x = clamp(e.offsetX / colorPicker.clientWidth, 0, 1);
                const y = clamp(1 - e.offsetY / colorPicker.clientWidth, 0, 1);
                on_SV_update(x, y);
                updatePointer(x, y);

            }, 20);

        })

        colorPicker?.addEventListener("pointerup", () => {
            clearInterval(setInt)
        })
    }

}

function on_SV_update(x: number, y: number) {

    const pos = new HSV(90, x, y);
    // console.log(pos);
    const res = multiply(HSV_to_RGB(pos), 255);

    const colorOutput = document.getElementById("hex-output");
    if (colorOutput) {
        colorOutput.style.backgroundColor = `rgb(${res.r},${res.g},${res.b}`;
    }

}

function updatePointer(x: number, y: number) {
    const pointer = document.getElementById("pointer");
    if (pointer) {
        pointer.style.left = `${x * 100}%`;
        pointer.style.bottom = `${y * 100}%`;

    }
}

const x = new ColorPickerUI();
