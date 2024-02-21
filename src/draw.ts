import { RGB, offsetPos } from "./color";
import { Getter, Setter, createEffect, createSignal } from "./lib/reactivity";

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

    len(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    normalized(): Vec2 {
        const len = this.len();
        return new Vec2(this.x / len, this.y / len);
    }

    left(): Vec2 {
        return new Vec2(-this.y, this.x);
    }
}

function vecScale(vec: Vec2, scale: number): Vec2 {
    return new Vec2(vec.x * scale, vec.y * scale);
}

function vecAdd(a: Vec2, b: Vec2): Vec2 {
    return new Vec2(a.x + b.x, a.y + b.y);
}

function vecSub(a: Vec2, b: Vec2): Vec2 {
    return new Vec2(a.x - b.x, a.y - b.y);
}

export function offsetVec(el: HTMLElement, x: number, y: number): Vec2 {
    const rect = el.getBoundingClientRect();
    return new Vec2(x - rect.left, y - rect.top);
}

function max(a: number, b: number): number {
    return a > b ? a : b;
}

function min(a: number, b: number): number {
    return a < b ? a : b;
}

function debugNormals(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const points = stroke.points;
    const normals = stroke.normals;

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const mov = vecAdd(vecScale(normals[i], 20), point);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(mov.x, mov.y);
        ctx.stroke();
        ctx.closePath();
    }
}

