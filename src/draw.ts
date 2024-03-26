import { HSV, RGB, hsvToRGB, offsetPos } from "./color";

export enum Tool {
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

export function offsetVec(
    el: HTMLElement,
    x: number,
    y: number,
    scale: number,
): Vec2 {
    const rect = el.getBoundingClientRect();
    return new Vec2((x - rect.left) / scale, (y - rect.top) / scale);
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

function sliceStroke(stroke: Stroke, start: number, end: number) {
    const points = stroke.points.slice(start, end);
    const normals = stroke.normals.slice(start, end);
    const pressure = stroke.pressure.slice(start, end);

    const newStroke = new Stroke(stroke.scale, stroke.color);
    newStroke.points = points;
    newStroke.normals = normals;
    newStroke.pressure = pressure;

    return newStroke;
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

export class Drawing {
    selectedTool: Tool = Tool.Square;
    brushScale: number = 50;
    canvasPos: Vec2 = new Vec2(0, 0);
    canvasScale: number = 1;
    width: number = 800;
    height: number = 600;
    history: Stroke[] = [];
    historyPos = -1;
    hsv: HSV = {h:0,s:255,v:255};

    stroke: Stroke | undefined;

    ctx: CanvasRenderingContext2D | undefined;
    tempCtx: CanvasRenderingContext2D | undefined;


    lastUpdatedPoint: number = 0;

    canvasListeners: {(): void}[] = [];


    canvasEvent() {
        this.canvasListeners.forEach((listener) => {
            listener();
        })
    }

    onZoom(amount: number) {
        const currentScale = this.canvasScale;
        this.canvasScale = currentScale + (currentScale * amount) / 100;
        this.canvasEvent();
    }

    onPointerDown() {
        switch (this.selectedTool) {
            case Tool.Pan:
                break;
            case Tool.Square:
                this.stroke = new Stroke(this.brushScale, hsvToRGB(this.hsv));
            break;
        }
    }

    onPointerHeld(e: PointerEvent, canvas: HTMLCanvasElement) {
        switch (this.selectedTool) {
            case Tool.Zoom:
                this.onZoom(e.movementY)
                break;
            case Tool.Pan:
                let newPos = this.canvasPos;
                const factor = 1 / this.canvasScale;
                newPos.x += e.movementX * factor;
                newPos.y += e.movementY * factor;
                this.canvasPos = newPos;
                this.canvasEvent();
                break;
            case Tool.Square:
                if (!this.stroke || !this.tempCtx || !this.ctx) {
                    return;
                }
                const point = offsetVec(canvas, e.x, e.y, this.canvasScale);
                const updatedPoint = addPoint(this.stroke, point, e.pressure);

                if (updatedPoint - this.lastUpdatedPoint > 1) {
                    const unchangedPoints = sliceStroke(this.stroke, this.lastUpdatedPoint, updatedPoint);
                    squareBrush(this.ctx, unchangedPoints);
                    this.lastUpdatedPoint = updatedPoint - 1;
                }

                this.tempCtx.clearRect(0, 0, this.width, this.height);
                const changedPoints = sliceStroke(this.stroke, max(updatedPoint - 1, 0), this.stroke.points.length);
                squareBrush(this.tempCtx, changedPoints);

                break;
        }
    }

    onPointerUp(temp:HTMLCanvasElement, ctx:CanvasRenderingContext2D, tempCtx:CanvasRenderingContext2D) {
        if(this.selectedTool !== Tool.Square) {
            return;
        }

        if (!this.stroke) {
            return;
        }

        while (this.historyPos < this.history.length - 1) {
            this.history.pop();
        }

        this.lastUpdatedPoint = 0;
        this.history.push(this.stroke);
        this.historyPos++;
        ctx.drawImage(temp, 0, 0);
        tempCtx.clearRect(0, 0, this.width, this.height);

    }
}




// export function Canvas() {
//     const canvasField = document.getElementById("canvas-field")!;
//     const canvasStack = document.getElementById("canvas-stack")!;
//
//     const canvas = document.getElementById("canvas") as HTMLCanvasElement;
//     const ctx = canvas.getContext("2d")!;
//     const temp = canvasField.querySelector("#temp") as HTMLCanvasElement;
//     const tempCtx = temp.getContext("2d")!;
//
//     const scaleSlider = document.getElementById(
//         "scale-slider",
//     ) as HTMLInputElement;
//
//     Toolbox(selectedTool, setTool);
//     let held = false;
//
//     const rebuildPainting = () => {
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//
//         for (let i = 0; i <= historyPos; i++) {
//             squareBrush(ctx, history[i]);
//         }
//     };
//
//     createEffect(() => {
//         canvasStack.style.transform = `scale(${canvasScale()}) translate(${canvasPos().x}px, ${canvasPos().y}px)`;
//     });
//
//     createEffect(() => {
//         scaleSlider.value = String(scale());
//     });
//
//     scaleSlider.addEventListener("input", () => {
//         setScale(Number(scaleSlider.value));
//     });
//
//     let stroke: Stroke;
//
//     document.addEventListener("pointermove", (e: PointerEvent) => {
//         if (!held) {
//             return;
//         }
//
//     }
//     });
//
// const completeStroke = () => {
//     while (historyPos < history.length - 1) {
//         history.pop();
//     }
//
//     history.push(stroke);
//     historyPos++;
//     ctx.drawImage(temp, 0, 0);
//     tempCtx.clearRect(0, 0, canvas.width, canvas.height);
// };
//
// canvasField.addEventListener("pointerleave", () => {
//     if (held) {
//         held = false;
//
//         completeStroke();
//     }
// });
//
// canvasField.addEventListener("pointerup", () => {
//     if (held) {
//         held = false;
//
//         completeStroke();
//     }
// });
//
// canvasField.addEventListener("pointerdown", () => {
//     held = true;
//
//     switch (selectedTool()) {
//         case Tool.Pan:
//             break;
//         case Tool.Square:
//             stroke = new Stroke(scale(), rgb());
//             break;
//     }
// });
//
// document.addEventListener("keydown", (e: KeyboardEvent) => {
//     if (e.key === "[") {
//         const newScale = scale() - 5 >= 0 ? scale() - 5 : 0;
//         setScale(newScale);
//     }
//
//     if (e.key === "]") {
//         setScale(scale() + 5);
//     }
//
//     if (e.key === "u" && historyPos >= 0) {
//         historyPos--;
//         rebuildPainting();
//     }
//
//     if (e.key === "i" && historyPos < history.length - 1) {
//         historyPos++;
//         rebuildPainting();
//     }
//
//     if (e.key === "n") {
//         setTool(Tool.Pan);
//     }
//
//     if (e.key === "j") {
//         console.log(history);
//         setTool(Tool.Square);
//     }
//
//     if (e.key === "k") {
//         setTool(Tool.Round);
//     }
//
//     if (e.key === "q") {
//         const dataURL = canvas.toDataURL("image/png");
//         const newTab = window.open("about:blank")!;
//         newTab.document.write(
//             "<img src='" + dataURL + "' alt='from canvas'/>",
//         );
//     }
// });
// }
//
// function Toolbox(selectedTool: Getter<Tool>, setTool: Setter<Tool>) {
// }
