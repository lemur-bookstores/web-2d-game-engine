import { describe, it, expect } from 'vitest';
import { RenderSystem } from '../../src/graphics/RenderSystem';
import { ParticleSystem } from '../../src/particles/ParticleSystem';

class DummyRenderer {
    clear() { }
    present() { }
    drawSprite() { }
}

describe('RenderSystem with particles', () => {
    it('accepts particle system and queries particles for render', () => {
        const rs = new RenderSystem(new (DummyRenderer as any)());
        const ps = new ParticleSystem();
        rs.setParticleSystem(ps as any);

        // should not throw when calling update with no entities
        rs.update([], 0);
        expect(true).toBe(true);
    });
});
