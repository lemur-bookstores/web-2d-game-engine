import { GameEngine } from '../../src';
import { Scene } from '../../src/core/Scene';
import { Entity } from '../../src/ecs/Entity';
import { EventSystem } from '../../src/core/EventSystem';
import { AssetManager } from '../../src/assets/AssetManager';
import { RenderSystem } from '../../src/graphics';
import { InputManager, InputSystem } from '../../src/input';
import { ENGINE_EVENTS, INPUT_EVENTS, PHYSICS_EVENTS } from '../../src/types/event-const';

interface EventData {
    event: {
        button: number,
        position: {
            x: number,
            y: number
        },
        deltaX: number,
        deltaY: number,
        ctrlKey: boolean,
        shiftKey: boolean,
        altKey: boolean,
        metaKey: boolean
    }
}

class SpaceShooterGame {
    private engine: GameEngine;
    private player: Entity;
    private projectiles: Entity[] = [];
    private enemies: Entity[] = [];
    private eventSystem: EventSystem;
    private inputSystem: InputSystem;
    private assetManager: AssetManager;
    private inputManager: InputManager;
    private score: number = 0;
    private currentShipIndex = 0;
    private playerShips = [
        'nave1',
        'nave2',
        'nave3',
        'nave4',
        'nave5'
    ];
    private enemyShips = ['enemy1', 'enemy2', 'enemy3'];

    constructor() {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Inicializar InputManager
        this.inputManager = InputManager.getInstance();
        this.inputManager.initialize({
            canvas,
            preventDefaultKeys: [
                "Space",
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
            ],
            enableTouch: true,
            enableMouse: true,
            enableKeyboard: true,
        });

        // Crear sistema de input para ECS
        this.inputSystem = new InputSystem();

        // Initialize asset manager
        this.assetManager = AssetManager.getInstance();

        // Asegurarse de que el canvas esté visible y tenga el tamaño correcto
        canvas.style.backgroundColor = '#000';
        canvas.style.display = 'block';

        // Configuración del motor con renderizado Canvas2D para garantizar compatibilidad
        this.engine = new GameEngine({
            canvas,
            width: 800,
            height: 600,
            renderer: 'canvas2d', // Usar Canvas2D para garantizar que las texturas se vean
            debug: false // Desactivar debug para ver las texturas reales
        });

        // Escuchar eventos del motor
        this.eventSystem = EventSystem.getInstance();
        this.eventSystem.on(ENGINE_EVENTS.ERROR, (error) => {
            console.error('Engine error:', error);
        });

        console.log('Game engine created');

        this.eventSystem = EventSystem.getInstance();
    }

    async initialize() {
        try {
            // Configurar listeners de eventos antes de la inicialización
            this.eventSystem.on(ENGINE_EVENTS.INITIALIZING, () => {
                console.log('Engine is initializing...');
            });

            this.eventSystem.on(ENGINE_EVENTS.INITIALIZED, () => {
                console.log('Engine initialization complete');
            });

            // Initialize the game engine (now with automatic renderer fallback)
            await this.engine.initialize();

            // Verificar que el engine está listo
            if (!this.engine.isInitialized) {
                throw new Error('Engine failed to initialize properly');
            }

            console.log('Engine initialized successfully');

            // Load game assets after engine initialization
            await this.loadAssets();

        } catch (error) {
            console.error('Failed to initialize engine:', error);
            throw error;
        }

        // Create game scene
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
            texture: 'nave1',
            width: 48,
            height: 48,
            tint: { r: 255, g: 255, b: 255, a: 255 },
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

        this.engine.addSystem(this.inputManager);
        this.engine.setActiveScene(gameScene);
    }

