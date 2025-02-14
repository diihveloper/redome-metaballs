import {Metaball} from './metaball';
import {animationFrames, distinctUntilChanged, filter, fromEvent, map, Observable, pairwise, tap} from "rxjs";
import {drawPoint} from "./utils";

const BACKGROUND_COLOR = '#FA5000';

export class Scene {
    private readonly objects: Metaball[];
    private readonly rows: number;
    private readonly cols: number;
    private ctx: CanvasRenderingContext2D | null = null;
    private animation$: Observable<any> | null = null;
    private mousePosition = {x: 0, y: 0};

    constructor(readonly width: number, readonly height: number, readonly spacing: number, readonly radius: number = 32) {
        this.objects = [];
        this.rows = Math.floor(this.height / this.spacing);
        this.cols = Math.floor(this.width / this.spacing);
    }

    init() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;

        document.body.appendChild(canvas);
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.ctx.fillStyle = BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

        const total = this.rows * this.cols;
        const offsetX = (this.spacing / 2) + (this.width - this.cols * this.spacing) / 2;
        const offsetY = (this.spacing / 2) + (this.height - this.rows * this.spacing) / 2;

        for (let i = 0; i < total; i++) {
            const x = offsetX + i % this.cols * this.spacing;
            const y = offsetY + Math.floor(i / this.cols) * this.spacing;
            const metaball = new Metaball(x, y, this.radius, Math.random() > 0.15, Math.random() < 0.1);
            this._addObject(metaball);

            if (i >= this.cols) {
                metaball.setNorth(this.objects[i - this.cols]);
                this.objects[i - this.cols].setSouth(metaball);
            }
            if (i % this.cols !== 0) {
                metaball.setWest(this.objects[i - 1]);
                this.objects[i - 1].setEast(metaball);
            }
        }


        this.animation$ = animationFrames().pipe(
            pairwise(),
            tap((pair) => {
                const [prev, now] = pair;
                this.update((now.timestamp - prev.timestamp) / 1000);
                this.render();
            }),
        );
        this.animation$.subscribe();

        const mousePosition$ = fromEvent(canvas, 'mousemove').pipe(
            map(event => {
                return {
                    x: (event as MouseEvent).offsetX,
                    y: (event as MouseEvent).offsetY
                }
            })
        );

        const objectHovered$ = mousePosition$.pipe(
            map((position) => {
                // const {x, y} = position;
                // const col = Math.floor((x - offsetX) / this.spacing);
                // const row = Math.floor((y - offsetY) / this.spacing);
                // const index = row * this.cols + col;
                // if (index >= 0 && index < this.objects.length) {
                //     return this.objects[index];
                // }
                this.mousePosition = position;
                return this.objects.find((object) => {
                    const dx = object.x - position.x;
                    const dy = object.y - position.y;
                    return Math.sqrt(dx * dx + dy * dy) < object.radius;
                }) || null;
            }),
            distinctUntilChanged(),
            pairwise(),
        ).subscribe(([prev, current]) => {
            current?.onMouseOver();
            prev?.onMouseOut();
        });

        // mousePosition$.subscribe((event)=>{
        //     console.log(event);
        // });

    }

    _addObject(metaball: Metaball) {
        this.objects.push(metaball);
    }

    update(delta: number) {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update(delta);
        }

    }

    render() {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, this.width, this.height);
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].render(this.ctx);
        }

    }
}
