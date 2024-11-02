import { createMutable } from "solid-js/store";
import { HSV, RGB, hsvToRGB, offsetPos } from "./color";
import { Keybind } from "./keybindings";


export type App = {
    editor: Editor
    drawing: Drawing
    keybinds: Keybind[]
}

export enum Tool {
    Square,
    Pan,
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

class Event {
    listeners: {(): void}[] = [];

    subscribe(listener: () => void) {
        this.listeners.push(listener);
    }

    invoke() {
        this.listeners.forEach((listener) => {
            listener();
        });
    }
}

export type CanvasCtx = {
    main: HTMLCanvasElement;
    mainCtx: CanvasRenderingContext2D;
    temp: HTMLCanvasElement;
    tempCtx: CanvasRenderingContext2D;
}

export class Drawing {
    width: number = 800;
    height: number = 600;
    history: Stroke[] = [];
    historyPos: number = -1;
    canvasPos: Vec2 = createMutable(new Vec2(0, 0));
    canvasScale: number = 1;

    historyEvent: Event = new Event;
    canvasMoveEvent: Event = new Event;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}

export class Editor {
    selectedTool: Tool = Tool.Square;
    brushSize: number = 50;
    hsv: HSV = {h:0,s:255,v:255};

    stroke: Stroke = new Stroke(0, new RGB(0,0,0))
    lastUpdatedPoint: number = 0;
}

export function rebuild(drawing: Drawing, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, drawing.width, drawing.height);

    for (let i = 0; i <= drawing.historyPos; i++) {
        squareBrush(ctx, drawing.history[i]);
    }
}

export function onUndo(drawing: Drawing) {
    if (drawing.historyPos < 0) {
        return;
    }

    drawing.historyPos--;
    drawing.historyEvent.invoke();
}

export function onRedo(drawing: Drawing) {
    if (drawing.historyPos >= drawing.history.length - 1) {
        return;
    }

    drawing.historyPos++;
    drawing.historyEvent.invoke();
}

export function onZoom(drawing: Drawing, amount: number) {
    const currentScale = drawing.canvasScale;
    drawing.canvasScale = max(0.3, currentScale + (currentScale * amount) / 100);
    drawing.canvasMoveEvent.invoke();
}

let lastPos : Vec2 = new Vec2(0,0);

export function onPointerDown(editor: Editor, e: PointerEvent) {
    lastPos = new Vec2(e.clientX, e.clientY);
    switch (editor.selectedTool) {
        case Tool.Pan:
            break;
        case Tool.Square:
            editor.stroke = new Stroke(editor.brushSize, hsvToRGB(editor.hsv));
            console.log(editor.stroke.color);
        break;
    }
}

export function onPointerHeld(editor: Editor, drawing: Drawing, e: PointerEvent, ctx: CanvasCtx) {
    const canvas = ctx.main;

    switch (editor.selectedTool) {
        case Tool.Zoom:
            onZoom(drawing, e.clientY - lastPos.y);
            break;
        case Tool.Pan:
            console.log(e.movementX, e.movementY);
            const pointerMove = vecSub(new Vec2(e.clientX, e.clientY), lastPos);

            let newPos = drawing.canvasPos;
            const factor = 1 / drawing.canvasScale;
            newPos.x += pointerMove.x * factor;
            newPos.y += pointerMove.y * factor;
            drawing.canvasPos = newPos;
            drawing.canvasMoveEvent.invoke();
            break;
        case Tool.Square:
            const rect = canvas.getBoundingClientRect();
            const scale = drawing.canvasScale;
            const point = new Vec2((e.x - rect.left) / scale, (e.y - rect.top) / scale);
            const updatedPoint = addPoint(editor.stroke, point, e.pressure);

            if (updatedPoint - editor.lastUpdatedPoint > 1) {
                const unchangedPoints = sliceStroke(editor.stroke, editor.lastUpdatedPoint, updatedPoint);
                squareBrush(ctx.mainCtx, unchangedPoints);
                editor.lastUpdatedPoint = updatedPoint - 1;
            }

            ctx.tempCtx.clearRect(0, 0, drawing.width, drawing.height);
            const changedPoints = sliceStroke(editor.stroke, max(updatedPoint - 1, 0), editor.stroke.points.length);
            squareBrush(ctx.tempCtx, changedPoints);

            break;
    }

    lastPos = new Vec2(e.clientX, e.clientY);
}

export function onPointerUp(editor: Editor, drawing:Drawing, ctx: CanvasCtx) {
    if(editor.selectedTool !== Tool.Square) {
        return;
    }

    if (!editor.stroke) {
        return;
    }

    if (editor.stroke.points.length <= 0) {
        return;
    }
    while (drawing.historyPos < drawing.history.length - 1) {
        drawing.history.pop();
    }

    editor.lastUpdatedPoint = 0;
    drawing.history.push(editor.stroke);
    drawing.historyPos++;
    ctx.mainCtx.drawImage(ctx.temp, 0, 0);
    ctx.tempCtx.clearRect(0, 0, drawing.width, drawing.height);
    editor.stroke = new Stroke(0, new RGB(0,0,0));
}