    /**
     * Load all game assets
     */
    private async loadAssets(): Promise<void> {
        try {
            console.log('Loading game assets...');

            // Load all ship textures with correct paths (relative to the HTML file)
            await this.assetManager.loadTexture('nave1', 'assets/nave_pixel_1.png');
            await this.assetManager.loadTexture('nave2', 'assets/nave_pixel_2.png');
            await this.assetManager.loadTexture('nave3', 'assets/nave_pixel_3.png');
            await this.assetManager.loadTexture('nave4', 'assets/nave_pixel_4.png');
            await this.assetManager.loadTexture('nave5', 'assets/nave_pixel_5.png');

            // Load enemy textures
            await this.assetManager.loadTexture('enemy1', 'assets/enemi_pixel_1.png');
            await this.assetManager.loadTexture('enemy2', 'assets/enemi_pixel_2.png');
            await this.assetManager.loadTexture('enemy3', 'assets/enemi_pixel_3.png');

            // Load projectile texture
            await this.assetManager.loadTexture('laser', 'assets/laser_pixel.png');

            console.log('All game assets loaded successfully');

            // Register textures with render systems
            this.registerTexturesWithRenderSystems();
        } catch (error) {
            console.error('Failed to load assets:', error);
            throw new Error(`Asset loading failed: ${error}`);
        }
    }

    /**
     * Register loaded textures with all render systems
     */
    private registerTexturesWithRenderSystems(): void {
        const renderSystems = this.engine.getGameLoop().getSystems().filter(system =>
            system.constructor.name === 'RenderSystem'
        ) as Array<RenderSystem>;

        const textureNames = ['nave1', 'nave2', 'nave3', 'nave4', 'nave5', 'enemy1', 'enemy2', 'enemy3', 'laser'];

        renderSystems.forEach((renderSystem) => {
            textureNames.forEach(textureName => {
                const texture = this.assetManager.getTexture(textureName);
                if (texture) {
                    renderSystem.registerTexture(textureName, texture);
                    console.log(`Registered texture: ${textureName}`);
                }
            });
        });

        console.log('All textures registered with render systems.');
    }

    private setupInput() {
        this.eventSystem.on(INPUT_EVENTS.KEYDOWN, (event) => {
            console.log(`[EventSystem] Event received: ${INPUT_EVENTS.KEYDOWN}`, event);
            const keyData = event.data as { code: string };
            const transform = this.player.getComponent('transform');
            if (!transform) return;

            const speed = 10; // Velocidad de movimiento

            switch (keyData.code) {
                case 'ArrowUp':
                    transform.position.y -= speed;
                    break;
                case 'ArrowDown':
                    transform.position.y += speed;
                    break;
                case 'ArrowLeft':
                    transform.position.x -= speed;
                    break;
                case 'ArrowRight':
                    transform.position.x += speed;
                    break;
            }
        });

        this.eventSystem.on<EventData>(INPUT_EVENTS.MOUSEMOVE, ({ data, type }) => {
            const { event: mouseEvent } = data;

            const transform = this.player.getComponent('transform');
            if (transform) {
                transform.position.x = mouseEvent.position.x;
            }
        });

        this.eventSystem.on<EventData>(INPUT_EVENTS.MOUSEDOWN, ({ data, type }) => {
            console.log({ data });

            const { event: mouseEvent } = data;
            if (mouseEvent.button === 0) { // Left click
                this.fireProjectile();
            }
        });

        this.eventSystem.on(INPUT_EVENTS.KEYDOWN, (event) => {
            const keyData = event.data as { code: string };
            if (keyData.code === 'Space') {
                this.changePlayerShip();
            }
        });
    }

    private changePlayerShip() {
        this.currentShipIndex = (this.currentShipIndex + 1) % this.playerShips.length;
        const sprite = this.player.getComponent('sprite');
        if (sprite) {
            sprite.texture = this.playerShips[this.currentShipIndex];
        }
    }

    private setupEnemySpawner() {
        setInterval(() => {
            if (!this.engine.isRunning) return;

            const enemy = new Entity();
            const randomEnemyType = this.enemyShips[Math.floor(Math.random() * this.enemyShips.length)];

            enemy.addComponent({
                type: 'transform',
                position: {
                    x: Math.random() * 800,
                    y: 50
                },
                rotation: 90,
                scale: { x: 1, y: 1 }
            });


            enemy.addComponent({
                type: 'sprite',
                texture: randomEnemyType,
                width: 48,
                height: 48,
                tint: { r: 255, g: 255, b: 255, a: 200 },
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
        this.eventSystem.on(PHYSICS_EVENTS.COLLISION_BEGIN, (event) => {
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
            tint: { r: 255, g: 255, b: 255, a: 255 },
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
            acceleration: { x: 1, y: 1 },
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
