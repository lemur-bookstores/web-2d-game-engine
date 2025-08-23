import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src';
import { Scene } from '../../src/core/Scene';
import { Entity } from '../../src/ecs/Entity';
import { EventSystem } from '../../src/core/EventSystem';

describe('Basic Game Integration Tests', () => {
    let engine: GameEngine;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        // Reset EventSystem singleton
        EventSystem.reset();

        // Create mock canvas
        mockCanvas = document.createElement('canvas');

        // Create engine
        engine = new GameEngine({
            canvas: mockCanvas,
            width: 800,
            height: 600,
            renderer: 'webgl'
        });
    });

    afterEach(() => {
        if (engine) {
            engine.stop();
        }
        EventSystem.reset();
    });

    it('should create a basic game with entities', async () => {
        await engine.initialize();

        const scene = new Scene('testScene');
        engine.addScene(scene);
        engine.setActiveScene('testScene');

        const entity = new Entity();
        entity.addComponent({
            type: 'transform',
            position: { x: 100, y: 100 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        scene.addEntity(entity);

        expect(scene.getEntityCount()).toBe(1);
        expect(engine.getActiveScene()).toBe(scene);
    });

    it('should handle game lifecycle', async () => {
        await engine.initialize();

        expect(typeof engine.isInitialized === 'function' ? engine.isInitialized() : engine.isInitialized).toBe(true);

        engine.start();
        expect(typeof engine.isRunning === 'function' ? engine.isRunning() : engine.isRunning).toBe(true);

        engine.stop();
        expect(typeof engine.isRunning === 'function' ? engine.isRunning() : engine.isRunning).toBe(false);
    });
});
