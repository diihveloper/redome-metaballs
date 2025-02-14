export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}


export function inverseLerp(a: number, b: number, value: number): number {
    return (value - a) / (b - a);
}

export function map(value: number, a: number, b: number, c: number, d: number): number {
    return lerp(c, d, inverseLerp(a, b, value));
}

export function mapClamp(value: number, a: number, b: number, c: number, d: number): number {
    return clamp(map(value, a, b, c, d), c, d);
}

export function random(min: number, max: number): number {
    return lerp(min, max, Math.random());
}

export function bezier(a: number, b: number, c: number, t: number): number {
    return lerp(lerp(a, b, t), lerp(b, c, t), t);
}

export function smoothstep(a: number, b: number, t: number): number {
    return bezier(a, a, b, t);
}

export function cubicBezier(a: number, b: number, c: number, d: number, t: number): number {
    return lerp(bezier(a, b, c, t), bezier(b, c, d, t), t);
}
