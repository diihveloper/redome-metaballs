import {MetaballState} from "./metaballState";
import {
    angleToDegrees as toDeg,
    angleToRadians as toRad,
    lineAngle,
    lineLength,
    Point,
    pointTranslate
} from "geometric";
import {clamp, lerp} from "./math";
import {Metaball} from "./metaball";

const TIME_TO_CONNECT = 1;
const TIME_TO_DISCONNECT = 1;
const TIME_CONNECTED = 1;

export class MetaballConnection {
    time = 0;


    constructor(readonly start: Metaball, readonly end: Metaball, readonly virtual = false) {
        start.isInConnection = true;
        end.isInConnection = true;
    }

    private getEndPosition(): Point {
        const delta = clamp(this.time, 0, 1);
        switch (this.start.state) {
            case MetaballState.Connecting:
                return [
                    lerp(this.start.x, this.end.initialX, delta),
                    lerp(this.start.y, this.end.initialY, delta)
                ];
            case MetaballState.Disconnecting:
                return [
                    lerp(this.end.initialX, this.start.initialX, delta),
                    lerp(this.end.initialY, this.start.initialY, delta)
                ];
            default:
                return [this.end.x, this.end.y];
        }
    }

    private getStartPosition(): Point {
        return [this.start.initialX, this.start.initialY];
    }

    update(delta: number) {
        this.time += delta;

        if (this.time > TIME_CONNECTED && this.start.state === MetaballState.Connecting) {
            this.time = 1;
            this.start.setState(MetaballState.Connected);
            this.start.setNextState(MetaballState.Disconnecting, TIME_CONNECTED, () => {
              this.time = 0;
            });
        }
        // if (this.start.state === MetaballState.Connected && this.time > TIME_CONNECTED && !this.start.isMouseOver) {
        //     this.time = 0;
        //     this.start.setState(MetaballState.Disconnecting);
        // }

        if (this.time > TIME_TO_DISCONNECT && this.start.state === MetaballState.Disconnecting) {
            this.time = 0;
            this.start.setState(MetaballState.Idle);
            this.start.disconnect();
        }



        if (this.start.state === MetaballState.Connected && this.start.isMouseOver) {
            this.time = 1;

        }
    }

    render(ctx: CanvasRenderingContext2D) {

        if (this.virtual) return;

        const start: Point = this.getStartPosition();
        const end: Point = this.getEndPosition();
        ctx.beginPath();
        ctx.arc(end[0], end[1], this.end.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.start.color;
        ctx.fill();
        ctx.closePath();
        const delta = clamp(this.time, 0, 1);


        if (this.start.state === MetaballState.Disconnecting) {
            this.drawConnection(
                ctx,
                this.start.radius,
                this.end.radius,
                start,
                end,
                lerp(3, 1, delta),
                lerp(.65, 1, delta),
            );
        } else {


            this.drawConnection(
                ctx,
                this.start.radius,
                this.end.radius,
                start,
                end,
                lerp(1, 3, delta),
                lerp(1, .65, delta),
            );
        }
    }

    disconnect() {
        this.start.isInConnection = false;
        this.end.isInConnection = false;
    }

    private drawConnection(
        ctx: CanvasRenderingContext2D,
        radius1: number,
        radius2: number,
        center1: Point,
        center2: Point,
        handleSize = 2.4,
        v = 0.5
    ) {
        const HALF_PI = Math.PI / 2;
        const d = lineLength([center1, center2]);
        const maxDist = radius1 + radius2 * 5;
        let u1, u2;
        v = Math.max(Math.min(2, v), .5);

        // No blob if a radius is 0
        // or if distance between the circles is larger than max-dist
        // or if circle2 is completely inside circle1
        if (
            radius1 === 0 ||
            radius2 === 0 ||
            //d > maxDist ||
            d <= Math.abs(radius1 - radius2)
        ) {
            return;
        }

        // Calculate u1 and u2 if the circles are overlapping
        if (d < radius1 + radius2) {
            u1 = Math.acos(
                (radius1 * radius1 + d * d - radius2 * radius2) / (2 * radius1 * d)
            );
            u2 = Math.acos(
                (radius2 * radius2 + d * d - radius1 * radius1) / (2 * radius2 * d)
            );
        } else {
            // Else set u1 and u2 to zero
            u1 = 0;
            u2 = 0;
        }

        // Calculate the max spread
        const angleBetweenCenters = toRad(lineAngle([center1, center2]));
        const maxSpread = Math.acos((radius1 - radius2) / d);
        // Angles for the points
        const angle1 = toDeg(angleBetweenCenters + u1 + (maxSpread - u1) * v);
        const angle2 = toDeg(angleBetweenCenters - u1 - (maxSpread - u1) * v);
        const angle3 = toDeg(angleBetweenCenters + Math.PI - u2 - (Math.PI - u2 - maxSpread) * v);
        const angle4 = toDeg(angleBetweenCenters - Math.PI + u2 + (Math.PI - u2 - maxSpread) * v);

        // Point locations
        const p1 = pointTranslate(center1, angle1, radius1);
        //const p1 = pointTranslate(center1, angle2, radius1);
        const p2 = pointTranslate(center1, angle2, radius1);
        const p3 = pointTranslate(center2, angle3, radius2);
        const p4 = pointTranslate(center2, angle4, radius2);


        // Define handle length by the distance between both ends of the curve
        const totalRadius = radius1 + radius2;
        const d2Base = Math.min(v * handleSize, lineLength([p1, p3]) / totalRadius);
        // Take into account when circles are overlapping
        const d2 = d2Base * Math.min(1, (d * 2) / (radius1 + radius2));

        // Length of the handles
        const r1 = radius1 * d2;
        const r2 = radius2 * d2;

        // Handle locations
        const h1 = pointTranslate(p1, toDeg(toRad(angle1) - HALF_PI), r1);
        const h2 = pointTranslate(p2, toDeg(toRad(angle2) + HALF_PI), r1);
        const h3 = pointTranslate(p3, toDeg(toRad(angle3) + HALF_PI), r2);
        const h4 = pointTranslate(p4, toDeg(toRad(angle4) - HALF_PI), r2);


        // Generate the connector path
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.bezierCurveTo(h1[0], h1[1], h3[0], h3[1], p3[0], p3[1]);
        ctx.arc(center2[0], center2[1], radius2, toRad(angle3), toRad(angle4), true);
        ctx.bezierCurveTo(h4[0], h4[1], h2[0], h2[1], p2[0], p2[1]);
        ctx.arc(center1[0], center1[1], radius1, toRad(angle2), toRad(angle1), true);
        ctx.fill();
        ctx.closePath();

    }
}
