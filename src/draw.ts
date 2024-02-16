import { RGB, offsetPos } from "./color";
import { Getter } from "./lib/reactivity";

enum Tool {
    Round,
    Pan,
    Line,
    Square,
}

class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Stroke {
    type: Tool;
    scale: number;
    points: Vec2[] = [];
    pressure: number[] = [];

    constructor(scale: number, type: Tool) {
        this.scale = scale;
        this.type = type;
    }
}

export function Canvas(rgb: Getter<RGB>) {
    const tools = ["round", "square", "erase", "pan", "zoom"];

    const toolbox = document.getElementById("toolbox")!;

    let html = "";
    tools.forEach((name) => {
        html += `
            <button class="m-2 bg-bg1 py-1 px-2 rounded">${name}</button>
        `;
    });

    toolbox.innerHTML = html;

    const canvasField = document.getElementById("canvas-field")!;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let scale = 50;

    let canvasPos = new Vec2(-canvas.clientWidth / 2, -canvas.clientHeight / 2);

    let selectedTool = Tool.Square;
    let held = false;


    document.addEventListener("pointermove", (e: PointerEvent) => {
        if (!held) {
            return;
        }

        ctx.strokeStyle = rgb().toString();

        // ctx.lineWidth = scale * e.pressure;

        switch (selectedTool) {
            case Tool.Pan:
                canvasPos.x += e.movementX;
                canvasPos.y += e.movementY;
                canvas.style.transform = `translate(${canvasPos.x}px, ${canvasPos.y}px)`;
                break;
            case Tool.Round:
                const rect = canvas.getBoundingClientRect();
                const pointerX = e.x - rect.left;
                const pointerY = e.y - rect.top;
                ctx?.beginPath();
                ctx?.arc(
                    pointerX,
                    pointerY,
                    (scale / 2) * e.pressure,
                    0,
                    Math.PI * 2,
                );
                ctx?.fill();
                ctx.closePath();
                break;
            case Tool.Square:
                const [offsetX, offsetY] = offsetPos(canvas, e.x, e.y);
                ctx.lineTo(offsetX, offsetY);
                ctx.stroke();
                break;
        }
    });

    document.addEventListener("pointerleave", () => {
        held = false;
        // ctx.save();
    });

    document.addEventListener("pointerup", () => {
        held = false;
        // ctx.save();
    });

    canvasField.addEventListener("pointerdown", (e: PointerEvent) => {
        held = true;
        switch (selectedTool) {
            case Tool.Pan:
                break;
            case Tool.Square:
                const [offsetX, offsetY] = offsetPos(canvas, e.x, e.y);
                ctx.beginPath();
                ctx.moveTo(offsetX, offsetY);
                break;
        }
    });

    document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === "z") {
            ctx.restore();
        }

        if (e.key === "n") {
            selectedTool = Tool.Pan;
        }
        if (e.key === "j") {
            selectedTool = Tool.Square;
        }
        if (e.key === "k") {
            selectedTool = Tool.Round;
        }
    });
}
