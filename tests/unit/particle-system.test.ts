import { describe, it, expect } from 'vitest';
import { ParticleSystem } from '../../src/particles/ParticleSystem';
import { createDefaultParticleComponent } from '../../src/particles/ParticleComponent';
import { Entity } from '../../src/ecs/Entity';

describe('ParticleSystem basic', () => {
    it('should spawn particles when emitter attached and update called', () => {
        const ps = new ParticleSystem();
        const e = new Entity('test-1');
        // mock transform component
        e.addComponent({ type: 'transform', position: { x: 10, y: 20 } } as any);

        const comp = createDefaultParticleComponent();
        comp.emissionRate = 100; // many particles per second
        ps.attachEmitter(e, comp);

        // simulate 0.1s -> expect ~10 particles spawned
        ps.update([e], 0.1);
        const count = ps.getParticleCount();
        expect(count).toBeGreaterThanOrEqual(5);
    });
});
