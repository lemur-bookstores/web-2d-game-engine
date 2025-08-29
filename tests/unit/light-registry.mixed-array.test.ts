import { describe, it, expect } from 'vitest';
import { LightRegistry } from '../../src/light/LightRegistry';

describe('LightRegistry.normalizeLayerTarget mixed arrays', () => {
    it('handles mixed arrays of names and numbers when resolver present', () => {
        const r = new LightRegistry();
        r.setLayerResolver(name => {
            if (name === 'a') return 0x1;
            if (name === 'b') return 0x2;
            return undefined;
        });

        const out = r.normalizeLayerTarget(['a', 0x4, 'b']);
        // expected mask: a(1) | b(2) | 4
        expect(out.layerMask).toBe(0x1 | 0x2 | 0x4);
    });
});
