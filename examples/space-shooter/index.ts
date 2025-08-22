import { GameEngine } from '../../src';
import { Scene } from '../../src/core/Scene';
import { Entity } from '../../src/ecs/Entity';
import { EventSystem } from '../../src/core/EventSystem';

class SpaceShooterGame {
    private engine: GameEngine;
    private player: Entity;
    private projectiles: Entity[] = [];
    private enemies: Entity[] = [];
    private eventSystem: EventSystem;
    private score: number = 0;

    constructor() {
        this.engine = new GameEngine({
            canvas: document.getElementById('gameCanvas') as HTMLCanvasElement,
            width: 800,
            height: 600,
            renderer: 'webgl'
        });

        this.eventSystem = EventSystem.getInstance();
    }

    async initialize() {
        await this.engine.initialize();

        const gameScene = new Scene('game');
        this.engine.addScene(gameScene);

        // Create player ship
        this.player = new Entity();

        this.player.addComponent({
            type: 'transform',
            position: { x: 400, y: 550 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        this.player.addComponent({
            type: 'sprite',
            texture: 'ship.png',
            width: 48,
            height: 48,
            tint: { r: 1, g: 1, b: 1, a: 1 },
            uvX: 0,
            uvY: 0,
            uvWidth: 1,
            uvHeight: 1,
            flipX: false,
            flipY: false
        });

        this.player.addComponent({
            type: 'collider',
            width: 48,
            height: 48,
            isTrigger: false
        });

        gameScene.addEntity(this.player);

        // Set up game systems
        this.setupInput();
        this.setupEnemySpawner();
        this.setupCollisionHandling();

        this.engine.setActiveScene('game');
    }

    private setupInput() {
        this.eventSystem.on('input:mousemove', (event) => {
            const mouseEvent = event.data as { position: { x: number, y: number } };
            const transform = this.player.getComponent('transform');
            if (transform) {
                transform.position.x = mouseEvent.position.x;
            }
        });

        this.eventSystem.on('input:mousedown', (event) => {
            const mouseData = event.data;
            if (mouseData.button === 0) { // Left click
                this.fireProjectile();
            }
        });
    }

    private setupEnemySpawner() {
        setInterval(() => {
            if (!this.engine.isRunning) return;

            const enemy = new Entity();

            enemy.addComponent({
                type: 'transform',
                position: {
                    x: Math.random() * 800,
                    y: -50
                },
                rotation: 180,
                scale: { x: 1, y: 1 }
            });

            enemy.addComponent({
                type: 'sprite',
                texture: 'enemy.png',
                width: 32,
                height: 32,
                tint: { r: 1, g: 0.5, b: 0.5, a: 1 },
                uvX: 0,
                uvY: 0,
                uvWidth: 1,
                uvHeight: 1,
                flipX: false,
                flipY: false
            });

            enemy.addComponent({
                type: 'physics',
                velocity: { x: 0, y: 100 },
                acceleration: { x: 0, y: 0 },
                mass: 1,
                friction: 0,
                restitution: 1
            });

            enemy.addComponent({
                type: 'collider',
                width: 32,
                height: 32,
                isTrigger: false
            });

            this.enemies.push(enemy);
            this.engine.getActiveScene()?.addEntity(enemy);
        }, 2000);
    }

    private setupCollisionHandling() {
        this.eventSystem.on('collision', (event) => {
            const collisionData = event.data as { entityA: Entity; entityB: Entity };
            const { entityA, entityB } = collisionData;

            // Check for projectile-enemy collisions
            if (this.projectiles.includes(entityA) && this.enemies.includes(entityB)) {
                this.handleProjectileEnemyCollision(entityA, entityB);
            } else if (this.projectiles.includes(entityB) && this.enemies.includes(entityA)) {
                this.handleProjectileEnemyCollision(entityB, entityA);
            }

            // Check for player-enemy collisions
            if ((entityA === this.player && this.enemies.includes(entityB)) ||
                (entityB === this.player && this.enemies.includes(entityA))) {
                this.handlePlayerEnemyCollision();
            }
        });
    }

    private fireProjectile() {
        const projectile = new Entity();
        const playerTransform = this.player.getComponent('transform');
        if (!playerTransform) return;

        projectile.addComponent({
            type: 'transform',
            position: { x: playerTransform.position.x, y: playerTransform.position.y - 20 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        projectile.addComponent({
            type: 'sprite',
            texture: 'laser.png',
            width: 8,
            height: 16,
            tint: { r: 0, g: 1, b: 0, a: 1 },
            uvX: 0,
            uvY: 0,
            uvWidth: 1,
            uvHeight: 1,
            flipX: false,
            flipY: false
        });

        projectile.addComponent({
            type: 'physics',
            velocity: { x: 0, y: -400 },
            acceleration: { x: 0, y: 0 },
            mass: 1,
            friction: 0,
            restitution: 1
        });

        projectile.addComponent({
            type: 'collider',
            width: 8,
            height: 16,
            isTrigger: true
        });

        this.projectiles.push(projectile);
        this.engine.getActiveScene()?.addEntity(projectile);

        // Remove projectile after 2 seconds
        setTimeout(() => {
            const scene = this.engine.getActiveScene();
            if (scene && projectile) {
                scene.removeEntity(projectile.id);
                this.projectiles = this.projectiles.filter(p => p !== projectile);
            }
        }, 2000);
    }

    private handleProjectileEnemyCollision(projectile: Entity, enemy: Entity) {
        // Remove both entities
        const scene = this.engine.getActiveScene();
        if (scene) {
            scene.removeEntity(projectile.id);
            scene.removeEntity(enemy.id);

            this.projectiles = this.projectiles.filter(p => p !== projectile);
            this.enemies = this.enemies.filter(e => e !== enemy);

            // Increase score
            this.score += 100;
            this.updateScore();
        }
    }

    private handlePlayerEnemyCollision() {
        // Game over
        this.engine.stop();
        alert(`Game Over! Final Score: ${this.score}`);
    }

    private updateScore() {
        document.getElementById('score')!.textContent = `Score: ${this.score}`;
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
    const game = new SpaceShooterGame();
    await game.initialize();
    game.start();
});
