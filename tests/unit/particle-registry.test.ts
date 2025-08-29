import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleRegistry } from '../../src/particles/ParticleRegistry';
import { Scene } from '../../src/core/Scene';

describe('ParticleRegistry', () => {
    beforeEach(() => {
        // clear resolver
        ParticleRegistry.getInstance().setLayerResolver(undefined);
    });

    it('normalizes string without resolver to layer name', () => {
        const r = ParticleRegistry.getInstance().normalizeLayerTarget('player');
        expect(r.layer).toBe('player');
        expect(r.layerMask).toBeDefined();
    });

    it('resolves name to mask when scene provided', () => {
        const scene = new Scene('s');
        const pr = ParticleRegistry.getInstance();
        pr.setLayerResolver((n) => scene.getLayer(n)?.bit);

        const r = pr.normalizeLayerTarget('enemy');
        expect(r.layer).toBe('enemy');
        expect(r.layerMask).toBeGreaterThan(0);
    });

    it('normalizes color and vector types via mappers', () => {
        const pr = ParticleRegistry.getInstance();
        const color = { r: 10, g: 20, b: 30, a: 0.5 };
        const col = pr.normalizeValue(color);
        expect(col.type).toBe('color');
        expect(col.value.r).toBe(10);

        const vec = { x: 1, y: 2 };
        const v = pr.normalizeValue(vec);
        expect(v.type).toBe('vector2d');
        expect(v.value.x).toBe(1);
    });
});
