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

    let stroke: Vec2[] = [];

    const interpSize = 3;


    let canvasPos = new Vec2(-canvas.clientWidth / 2, -canvas.clientHeight / 2);

    const [selectedTool, setTool] = createSignal(Tool.Square);
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

    ctx.miterLimit = 1000000;
    ctx

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
                ctx.lineWidth = scale() * e.pressure;
                ctx.beginPath();
                const [x, y] = offsetPos(canvas, e.x, e.y);
                stroke.push(new Vec2(x, y));

                let point = stroke[stroke.length - 1];
                ctx.moveTo(point.x, point.y);

                for (let i = 1; i < interpSize; i++) {
                    point = stroke[stroke.length - i - 1];
                    ctx.lineTo(point.x, point.y);
                }


                // console.log(point2.x - point.x, point2.y - point.y);

                ctx.stroke();
                ctx.closePath();

                break;
        }
    });

    document.addEventListener("pointerleave", () => {
        held = false;
        // ctx.save();
    });

    document.addEventListener("pointerup", () => {
        stroke = [];
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

                // strokeStart

                for (let i = 0; i < interpSize - 1; i++) {
                    stroke.push(new Vec2(offsetX, offsetY));
                }
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
