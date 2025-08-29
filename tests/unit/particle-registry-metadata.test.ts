import { describe, it, expect } from 'vitest';
import { ParticleRegistry } from '../../src/particles/ParticleRegistry';
import { BasicEmitter } from '../../src/particles/BuiltInEmitters';

describe('ParticleRegistry metadata', () => {
    it('registers built-in emitter and extracts metadata', () => {
        const pr = ParticleRegistry.getInstance();
        pr.registerParticleType('basic', BasicEmitter, { description: 'Basic emitter' });
        const types = pr.getRegisteredParticleTypes();
        expect(types).toContain('basic');

        const meta = pr.getParticleMetadata('basic');
        expect(meta).toBeDefined();
        expect(meta.properties.some((p: any) => p.name === 'color')).toBe(true);
    });
});
