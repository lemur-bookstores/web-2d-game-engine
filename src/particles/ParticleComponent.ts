export interface ParticleComponent {
    type: string;
    color: { r: number; g: number; b: number; a?: number };
    lifetime: number; // seconds
    emissionRate: number; // particles per second
    speed: number;
    spread: number; // radians
    size: number;
    gravity?: { x: number; y: number };
    layer?: string | number;
    layerMask?: number;
    visible?: boolean;
    texture?: string;
}

export const createDefaultParticleComponent = (): ParticleComponent => ({
    type: 'point',
    color: { r: 255, g: 255, b: 255, a: 1 },
    lifetime: 1.0,
    emissionRate: 10,
    speed: 50,
    spread: Math.PI / 4,
    size: 4,
    gravity: { x: 0, y: 0 },
    layer: 'default',
    layerMask: 0,
    visible: true,
    texture: undefined,
});
