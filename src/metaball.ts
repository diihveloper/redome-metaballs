import {MetaballState} from "./metaballState";
import {MetaballConnection} from "./metaballConnection";
import {Point} from "geometric";
import {drawPoint} from "./utils";

const BALL_COLOR = '#FF6E00';
const BALL_COLOR_HIGHLIGHT = '#FFCD32';

export class Metaball {
    get state(): MetaballState {
        return this._state;
    }

    get isMouseOver(): boolean {
        return this._isMouseOver;
    }

    private time = 0;
    private _isMouseOver = false;
    private _state: MetaballState = MetaballState.Idle;
    private initialX = 0;
    private initialY = 0;
    private connection: MetaballConnection | null = null;
    public color: string = BALL_COLOR;
    private _north: Metaball | null = null;
    private _south: Metaball | null = null;
    private _east: Metaball | null = null;
    private _west: Metaball | null = null;

    get neighbors(): Metaball[] {
        return [this._north, this._south, this._east, this._west].filter((n) => !!n) as Metaball[];
    }


    constructor(public x: number, public y: number, public radius: number, readonly active = true, readonly highlight = false) {
        this.x = this.initialX = x;
        this.y = this.initialY = y;
        this.radius = radius;
        this.color = highlight ? BALL_COLOR_HIGHLIGHT : BALL_COLOR;
    }

    setState(state: MetaballState) {
        this._state = state;
    }

    setNorth(metaball: Metaball) {
        this._north = metaball;
    }

    setSouth(metaball: Metaball) {
        this._south = metaball;
    }

    setEast(metaball: Metaball) {
        this._east = metaball;
    }

    setWest(metaball: Metaball) {
        this._west = metaball;
    }

    connectTo(other: Metaball) {
        this.connection = new MetaballConnection(this, other);
    }

    disconnect() {
        this.connection = null;
    }

    update(delta: number) {
        if (!this.active) return;
        this.time += delta;
        this.connection?.update(delta);
    }

    private drawPoint(ctx: CanvasRenderingContext2D, point: Point, color = 'blue', size = 4) {
        const fill = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(point[0], point[1], size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = fill;
    }

    render(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        this.connection?.render(ctx);


    }

    changeToConnecting() {
        const neighbors = this.neighbors;
        const random = Math.floor(Math.random() * neighbors.length);
        const neighbor = neighbors[random];
        if (neighbor) {
            this.connectTo(neighbor);
            this._state = MetaballState.Connecting;
            this.connection?.update(0);
        }
    }

    trigger() {
        if (this._state === MetaballState.Idle) {
            this.changeToConnecting();
        }
    }

    onMouseOver() {
        this._isMouseOver = true;
        this.trigger();
    }

    onMouseOut() {
        this._isMouseOver = false;
    }

}
