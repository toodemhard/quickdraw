export function clamp(number: number, min: number, max: number) {
    return Math.max(min, Math.min(number, max));
}

export type HSV = {
    h: number;
    s: number;
    v: number;
};

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
    let rgb = new RGB(0, 0, 0);

    switch (true) {
        case H < 1:
            rgb = new RGB(c, x, 0);
            break;
        case H < 2:
            rgb = new RGB(x, c, 0);
            break;
        case H < 3:
            rgb = new RGB(0, c, x);
            break;
        case H < 4:
            rgb = new RGB(0, x, c);
            break;
        case H < 5:
            rgb = new RGB(x, 0, c);
            break;
        case H < 6:
            rgb = new RGB(c, 0, x);
            break;
    }

    const m = v - c;
    const { r: r1, g: g1, b: b1 } = rgb;
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