function squareBrush(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const points = stroke.points;
    const normals = stroke.normals;
    const scale = stroke.scale;

    ctx.strokeStyle = stroke.color.toString();
    ctx.fillStyle = stroke.color.toString();

    for (let i = 0; i < points.length - 1; i++) {
        const thisWidth = scale * stroke.pressure[i];
        const nextWidth = scale * stroke.pressure[i + 1];
        const a = vecAdd(points[i], vecScale(normals[i], thisWidth));
        const b = vecAdd(points[i], vecScale(normals[i], -thisWidth));
        const c = vecAdd(points[i + 1], vecScale(normals[i + 1], -nextWidth));
        const d = vecAdd(points[i + 1], vecScale(normals[i + 1], nextWidth));

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.lineTo(a.x, a.y);

        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
}

class Stroke {
    // aligned vecs of data
    points: Vec2[] = [];
    normals: Vec2[] = [];
    pressure: number[] = [];
    scale: number;
    color: RGB;

    constructor(scale: number, color: RGB) {
        this.scale = scale;
        this.color = color;
    }
}

function addPoint(stroke: Stroke, point: Vec2, pressure: number): number {
    const interpDistance = 20;
    const points = stroke.points;
    const normals = stroke.normals;
    points.push(point);
    normals.push(new Vec2(0, 0));
    stroke.pressure.push(pressure);

    let totalDiff = 0;
    let current = points.length - 1;
    while (totalDiff <= interpDistance && current >= 0) {
        const front = current < points.length - 1 ? current + 1 : current;
        totalDiff += vecSub(points[current], points[front]).len();

        let backPoint = current;
        let backDiff = 0;
        while (backDiff <= interpDistance && backPoint > 0) {
            backDiff += vecSub(points[current], points[backPoint]).len();
            backPoint--;
        }

        let frontPoint = current;
        let frontDiff = 0;
        while (frontDiff <= interpDistance && frontPoint < points.length - 1) {
            frontDiff += vecSub(points[current], points[frontPoint]).len();
            frontPoint++;
        }

        const dir = vecSub(points[backPoint], points[frontPoint]).normalized();
        normals[current] = dir.left();
        current--;
    }

    return current + 1;
}

export function Canvas(rgb: Getter<RGB>) {
    const canvasField = document.getElementById("canvas-field")!;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;

    const temp = canvasField.querySelector("#temp") as HTMLCanvasElement;
    const tempCtx = temp.getContext("2d")!;

    const scaleSlider = document.getElementById(
        "scale-slider",
    ) as HTMLInputElement;

    const [scale, setScale] = createSignal(50);

    const history: Stroke[] = [];
    let historyPos = -1;
    // let stroke: Stroke;

    // let canvasPos = new Vec2(-canvas.clientWidth / 2, -canvas.clientHeight / 2);

    const [selectedTool, setTool] = createSignal(Tool.Square);
    Toolbox(selectedTool, setTool);
    let held = false;

    const rebuildPainting = () => {
        // ctx.fillStyle = "rgb(255,255,255)";
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i <= historyPos; i++) {
            squareBrush(ctx, history[i]);
        }
    };

    createEffect(() => {
        scaleSlider.value = String(scale());
    });

    scaleSlider.addEventListener("input", () => {
        setScale(Number(scaleSlider.value));
    });

    let stroke: Stroke;

    document.addEventListener("pointermove", (e: PointerEvent) => {
        if (!held) {
            return;
        }

        const point = offsetVec(canvas, e.x, e.y);
        const updatedPoint = addPoint(stroke, point, e.pressure);

        tempCtx.clearRect(0, 0, canvas.width, canvas.height);

        tempCtx.strokeStyle = rgb().toString();
        tempCtx.fillStyle = rgb().toString();
        squareBrush(tempCtx, stroke);

        // ctx.lineWidth = scale * e.pressure;
        // switch (selectedTool()) {
        //     case Tool.Pan:
        //         canvasPos.x += e.movementX;
        //         canvasPos.y += e.movementY;
        //         canvas.style.transform = `translate(${canvasPos.x}px, ${canvasPos.y}px)`;
        //         break;
        //     case Tool.Round:
        //         {
        //             ctx.lineWidth = scale();
        //             const [x, y] = offsetPos(canvas, e.x, e.y);
        //             stroke.push(new Vec2(x, y));
        //
        //
        //             ctx.beginPath();
        //             ctx.moveTo(x, y);
        //
        //             const lastPoint = stroke[stroke.length - 2];
        //             ctx.lineTo(lastPoint.x, lastPoint.y);
        //             ctx.stroke
        //
        //             ctx?.beginPath();
        //             ctx?.arc(
        //                 x,
        //                 y,
        //                 (scale() / 2) * e.pressure,
        //                 0,
        //                 Math.PI * 2,
        //             );
        //             ctx?.fill();
        //             ctx.closePath();
        //         }
        //         break;
        //     case Tool.Square:
        //         ctx.lineWidth = scale() * e.pressure;
        //         ctx.beginPath();
        //         const [x, y] = offsetPos(canvas, e.x, e.y);
        //         stroke.push(new Vec2(x, y));
        //
        //         let point = stroke[stroke.length - 1];
        //         ctx.moveTo(point.x, point.y);
        //
        //         for (let i = 1; i < interpSize; i++) {
        //             point = stroke[stroke.length - i - 1];
        //             ctx.lineTo(point.x, point.y);
        //         }
        //
        //
        //         // console.log(point2.x - point.x, point2.y - point.y);
        //
        //         ctx.stroke();
        //         ctx.closePath();
        //
        //         break;
        // }
    });

    document.addEventListener("pointerleave", () => {
        held = false;
    });

    document.addEventListener("pointerup", () => {
        held = false;

        while (historyPos < history.length - 1) {
            history.pop();
        }

        history.push(stroke);
        historyPos++;
        ctx.drawImage(temp, 0, 0);
        tempCtx.clearRect(0, 0, canvas.width, canvas.height);
    });

    canvasField.addEventListener("pointerdown", (e: PointerEvent) => {
        held = true;
        stroke = new Stroke(scale(), rgb());
        // const [offsetX, offsetY] = offsetPos(canvas, e.x, e.y);

        // stroke.points.push(offsetVec(canvas, e.x, e.y));
        // stroke.normals.push(new Vec2(0, 0));
        // stroke.pressure.push(e.pressure);
        // lastPoint = stroke.points[0];
        // switch (selectedTool()) {
        //     case Tool.Pan:
        //         break;
        //     case Tool.Square:
        //         break;
        //     case Tool.Round:
        //
        //         stroke.push(new Vec2(offsetX, offsetY));
        //         break;
        // }
    });

    document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "[") {
            const newScale = scale() - 5 >= 0 ? scale() - 5 : 0;
            setScale(newScale);
        }

        if (e.key === "]") {
            setScale(scale() + 5);
        }

        if (e.key === "u" && historyPos >= 0) {
            historyPos--;
            rebuildPainting();
        }

        if (e.key === "i" && historyPos < history.length - 1) {
            historyPos++;
            rebuildPainting();
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

        if (e.key === "q") {
            rebuildPainting();
        }
    });
}

function Toolbox(selectedTool: Getter<Tool>, setTool: Setter<Tool>) {
    const toolbox = document.getElementById("toolbox")!;

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
}
