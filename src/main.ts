import App from "./app.ts";

const app = new App();
app.run();

// function interp(pos: Vector) {
//     ctx?.beginPath();
//     ctx?.moveTo(lastPoint.x, lastPoint.y);
//     ctx?.lineTo(pos.x, pos.y);
//     ctx?.stroke();
//
//     lastPoint = { x: pos.x, y: pos.y };
// }
//
// type vector = {
//     x: number;
//     y: number;
// };
//
// let lastPoint: Vector = { x: 0, y: 0 };
//
// const canvas = document.getElementById("canvas") as HTMLCanvasElement;
// const ctx = canvas.getContext("2d");
//
//
// document.addEventListener("keydown", function(e) {
//     if (e.key == "[") {
//         changeScale(scale - 5);
//     }
//     if (e.key == "]") {
//         changeScale(scale + 5);
//     }
// });
//
// function clamp(number: number, min: number, max: number) {
//     return Math.max(min, Math.min(number, max));
// }
//
// function changeScale(value: number) {
//     value = clamp(value, 0, 500);
//     scale = value;
//     if (output) {
//         output.innerText = String(value);
//     }
//     if (scaleSlider) {
//         scaleSlider.value = String(value);
//     }
// }
// const scaleSlider = document.getElementById("scale-slider") as HTMLInputElement;
// const output = document.getElementById("scale-output");
//
// let scale = 10;
//
//
// scaleSlider.oninput = function() {
//     console.log(scaleSlider.value);
//     changeScale(Number(scaleSlider.value));
// };
//
// canvas.addEventListener("pointermove", (e: PointerEvent) => {
//     const ctx = canvas.getContext("2d");
//
// });
