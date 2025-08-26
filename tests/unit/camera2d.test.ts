import { describe, it, expect } from 'vitest';
import { Camera2D } from '../../src/graphics/Camera2D';
import { Vector2 } from '../../src/math/Vector2';

describe('Camera2D transforms', () => {
    it('converts world to screen and back with default', () => {
        const cam = new Camera2D(800, 600);
        cam.position = new Vector2(0, 0);
        cam.zoom = 1;

        const world = new Vector2(100, 50);
        const screen = cam.worldToScreen(world);
        const back = cam.screenToWorld(screen);

        expect(back.x).toBeCloseTo(world.x, 5);
        expect(back.y).toBeCloseTo(world.y, 5);
    });

    it('follows a target with smoothing', () => {
        const cam = new Camera2D(800, 600);
        const target = { position: new Vector2(200, 100) };
        cam.follow(target, { lerp: 0.5 });

        cam.update(1);
        expect(cam.position.x).toBeGreaterThan(0);
        expect(cam.position.y).toBeGreaterThan(0);
    });
});
