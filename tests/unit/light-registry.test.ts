
import { describe, it, expect } from 'vitest';
import { LightRegistry } from '../../src/light/LightRegistry';

describe('LightRegistry.normalizeLayerTarget', () => {
    it('returns layer name for string when no resolver', () => {
        const r = new LightRegistry();
        const out = r.normalizeLayerTarget('player');
        expect(out).toEqual({ layer: 'player' });
    });

    it('returns layerMask for number', () => {
        const r = new LightRegistry();
        const out = r.normalizeLayerTarget(0x0004);
        expect(out).toEqual({ layerMask: 0x0004 });
    });

    it('combines numeric arrays into mask', () => {
        const r = new LightRegistry();
        const out = r.normalizeLayerTarget([0x1, 0x2, 0x4]);
        expect(out).toEqual({ layerMask: 0x1 | 0x2 | 0x4 });
    });

    it('resolves names to mask when resolver is set', () => {
        const r = new LightRegistry();
        r.setLayerResolver(name => {
            if (name === 'default') return 0x1;
            if (name === 'enemy') return 0x4;
            return undefined;
        });

        const out = r.normalizeLayerTarget('enemy');
        expect(out).toEqual({ layer: 'enemy', layerMask: 0x4 });

        const out2 = r.normalizeLayerTarget(['default', 'enemy']);
        expect(out2.layerMask).toBe(0x1 | 0x4);
    });
});
