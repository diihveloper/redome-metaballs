import {Metaball} from './metaball';
import {
    animationFrames,
    distinctUntilChanged,
    filter,
    fromEvent,
    interval,
    map,
    Observable,
    pairwise,
    tap,
    timer
} from "rxjs";
import {drawPoint} from "./utils";
import {createNoise2D} from "simplex-noise";
import PerlinNoise from "./perlin";

const BACKGROUND_COLOR = '#FA5000';
const perlin = new PerlinNoise();

export class Scene {

    private objects: Metaball[];
    private readonly rows: number;
    private readonly cols: number;
    private ctx: CanvasRenderingContext2D | null = null;
    private animation$: Observable<any> | null = null;
    private mousePosition = {x: 0, y: 0};
    private noiseAuto = createNoise2D(() => 1)//(x: number, y: number) => perlin.noise(x, y, 0);
    private noiseEnable = createNoise2D();

    constructor(readonly width: number, readonly height: number, readonly spacing: number, readonly radius: number = 32) {
        this.objects = [];
        this.rows = Math.floor(this.height / this.spacing);
        this.cols = Math.floor(this.width / this.spacing);
    }

    private reset() {
        this.objects = [];
    }

    private setupBalls(offset = 0) {
        this.reset();
        const total = this.rows * this.cols;
        const offsetX = (this.spacing / 2) + (this.width - this.cols * this.spacing) / 2;
        const offsetY = (this.spacing / 2) + (this.height - this.rows * this.spacing) / 2;


        const d = 100;
        for (let i = 0; i < total; i++) {
            const x = offsetX + i % this.cols * this.spacing;
            const y = offsetY + Math.floor(i / this.cols) * this.spacing;
            const auto = this.noiseAuto((x + offset) / d, (y + offset) / d) > 0.5;
            const active = this.noiseEnable((x + offset) / d, (y + offset) / d) > 0;
            const metaball = new Metaball(x, y, this.radius, active, auto);
            this.addBall(metaball);

            if (i >= this.cols) {
                metaball.setNorth(this.objects[i - this.cols]);
                this.objects[i - this.cols].setSouth(metaball);
            }
            if (i % this.cols !== 0) {
                metaball.setWest(this.objects[i - 1]);
                this.objects[i - 1].setEast(metaball);
            }
        }
    }

    private addBall(metaball: Metaball) {
        this.objects.push(metaball);
    }

    private swapBalls(a: Metaball, b: Metaball) {
        const indexA = this.objects.indexOf(a);
        const indexB = this.objects.indexOf(b);
        this.objects[indexA] = b;
        this.objects[indexB] = a;
    }

    init() {
        console.log();

        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;

        document.body.appendChild(canvas);
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.ctx.fillStyle = BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.setupBalls();


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

        mousePosition$.pipe(
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

        // interval(300).subscribe((value) => {
        //     //this.setupBalls(value * 10);
        // });
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
