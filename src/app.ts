import { ColorPickerUI } from "./color";
import "./scale";

export default class App {
    static run() {
        ColorPickerUI.start();

        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
}

// function drawEvent(e: PointerEvent) {
//     // console.log(`${e.x}, ${e.y}`);
//     // interp({ x: e.x, y: e.y });
//     circleBrush({ x: e.offsetX, y: e.offsetY }, e.pressure);
//     // if (ctx) {
//     //   console.log("jf");
//     // }
// }
//
//
//
// function circleBrush(pos: Vector, pressure: number) {
//     if (ctx) {
//         ctx.fillStyle = "rgb(0 0 0)"
//     }
//
//     ctx?.beginPath();
//     ctx?.arc(pos.x, pos.y, scale * pressure, 0, Math.PI * 2);
//     ctx?.fill();
// }
