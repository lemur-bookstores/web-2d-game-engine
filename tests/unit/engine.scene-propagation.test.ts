
import { describe, beforeEach, it, expect } from 'vitest';
import { Scene, Engine } from '../../src';
import { LightingSystem, lightRegistry } from '../../src/light/LightingSystem';

class MockSystem {
    public receivedScene: Scene | null = null;
    update() { /* no-op */ }
    setScene(scene: Scene | null) {
        this.receivedScene = scene;
    }
}

describe('Engine -> scene propagation to systems', () => {
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
    });

    it('propagates scene to a newly added system when active scene exists', () => {
        const engine = new Engine({ canvas, width: 800, height: 600, renderer: 'canvas2d' });
        const scene = new Scene('level1');

        engine.addScene(scene);
        engine.setActiveScene(scene);

        const mock = new MockSystem();
        engine.addSystem(mock as any);

        expect(mock.receivedScene).toBe(scene);
    });

    it('propagates scene to existing systems when active scene is set', () => {
        const engine = new Engine({ canvas, width: 800, height: 600, renderer: 'canvas2d' });
        const mock = new MockSystem();
        engine.addSystem(mock as any);

        const scene = new Scene('level2');
        engine.addScene(scene);
        engine.setActiveScene(scene);

        expect(mock.receivedScene).toBe(scene);
    });

    it('LightingSystem registers scene resolver so LightRegistry can resolve names to bits', () => {
        const scene = new Scene('lighting-test');
        // add a custom layer for test
        scene.addLayer('enemy', 0x0004, undefined, true, 1);

        const lighting = new LightingSystem(lightRegistry);
        lighting.setScene(scene as any);

        const normalized = lightRegistry.normalizeLayerTarget('enemy');
        expect(normalized.layer).toBe('enemy');
        expect(normalized.layerMask).toBe(0x0004);
    });
});
