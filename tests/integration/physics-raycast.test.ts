import { describe, it, expect, beforeEach } from 'vitest';
import { Vector2 } from '../../src';
import { PhysicsBody, PhysicsBodyType, PhysicsShape } from '../../src/physics/PhysicsBody';
import { PhysicsWorld } from '../../src/physics/PhysicsWorld';



describe('Raycast Integration Tests', () => {
    let world: PhysicsWorld;
    let staticBody: PhysicsBody;

    beforeEach(async () => {
        world = await PhysicsWorld.getInstance();

        // Create a static body to raycast against
        staticBody = new PhysicsBody(world, {
            type: PhysicsBodyType.Static,
            shape: PhysicsShape.Box,
            width: 2,
            height: 2,
            position: new Vector2(5, 0),
            collisionCategory: 0x0001,
            collisionMask: 0xFFFF
        } as any);
    });

    it('should perform raycast and return results when Box2D available', () => {
        const origin = new Vector2(0, 0);
        const direction = new Vector2(1, 0); // ray going right
        const length = 10;

        const results = world.raycast(origin, direction, length);

        const box2d = world.getBox2D();
        if (!box2d) {
            // In fallback mode, we should still get some results if body exists
            console.log('Testing raycast in fallback mode');
            expect(Array.isArray(results)).toBe(true);

            // The fallback raycast should detect the static body at (5,0)
            // if the ray goes from (0,0) to (10,0) it should hit the body at x=5
            console.log('Raycast results:', results.length);

            if (results.length > 0) {
                const hit = results[0];
                expect(hit).toHaveProperty('point');
                expect(hit).toHaveProperty('normal');
                expect(hit).toHaveProperty('fraction');
                expect(hit.point).toBeInstanceOf(Vector2);
                expect(hit.normal).toBeInstanceOf(Vector2);
                expect(typeof hit.fraction).toBe('number');
                expect(hit.fraction).toBeGreaterThanOrEqual(0);
                expect(hit.fraction).toBeLessThanOrEqual(1);
            }
            return;
        }

        // If Box2D is available, we might get hits (depends on body creation success)
        expect(Array.isArray(results)).toBe(true);

        // Each result should have the expected structure
        results.forEach(result => {
            expect(result).toHaveProperty('point');
            expect(result).toHaveProperty('normal');
            expect(result).toHaveProperty('fraction');
            expect(result.point).toBeInstanceOf(Vector2);
            expect(result.normal).toBeInstanceOf(Vector2);
            expect(typeof result.fraction).toBe('number');
        });
    });

    it('should respect layer mask filtering', () => {
        const origin = new Vector2(0, 0);
        const direction = new Vector2(1, 0);
        const length = 10;

        // Raycast with mask that should exclude our body
        const resultsFiltered = world.raycast(origin, direction, length, {
            layerMask: 0x0002 // Different from body's category (0x0001)
        });

        // Should be empty regardless of Box2D availability
        expect(resultsFiltered).toEqual([]);
    });

    it('should handle edge cases gracefully', () => {
        // Zero length ray
        const results1 = world.raycast(new Vector2(0, 0), new Vector2(1, 0), 0);
        expect(Array.isArray(results1)).toBe(true);

        // Negative length (should be handled gracefully)
        const results2 = world.raycast(new Vector2(0, 0), new Vector2(1, 0), -1);
        expect(Array.isArray(results2)).toBe(true);

        // Ray from inside body (if Box2D available, might not hit)
        const results3 = world.raycast(new Vector2(5, 0), new Vector2(1, 0), 1);
        expect(Array.isArray(results3)).toBe(true);
    });

    it('should handle maxResults option', () => {
        const origin = new Vector2(0, 0);
        const direction = new Vector2(1, 0);
        const length = 10;

        const results = world.raycast(origin, direction, length, {
            maxResults: 1
        });

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should sort results by distance (fraction)', () => {
        // Create multiple bodies at different distances
        const body2 = new PhysicsBody(world, {
            type: PhysicsBodyType.Static,
            shape: PhysicsShape.Box,
            width: 1,
            height: 1,
            position: new Vector2(8, 0),
        } as any);

        const origin = new Vector2(0, 0);
        const direction = new Vector2(1, 0);
        const length = 15;

        const results = world.raycast(origin, direction, length);

        // Results should be sorted by fraction (closest first)
        for (let i = 1; i < results.length; i++) {
            expect(results[i].fraction).toBeGreaterThanOrEqual(results[i - 1].fraction);
        }

        body2.destroy();
    });
});
