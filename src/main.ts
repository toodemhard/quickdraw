import { wtf } from "./color";

function drawEvent(e: PointerEvent) {
    // console.log(`${e.offsetX}, ${e.offsetY}`);
    // interp({ x: e.x, y: e.y });
    circleBrush({ x: e.offsetX, y: e.offsetY }, e.pressure);
    // if (ctx) {
    //   console.log("jf");
    // }
}

let setint: number;

function onMouseDown(e: PointerEvent) {
    lastPoint = { x: e.offsetX, y: e.offsetY };
    setint = setInterval(function () {
        drawEvent(idk);
    }, 1);
}

function onMouseUp() {
    console.log("up");
    clearInterval(setint);
}

function circleBrush(pos: Vector, pressure: number) {
    console.log(pressure);
    // if (ctx) {
    //   ctx.fillStyle = "rgb(0 255 255)"
    // }

    ctx?.beginPath();
    ctx?.arc(pos.x, pos.y, scale * pressure, 0, Math.PI * 2);
    ctx?.fill();
}

function interp(pos: Vector) {
    ctx?.beginPath();
    ctx?.moveTo(lastPoint.x, lastPoint.y);
    ctx?.lineTo(pos.x, pos.y);
    ctx?.stroke();

    lastPoint = { x: pos.x, y: pos.y };
}

// function squareBrush() {
//
// }

type Vector = {
    x: number;
    y: number;
};

let lastPoint: Vector = { x: 0, y: 0 };

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const scaleSlider = document.getElementById("scale-slider") as HTMLInputElement;
const output = document.getElementById("scale-output");

let scale = 0;

document.addEventListener("keydown", function (e) {
    if (e.key == "[") {
        changeScale(scale - 5);
    }
    if (e.key == "]") {
        changeScale(scale + 5);
    }
});

function clamp(number: number, min: number, max: number) {
    return Math.max(min, Math.min(number, max));
}

function changeScale(value: number) {
    value = clamp(value, 0, 500);
    scale = value;
    if (output) {
        output.innerText = String(value);
    }
    if (scaleSlider) {
        scaleSlider.value = String(value);
    }
}

scaleSlider.oninput = function () {
    console.log(scaleSlider.value);
    changeScale(Number(scaleSlider.value));
};

if (ctx) {
    ctx.lineWidth = 2;
}

// canvas.addEventListener("mousemove", drawEvent);
// canvas.addEventListener("pointerdown", onMouseDown);
// canvas.addEventListener("pointerup", onMouseUp);
// canvas.addEventListener("pointerleave", onMouseUp);
// ctx?.arc(50, 50, 20, 0, Math.PI * 2);
// ctx?.fill();
// console.log("jkadsjhf");

let idk: PointerEvent;

canvas.onpointermove = function (e: PointerEvent) {
    if (e.pressure > 0) {
        drawEvent(e);
    }
};

wtf();
