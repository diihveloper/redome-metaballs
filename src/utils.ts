import {Point} from "geometric";

export function drawPoint(ctx: CanvasRenderingContext2D, point: Point, color = 'blue', size = 4) {
    ctx.beginPath();
    ctx.arc(point[0], point[1], size, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.closePath();
}
