import {Metaball} from './metaball';
import {animationFrames, distinctUntilChanged, fromEvent, map, Observable, pairwise, tap} from "rxjs";
import {createNoise2D} from "simplex-noise";
import {MetaballState} from "./metaballState";
import {DEFAULT_SCENE_CONFIG, SceneConfig} from "./scene-config";

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;


export class Scene {

    private objects: Metaball[];
    private readonly rows: number;
    private readonly cols: number;
    private readonly width: number;
    private readonly height: number
    private readonly spacing: number;
    private readonly radius: number
    private readonly backgroundColor: string;
    private readonly sceneConfig: SceneConfig;


    private ctx: CanvasRenderingContext2D | null = null;
    private animation$: Observable<any> | null = null;
    private noiseAuto = createNoise2D(() => 1)//(x: number, y: number) => perlin.noise(x, y, 0);
    private noiseEnable = createNoise2D();

    constructor(readonly element: HTMLElement, partialConfig: Partial<SceneConfig> = {}) {

        this.sceneConfig = DEFAULT_SCENE_CONFIG;
        Object.keys(partialConfig).forEach((key) => {
            const attr = key as keyof SceneConfig;
            if (!partialConfig[attr]) {
                delete partialConfig[attr];
            }
        });
        Object.assign(this.sceneConfig, partialConfig);
        this.backgroundColor = this.sceneConfig.backgroundColor;
        this.spacing = this.sceneConfig.spacing;
        this.radius = this.sceneConfig.radius;

        this.objects = [];
        this.width = Math.max(element.clientWidth, MIN_WIDTH);
        this.height = Math.max(element.clientHeight, MIN_HEIGHT);
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
            const auto = this.noiseAuto((x + offset) / d, (y + offset) / d) > this.sceneConfig.autoRatio;
            const active = this.noiseEnable((x + offset) / d, (y + offset) / d) > 0;
            // const auto = Math.random() <= this.sceneConfig.autoRatio;
            // const active = Math.random() <= this.sceneConfig.enableRatio;
            const metaball = new Metaball(x, y, this.sceneConfig, active, auto);
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


        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;

        this.element.appendChild(canvas);
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.ctx.fillStyle = this.backgroundColor;
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
            //this.element.style.cursor = !!current && current.active ? 'pointer' : 'default';

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
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        for (let i = 0; i < this.objects.length; i++) {
            if (this.objects[i].state === MetaballState.Idle)
                this.objects[i].render(this.ctx);
        }
        for (let i = 0; i < this.objects.length; i++) {
            if (this.objects[i].state !== MetaballState.Idle)
                this.objects[i].render(this.ctx);
        }

    }
}
