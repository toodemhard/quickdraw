import { RGB, offsetPos } from "./color";
import { Getter, createEffect, createSignal } from "./lib/reactivity";

enum Tool {
    Round,
    Pan,
    Line,
    Square,
    Pick,
    Zoom,
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
    const canvasField = document.getElementById("canvas-field")!;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;

    const scaleSlider = document.getElementById(
        "scale-slider",
    ) as HTMLInputElement;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const [scale, setScale] = createSignal(50);

    let canvasPos = new Vec2(-canvas.clientWidth / 2, -canvas.clientHeight / 2);

    const [selectedTool, setTool] = createSignal(Tool.Round);
    let held = false;

    const toolbox = document.getElementById("toolbox")!;

    createEffect(() => {
        scaleSlider.value = String(scale());
    });

    scaleSlider.addEventListener("input", () => {
        setScale(Number(scaleSlider.value));
    });

    createEffect(() => {
        let html = "";
        for (let tool in Tool) {
            if (isNaN(Number(tool))) {
                continue;
            }

            const style =
                selectedTool() === Number(tool) ? "selected" : "unselected";
            const id = `tool-${tool}`;
            html += `
            <button id=${id} class="${style} m-1 bg-bg1 py-1 px-2 rounded">${Tool[tool]}</button>
            `;
        }
        toolbox.innerHTML = html;

        for (let tool in Tool) {
            if (isNaN(Number(tool))) {
                continue;
            }

            toolbox
                .querySelector(`#tool-${tool}`)
                ?.addEventListener("click", () => {
                    setTool(Number(tool));
                });
        }
    });

    document.addEventListener("pointermove", (e: PointerEvent) => {
        if (!held) {
            return;
        }

        ctx.strokeStyle = rgb().toString();
        ctx.fillStyle = rgb().toString();

        // ctx.lineWidth = scale * e.pressure;

        switch (selectedTool()) {
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
                    (scale() / 2) * e.pressure,
                    0,
                    Math.PI * 2,
                );
                ctx?.fill();
                ctx.closePath();
                break;
            case Tool.Square:
                ctx.lineWidth = scale();
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
        switch (selectedTool()) {
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

        if (e.key === "[") {
            const newScale = scale() - 5 >= 0 ? scale() - 5 : 0;
            setScale(newScale);
        }

        if (e.key === "]") {
            setScale(scale() + 5);
        }

        if (e.key === "n") {
            setTool(Tool.Pan);
        }
        if (e.key === "j") {
            setTool(Tool.Square);
        }
        if (e.key === "k") {
            setTool(Tool.Round);
        }
    });
}
