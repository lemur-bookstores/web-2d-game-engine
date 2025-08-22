import { GameEngine } from '../../src';
import { Scene } from '../../src/core/Scene';
import { Entity } from '../../src/ecs/Entity';

// Create a simple platformer game example
class PlatformerGame {
    private engine: GameEngine;
    private player: Entity;

    constructor() {
        // Initialize engine with canvas
        this.engine = new GameEngine({
            canvas: document.getElementById('gameCanvas') as HTMLCanvasElement,
            width: 800,
            height: 600,
            renderer: 'webgl'
        });
    }

    async initialize() {
        await this.engine.initialize();

        // Create game scene
        const gameScene = new Scene('game');
        this.engine.addScene(gameScene);

        // Create player entity
        this.player = new Entity();

        // Add player components
        this.player.addComponent({
            type: 'transform',
            position: { x: 400, y: 300 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        this.player.addComponent({
            type: 'sprite',
            texture: 'player.png',
            width: 32,
            height: 32,
            tint: { r: 1, g: 1, b: 1, a: 1 },
            uvX: 0,
            uvY: 0,
            uvWidth: 1,
            uvHeight: 1,
            flipX: false,
            flipY: false
        });

        this.player.addComponent({
            type: 'physics',
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 9.81 }, // gravity
            mass: 1,
            friction: 0.1,
            restitution: 0.5
        });

        this.player.addComponent({
            type: 'collider',
            width: 32,
            height: 32,
            isTrigger: false
        });

        // Add player to scene
        gameScene.addEntity(this.player);

        // Create platforms
        this.createPlatforms(gameScene);

        // Set up input handling
        this.setupInput();

        // Set as active scene
        this.engine.setActiveScene('game');
    }

    private createPlatforms(scene: Scene) {
        // Create ground platform
        const ground = new Entity();
        ground.addComponent({
            type: 'transform',
            position: { x: 400, y: 550 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        ground.addComponent({
            type: 'sprite',
            texture: 'platform.png',
            width: 800,
            height: 32,
            tint: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
            uvX: 0,
            uvY: 0,
            uvWidth: 1,
            uvHeight: 1,
            flipX: false,
            flipY: false
        });

        ground.addComponent({
            type: 'collider',
            width: 800,
            height: 32,
            isTrigger: false
        });

        scene.addEntity(ground);

        // Add some floating platforms
        const platformPositions = [
            { x: 200, y: 400 },
            { x: 600, y: 300 },
            { x: 400, y: 200 }
        ];

        platformPositions.forEach(pos => {
            const platform = new Entity();

            platform.addComponent({
                type: 'transform',
                position: pos,
                rotation: 0,
                scale: { x: 1, y: 1 }
            });

            platform.addComponent({
                type: 'sprite',
                texture: 'platform.png',
                width: 128,
                height: 32,
                tint: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
                uvX: 0,
                uvY: 0,
                uvWidth: 1,
                uvHeight: 1,
                flipX: false,
                flipY: false
            });

            platform.addComponent({
                type: 'collider',
                width: 128,
                height: 32,
                isTrigger: false
            });

            scene.addEntity(platform);
        });
    }

    private setupInput() {
        document.addEventListener('keydown', (e) => {
            const physics = this.player.getComponent('physics');
            const transform = this.player.getComponent('transform');
            if (!physics || !transform) return;

            switch (e.code) {
                case 'ArrowLeft':
                    physics.velocity.x = -200;
                    break;
                case 'ArrowRight':
                    physics.velocity.x = 200;
                    break;
                case 'Space':
                    // Jump only if on ground
                    if (transform.position.y >= 518) { // 550 - 32
                        physics.velocity.y = -400;
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            const physics = this.player.getComponent('physics');
            if (!physics) return;

            switch (e.code) {
                case 'ArrowLeft':
                case 'ArrowRight':
                    physics.velocity.x = 0;
                    break;
            }
        });
    }

    start() {
        this.engine.start();
    }

    stop() {
        this.engine.stop();
    }
}

// Start the game when the page loads
window.addEventListener('load', async () => {
    const game = new PlatformerGame();
    await game.initialize();
    game.start();
});
