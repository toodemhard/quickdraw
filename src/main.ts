import './style.css'

function drawEvent(e: MouseEvent) {
  if (e.buttons !== 1) {
    return;
  }
  interp({ x: e.offsetX, y: e.offsetY });
  // ctx?.beginPath();
  // ctx?.arc(e.offsetX, e.offsetY, 2, 0, Math.PI * 2);
  // ctx?.fill();
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
}

let lastPoint: Vector = { x: 0, y: 0 };
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

canvas.addEventListener("mousemove", drawEvent);

// ctx?.arc(50, 50, 20, 0, Math.PI * 2);
// ctx?.fill();
// console.log("jkadsjhf");
