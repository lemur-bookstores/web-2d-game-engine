import { describe, it, expect } from 'vitest';
import { PhysicsBody, PhysicsShape } from '../../src/physics/PhysicsBody';
import { PhysicsWorld } from '../../src/physics/PhysicsWorld';

describe('PhysicsBody metadata', () => {
    it('provides metadata and config summary', async () => {
        const meta = PhysicsBody.getMetadata();
        expect(Array.isArray(meta)).toBe(true);
        expect(meta.find(m => m.name === 'shape')).toBeTruthy();

        const world = await PhysicsWorld.getInstance();
        const body = new PhysicsBody(world, { shape: PhysicsShape.Box, width: 2, height: 2 });
        const summary = body.getConfigSummary();
        expect(summary).toHaveProperty('shape');
    });
});
