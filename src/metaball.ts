import {MetaballState} from "./metaballState";
import {MetaballConnection} from "./metaballConnection";
import {clamp, lerp} from "./math";

const BALL_COLOR = '#FF6E00';
const BALL_COLOR_HIGHLIGHT = '#FFCD32';

export class Metaball {
    get state(): MetaballState {
        return this._state;
    }

    get isMouseOver(): boolean {
        return this._isMouseOver;
    }

    get isOnOrigin(): boolean {
        return this.x === this.initialX && this.y === this.initialY;
    }

    private time = 0;
    private movingTime = 0;
    private _isMouseOver = false;
    private _state: MetaballState = MetaballState.Idle;
    private _nextState: MetaballState | null = null;
    private _nextStateTime = 0;
    private _onNextState: Function | null = null;
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


    constructor(public x: number, public y: number, public radius: number, readonly active = true, readonly auto = false) {
        this.x = this.initialX = x;
        this.y = this.initialY = y;
        this.radius = radius;
        this.color = auto ? BALL_COLOR_HIGHLIGHT : BALL_COLOR;
    }

    private setNextState(state: MetaballState, time: number, callback: Function | null = null) {
        this._nextState = state;
        this._nextStateTime = time;
        this._onNextState = callback;
    }

    getRandomNeighbor(): Metaball | null {
        const neighbors = this.neighbors;
        if (neighbors.length === 0) return null;
        const random = Math.floor(Math.random() * neighbors.length);
        return neighbors[random];
    }

    getRandomInactive(): Metaball | null {
        const neighbors = this.neighbors.filter(x => !x.active);
        if (neighbors.length === 0) return null;
        const random = Math.floor(Math.random() * neighbors.length);
        return neighbors[random];
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


    disconnect() {
        this.connection = null;
    }

    update(delta: number) {
        if (!this.active) return;
        this.time += delta;

        if (this._nextState !== null) {
            this._nextStateTime -= delta;
            if (this._nextStateTime <= 0) {
                this._state = this._nextState;
                this._onNextState?.();
                this._nextState = null;
                this._onNextState = null;
            }
        }

        if (this.auto) {
            this.autoUpdate();
        }


        switch (this._state) {
            case MetaballState.Waiting:
                this.color = "purple";
                break;
            case MetaballState.Connecting:
                this.color = "greenyellow";
                break;
            case MetaballState.Disconnecting:
                this.color = "deeppink";
                break;
            case MetaballState.Connected:
                this.color = "green";
                break;
            case MetaballState.Idle:
                this.color = "yellow";
                break;
            case MetaballState.Moving:
                this.color = "blue";
                this.movingTime += delta;
                if (this.connection) {
                    const [x, y] = [this.connection.end.x, this.connection.end.y];
                    this.x = lerp(this.initialX, x, this.movingTime);
                    this.y = lerp(this.initialY, y, this.movingTime);
                }
                if (this.movingTime >= 1) {
                    this.movingTime = 0;
                    this._state = MetaballState.Waiting;
                    this.setNextState(MetaballState.Idle, Math.random() * 2);
                    // swap if connection is inactivated
                }

                break;
            case MetaballState.Backing:
                this.color = "red";
                this.movingTime += delta;
                if (this.connection) {
                    const delta = clamp(this.movingTime, 0, 1);
                    const [x, y] = [this.connection.end.x, this.connection.end.y];
                    this.x = lerp(x, this.initialX, delta);
                    this.y = lerp(y, this.initialY, delta);
                }
                if (this.movingTime >= 1) {
                    //this.movingTime = 0;
                    this._state = MetaballState.Waiting;
                    this.setNextState(MetaballState.Disconnecting, Math.random() * 2, () => {
                        if (this.connection) {
                            this.connection.time = 0;
                        }
                        //this.disconnect();
                    });

                    // swap if connection is inactivated
                }

                break;
        }

        this.connection?.update(delta);

    }

    autoUpdate() {
        if (this._state === MetaballState.Idle) {
            const random = Math.floor(Math.random() * 100) % 5;
            this.tryMove();
            // switch (random) {
            //     case 0:
            //         this.tryConnect();
            //         break;
            //     case 1:
            //         this.tryMove();
            //         break;
            // }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;


        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        this.connection?.render(ctx);
        ctx.beginPath();
        ctx.arc(this.initialX, this.initialY, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "green"
        ctx.stroke();
        ctx.closePath();

    }

    tryConnect() {
        if (this._state === MetaballState.Moving || this.connection != null) return;
        const neighbor = this.getRandomNeighbor();
        if (neighbor) {
            this.connection = new MetaballConnection(this, neighbor);
            this._state = MetaballState.Connecting;
            this.connection.update(0);

        }
    }

    tryMove() {
        if (this._state != MetaballState.Idle) return;

        if (this.connection) {
            this._state = MetaballState.Backing;
            //this.movingTime = 0;
            return;
        }
        const neighbor = this.getRandomInactive();
        if (neighbor) {
            this.connection = new MetaballConnection(this, neighbor);
            this._state = MetaballState.Moving;
            this.movingTime = 0;
            this.connection.update(0);
        }
    }

    trigger() {
        if (!this.active) return;
        if (this._state === MetaballState.Idle) {
            this.tryConnect();
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
