import { describe, it, expect } from 'vitest';
import { PhysicsWorld } from '../../src/physics/PhysicsWorld';
import { PhysicsBody } from '../../src/physics/PhysicsBody';
import { Vector2 } from '../../src';


describe('Physics stress test', () => {
    it('creates and destroys many bodies without throwing (fallback safe)', async () => {
        const world = await PhysicsWorld.getInstance();
        const created: PhysicsBody[] = [];
        const N = 200; // moderate stress

        for (let i = 0; i < N; i++) {
            const body = new PhysicsBody(world, {
                position: new Vector2(i * 0.1, i * 0.05),
                dynamic: true,
            } as any);
            created.push(body);
        }

        // step a few frames
        world.step(1 / 60);
        world.step(1 / 60);

        // destroy all
        for (const b of created) {
            b.destroy();
        }

        // If we reach here without exceptions, consider pass
        expect(true).toBe(true);
    });
});
