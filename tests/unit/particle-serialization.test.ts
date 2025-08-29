import { describe, it, expect } from 'vitest';
import { ParticleRegistry } from '../../src/particles/ParticleRegistry';
import { ParticleSystem } from '../../src/particles/ParticleSystem';
import { BasicEmitter } from '../../src/particles/BuiltInEmitters';
import { Entity } from '../../src/ecs/Entity';

describe('Particle serialization', () => {
    it('createDefault -> serialize -> deserialize -> attach works', () => {
        const pr = ParticleRegistry.getInstance();
        pr.registerParticleType('basic', BasicEmitter);
        const def = pr.createDefaultParticle('basic');
        expect(def).toBeDefined();

        const serialized = pr.serializeEmitter(def);
        const ps = new ParticleSystem();
        const e = new Entity('ser-1');
        ps.attachEmitterFromSerialized(e, serialized);

        // update a short time to spawn
        ps.update([e], 0.2);
        expect(ps.getParticleCount()).toBeGreaterThan(0);
    });
});
