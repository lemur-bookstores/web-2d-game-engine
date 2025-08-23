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
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Asegurarse de que el canvas esté visible y tenga el tamaño correcto
        canvas.style.backgroundColor = '#000';
        canvas.style.display = 'block';

        // Configuración del motor con renderizado WebGL
        this.engine = new GameEngine({
            canvas,
            width: 800,
            height: 600,
            renderer: 'webgl',
            debug: true // Habilitar modo debug para ver mensajes
        });

        // Escuchar eventos del motor
        this.eventSystem = EventSystem.getInstance();
        this.eventSystem.on('engine:error', (error) => {
            console.error('Engine error:', error);
        });

        console.log('Game engine created');

        this.eventSystem = EventSystem.getInstance();
    }

    async initialize() {
        try {
            // Configurar listeners de eventos antes de la inicialización
            this.eventSystem.on('engine:initializing', () => {
                console.log('Engine is initializing...');
            });

            this.eventSystem.on('engine:initialized', () => {
                console.log('Engine initialization complete');
            });

            // Initialize the game engine
            await this.engine.initialize();

            // Verificar que el engine está listo
            if (!this.engine.isInitialized) {
                throw new Error('Engine failed to initialize properly');
            }

            console.log('Engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize engine:', error);
            throw error;
        }

        // Create game scene
        const gameScene = new Scene('game');
        this.engine.addScene(gameScene);        // Create player ship
        this.player = new Entity();

        this.player.addComponent({
            type: 'transform',
            position: { x: 400, y: 550 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        this.player.addComponent({
            type: 'sprite',
            texture: 'nave1',
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

    private currentShipIndex = 0;
    private ships = [
        'nave1',
        'nave2',
        'nave3',
        'nave4',
        'nave5'
    ];

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

        this.eventSystem.on('input:keyDown', (event) => {
            const keyData = event.data as { code: string };
            if (keyData.code === 'Space') {
                this.changePlayerShip();
            }
        });
    }

    private changePlayerShip() {
        this.currentShipIndex = (this.currentShipIndex + 1) % this.ships.length;
        const sprite = this.player.getComponent('sprite');
        if (sprite) {
            sprite.texture = this.ships[this.currentShipIndex];
        }
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

            const enemyTypes = ['enemy1', 'enemy2', 'enemy3'];
            const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

            enemy.addComponent({
                type: 'sprite',
                texture: randomEnemyType,
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
            texture: 'laser',
            width: 8,
            height: 16,
            tint: { r: 1, g: 1, b: 1, a: 1 },
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
    try {
        console.log('Starting game initialization...');
        const game = new SpaceShooterGame();
        await game.initialize();
        console.log('Game initialized successfully');
        game.start();
        console.log('Game started');
    } catch (error) {
        console.error('Error starting game:', error);
    }
});
