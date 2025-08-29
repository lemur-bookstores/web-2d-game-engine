import { describe, it, expect } from 'vitest';
import { PhysicsWorld } from '../../src/physics/PhysicsWorld';

describe('PhysicsWorld mappers', () => {
    it('exposes built-in physics types and can normalize body config', async () => {
        const world = await PhysicsWorld.getInstance();
        const types = world.getRegisteredPhysicsTypes();
        expect(Array.isArray(types)).toBe(true);
        expect(types).toEqual(expect.arrayContaining(['physicsBody']));

        const normalized = world.normalizePhysicsData('physicsBody', { shape: 'box', width: 2, height: 2 });
        expect(normalized).toHaveProperty('shape', 'box');
    });
});
