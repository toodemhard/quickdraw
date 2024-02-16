import { ColorOutput, ColorPicker, HSV, hsvToRGB } from "./color";
import * as Draw from "./draw";
import { createMemo, createSignal } from "./lib/reactivity";

export function run() {
    const [hsv, setHsv] = createSignal(new HSV(0, 255, 255));
    const rgb = createMemo(() => hsvToRGB(hsv()));

    Draw.Canvas(rgb);
    ColorOutput(rgb);
    ColorPicker(hsv, setHsv);
}
