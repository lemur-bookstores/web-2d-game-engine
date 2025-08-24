import { GameEngine } from '../../src';
import { Scene } from '../../src/core/Scene';
import { Entity } from '../../src/ecs/Entity';
import { EventSystem } from '../../src/core/EventSystem';
import { InputManager, InputSystem } from '../../src/input';
import { RenderSystem } from '../../src/graphics';
import { MovementSystem } from '../../src/ecs/MovementSystem';
import { CollisionSystem } from '../../src/ecs/CollisionSystem';
import { ENGINE_EVENTS, INPUT_EVENTS, PHYSICS_EVENTS } from '../../src/types/event-const';
import { Vector2 } from '../../src/math/Vector2';

class SimplePlatformer {
    private engine: GameEngine;
    private player: Entity;
    private platforms: Entity[] = [];
    private coins: Entity[] = [];
    private eventSystem: EventSystem;
    private inputSystem: InputSystem;
    private inputManager: InputManager;
    private score: number = 0;
    private isJumping: boolean = false;
    private canJump: boolean = false;
    private gravity: number = 0.5;
    private jumpForce: number = -12;
    private moveSpeed: number = 5;

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
                "KeyW",
                "KeyA",
                "KeyS",
                "KeyD",
            ],
            enableTouch: true,
            enableMouse: true,
            enableKeyboard: true,
        });

        // Crear sistema de input para ECS
        this.inputSystem = new InputSystem();

        // Configuración del motor
        this.engine = new GameEngine({
            canvas,
            width: 800,
            height: 600,
            renderer: 'canvas2d',
            debug: false
        });

        // Escuchar eventos del motor
        this.eventSystem = EventSystem.getInstance();
        this.eventSystem.on(ENGINE_EVENTS.ERROR, (error) => {
            console.error('Engine error:', error);
        });

        console.log('Simple Platformer game engine created');
    }

    async initialize() {
        // Crear escena principal
        const mainScene = new Scene('main');
        
        // Añadir sistemas a la escena
        mainScene.addSystem(new RenderSystem());
        mainScene.addSystem(this.inputSystem);
        mainScene.addSystem(new MovementSystem());
        mainScene.addSystem(new CollisionSystem());

        // Registrar la escena en el motor
        this.engine.addScene(mainScene);
        this.engine.setActiveScene('main');

        // Crear entidades del juego
        this.createPlayer();
        this.createPlatforms();
        this.createCoins();

        // Configurar eventos de input
        this.setupInputEvents();

        // Configurar eventos de colisión
        this.setupCollisionEvents();

        // Actualizar UI
        this.updateUI();

        // Iniciar el bucle del juego
        this.engine.start();
        console.log('Game started');
    }

    private createPlayer() {
        this.player = new Entity('player');
        
        // Añadir componente de transformación
        this.player.addComponent({
            type: 'transform',
            position: { x: 100, y: 300 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        // Añadir componente visual
        this.player.addComponent({
            type: 'rectangle',
            width: 30,
            height: 50,
            color: '#3498db'
        });

        // Añadir componente de colisión
        this.player.addComponent({
            type: 'collider',
            shape: 'rectangle',
            width: 30,
            height: 50,
            isTrigger: false
        });

        // Añadir componente de física
        this.player.addComponent({
            type: 'rigidbody',
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            mass: 1,
            isKinematic: false
        });

        // Añadir a la escena activa
        this.engine.getActiveScene().addEntity(this.player);
    }

    private createPlatforms() {
        const platformData = [
            { x: 400, y: 500, width: 800, height: 20, color: '#2ecc71' }, // Suelo
            { x: 150, y: 400, width: 200, height: 20, color: '#2ecc71' },
            { x: 650, y: 400, width: 200, height: 20, color: '#2ecc71' },
            { x: 400, y: 300, width: 200, height: 20, color: '#2ecc71' },
            { x: 200, y: 200, width: 200, height: 20, color: '#2ecc71' },
            { x: 600, y: 200, width: 200, height: 20, color: '#2ecc71' },
        ];

        platformData.forEach((data, index) => {
            const platform = new Entity(`platform_${index}`);
            
            // Añadir componente de transformación
            platform.addComponent({
                type: 'transform',
                position: { x: data.x, y: data.y },
                rotation: 0,
                scale: { x: 1, y: 1 }
            });

            // Añadir componente visual
            platform.addComponent({
                type: 'rectangle',
                width: data.width,
                height: data.height,
                color: data.color
            });

            // Añadir componente de colisión
            platform.addComponent({
                type: 'collider',
                shape: 'rectangle',
                width: data.width,
                height: data.height,
                isTrigger: false
            });

            // Añadir componente de física (estático)
            platform.addComponent({
                type: 'rigidbody',
                velocity: { x: 0, y: 0 },
                acceleration: { x: 0, y: 0 },
                mass: 0, // Masa infinita para que no se mueva
                isKinematic: true
            });

            // Añadir a la escena activa
            this.engine.getActiveScene().addEntity(platform);
            this.platforms.push(platform);
        });
    }

    private createCoins() {
        const coinPositions = [
            { x: 150, y: 350 },
            { x: 650, y: 350 },
            { x: 400, y: 250 },
            { x: 200, y: 150 },
            { x: 600, y: 150 },
            { x: 300, y: 450 },
            { x: 500, y: 450 },
            { x: 700, y: 100 },
        ];

        coinPositions.forEach((pos, index) => {
            const coin = new Entity(`coin_${index}`);
            
            // Añadir componente de transformación
            coin.addComponent({
                type: 'transform',
                position: { x: pos.x, y: pos.y },
                rotation: 0,
                scale: { x: 1, y: 1 }
            });

            // Añadir componente visual
            coin.addComponent({
                type: 'circle',
                radius: 10,
                color: '#f1c40f'
            });

            // Añadir componente de colisión (trigger)
            coin.addComponent({
                type: 'collider',
                shape: 'circle',
                radius: 10,
                isTrigger: true
            });

            // Añadir a la escena activa
            this.engine.getActiveScene().addEntity(coin);
            this.coins.push(coin);
        });
    }

    private setupInputEvents() {
        // Manejar eventos de teclado
        this.eventSystem.on(INPUT_EVENTS.KEYDOWN, (data: any) => {
            const playerRb = this.player.getComponent('rigidbody');
            
            // Movimiento horizontal
            if (data.key === 'ArrowLeft' || data.key === 'KeyA') {
                playerRb.velocity.x = -this.moveSpeed;
            } else if (data.key === 'ArrowRight' || data.key === 'KeyD') {
                playerRb.velocity.x = this.moveSpeed;
            }
            
            // Salto
            if ((data.key === 'ArrowUp' || data.key === 'KeyW' || data.key === 'Space') && this.canJump) {
                playerRb.velocity.y = this.jumpForce;
                this.isJumping = true;
                this.canJump = false;
            }
        });

        this.eventSystem.on(INPUT_EVENTS.KEYUP, (data: any) => {
            const playerRb = this.player.getComponent('rigidbody');
            
            // Detener movimiento horizontal al soltar teclas
            if ((data.key === 'ArrowLeft' || data.key === 'KeyA') && playerRb.velocity.x < 0) {
                playerRb.velocity.x = 0;
            } else if ((data.key === 'ArrowRight' || data.key === 'KeyD') && playerRb.velocity.x > 0) {
                playerRb.velocity.x = 0;
            }
        });

        // Actualizar lógica del juego en cada frame
        this.eventSystem.on(ENGINE_EVENTS.UPDATE, (deltaTime: number) => {
            this.updatePlayer(deltaTime);
            this.checkBounds();
        });
    }

    private setupCollisionEvents() {
        // Detectar colisiones
        this.eventSystem.on(PHYSICS_EVENTS.COLLISION, (data: any) => {
            const { entityA, entityB, normal } = data;
            
            // Colisión del jugador con plataforma
            if (entityA.id === 'player' && entityB.id.startsWith('platform_')) {
                this.handlePlatformCollision(normal);
            } else if (entityB.id === 'player' && entityA.id.startsWith('platform_')) {
                this.handlePlatformCollision(new Vector2(-normal.x, -normal.y));
            }
        });

        // Detectar triggers
        this.eventSystem.on(PHYSICS_EVENTS.TRIGGER, (data: any) => {
            const { entityA, entityB } = data;
            
            // Colisión del jugador con moneda
            if (entityA.id === 'player' && entityB.id.startsWith('coin_')) {
                this.collectCoin(entityB);
            } else if (entityB.id === 'player' && entityA.id.startsWith('coin_')) {
                this.collectCoin(entityA);
            }
        });
    }

    private updatePlayer(deltaTime: number) {
        const playerRb = this.player.getComponent('rigidbody');
        
        // Aplicar gravedad
        playerRb.acceleration.y = this.gravity;
    }

    private handlePlatformCollision(normal: Vector2) {
        // Si la colisión es desde arriba (normal apunta hacia abajo)
        if (normal.y < -0.5) {
            this.canJump = true;
            this.isJumping = false;
            
            // Detener velocidad vertical
            const playerRb = this.player.getComponent('rigidbody');
            if (playerRb.velocity.y > 0) {
                playerRb.velocity.y = 0;
            }
        }
    }

    private collectCoin(coin: Entity) {
        // Eliminar la moneda de la escena
        this.engine.getActiveScene().removeEntity(coin.id);
        
        // Eliminar de la lista de monedas
        this.coins = this.coins.filter(c => c.id !== coin.id);
        
        // Aumentar puntuación
        this.score += 1;
        this.updateUI();
        
        // Comprobar si se han recogido todas las monedas
        if (this.coins.length === 0) {
            setTimeout(() => {
                alert('¡Nivel completado! Has recogido todas las monedas.');
                this.restartGame();
            }, 500);
        }
    }

    private checkBounds() {
        const playerTransform = this.player.getComponent('transform');
        const playerRb = this.player.getComponent('rigidbody');
        const canvasHeight = this.engine.getHeight();
        
        // Si el jugador cae fuera del canvas
        if (playerTransform.position.y > canvasHeight + 100) {
            this.resetPlayer();
        }
    }

    private resetPlayer() {
        const playerTransform = this.player.getComponent('transform');
        const playerRb = this.player.getComponent('rigidbody');
        
        // Reposicionar al jugador
        playerTransform.position.x = 100;
        playerTransform.position.y = 300;
        
        // Detener velocidad
        playerRb.velocity.x = 0;
        playerRb.velocity.y = 0;
    }

    private restartGame() {
        // Eliminar monedas existentes
        this.coins.forEach(coin => {
            this.engine.getActiveScene().removeEntity(coin.id);
        });
        this.coins = [];
        
        // Reiniciar variables del juego
        this.score = 0;
        this.resetPlayer();
        
        // Crear nuevas monedas
        this.createCoins();
        
        // Actualizar UI
        this.updateUI();
    }

    private updateUI() {
        const coinsElement = document.getElementById('coins');
        if (coinsElement) coinsElement.textContent = this.score.toString();
    }
}

// Iniciar el juego cuando se cargue la página
window.addEventListener('load', () => {
    const game = new SimplePlatformer();
    game.initialize();
});