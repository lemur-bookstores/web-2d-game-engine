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
});
