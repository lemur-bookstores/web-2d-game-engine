import { GameEngine } from '../../src';
import { AssetManager } from '../../src/assets/AssetManager';
import { AudioManager } from '../../src/audio/AudioManager';
import { AudioSystem } from '../../src/audio/AudioSystem';
import { Scene } from '../../src/core/Scene';
import { Entity } from '../../src/ecs/Entity';
import { MovementSystem } from '../../src/ecs/MovementSystem';
import { AnimationSystem, RenderSystem } from '../../src/graphics';
import { InputManager, InputSystem } from '../../src/input';

// Main game class
class PlatformerGame {
    engine: GameEngine;
    assetManager: AssetManager;
    inputManager: InputManager;
    inputSystem: InputSystem;
    audioManager: AudioManager;
    scene: Scene;
    player: Player;
    world: PlatformWorld;

    constructor(canvas: HTMLCanvasElement) {
        this.assetManager = AssetManager.getInstance();
        this.audioManager = AudioManager.getInstance();
        this.inputManager = InputManager.getInstance();
        this.inputSystem = new InputSystem();

        this.engine = new GameEngine({
            canvas,
            width: 800,
            height: 600,
            renderer: 'canvas2d',
            debug: false
        });
        this.scene = new Scene('platformer');
        this.engine.addScene(this.scene);
    }

    async initialize() {
        // Initialize the game engine (now with automatic renderer fallback)
        await this.engine.initialize();

        // Verificar que el engine está listo
        if (!this.engine.isInitialized) {
            throw new Error('Engine failed to initialize properly');
        }

        await this.loadAssets();

        // Registrar texturas después de cargar assets y antes de crear entidades
        this.registerTextures();

        // Add systems
        this.engine.addSystem(new MovementSystem());
        this.engine.addSystem(this.inputManager);
        this.engine.addSystem(new AnimationSystem(this.assetManager));
        this.engine.addSystem(new AudioSystem());

        // Create world and player
        this.world = new PlatformWorld(this.scene);
        this.player = new Player(this.scene);

        this.engine.setActiveScene(this.scene);

        // Input y animación
        window.addEventListener('keydown', (e) => {
            const anim = this.player.entity.getComponent('animation');
            const transform = this.player.entity.getComponent('transform');
            if (!anim || !transform) return;
            switch (e.code) {
                case 'ArrowLeft':
                case 'ArrowRight':
                    anim.currentAnimation = 'walk';
                    anim.loop = true;
                    // Flip sprite según dirección
                    const sprite = this.player.entity.getComponent('sprite');
                    if (sprite) sprite.flipX = (e.code === 'ArrowLeft');
                    // Mover
                    transform.position.x += (e.code === 'ArrowLeft' ? -16 : 16);
                    break;
                case 'ArrowUp':
                case 'Space':
                    anim.currentAnimation = 'jump';
                    anim.loop = false;
                    // Saltar (simulado)
                    transform.position.y -= 48;
                    break;
                case 'KeyZ':
                    anim.currentAnimation = 'attack';
                    anim.loop = false;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            const anim = this.player.entity.getComponent('animation');
            if (!anim) return;
            // Volver a idle si no se está moviendo/saltando/atacando
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyZ"].includes(e.code)) {
                anim.currentAnimation = 'idle';
                anim.loop = true;
            }
        });
    }

    async loadAssets() {
        // Load spritesheets and textures
        await this.assetManager.loadSpriteSheet(
            'ninja',
            'assets/sprite-sheet-ninja.png',
            undefined,
            32,
            32
        );
        await this.assetManager.loadSpriteSheet(
            'platform',
            'assets/sprite-sheet-plataforma.png',
            undefined,
            32,
            32
        );
        // Optionally load audio assets here
        // await this.audioManager.loadAudio('jump', 'assets/jump.mp3');
    }

    registerTextures() {
        const renderSystems = this.engine.getGameLoop().getSystems().filter(system =>
            system.constructor.name === 'RenderSystem'
        ) as Array<RenderSystem>;
        ['ninja', 'platform'].forEach(name => {
            const ss = this.assetManager.getSpriteSheet(name);
            if (ss) {
                renderSystems.forEach(rs => rs.registerTexture(name, ss.getTexture()));
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

// World/platform class
class PlatformWorld {
    constructor(scene: Scene) {
        // Add ground/platform entities using platform spritesheet
        for (let i = 0; i < 25; i++) {
            const ground = new Entity();
            ground.addComponent({
                type: 'transform',
                position: { x: i * 48, y: 568 },
                rotation: 0,
                scale: { x: 1, y: 1 }
            });
            ground.addComponent({
                type: 'sprite',
                texture: 'platform',
                width: 53,
                height: 53,
                uvX: 0.4,
                uvY: 0.3,
                uvWidth: 53 / 321, // ancho frame / ancho sheet
                uvHeight: 53 / 258, // alto frame / alto sheet
                flipX: false,
                flipY: false
            });
            scene.addEntity(ground);
        }
    }
}

// Player class
class Player {
    entity: Entity;
    constructor(scene: Scene) {
        this.entity = new Entity();
        this.entity.addComponent({
            type: 'transform',
            position: { x: 100, y: 500 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });
        this.entity.addComponent({
            type: 'sprite',
            texture: 'ninja',
            width: 45,
            height: 64,
            uvX: 0.05,
            uvY: 0.05,
            uvWidth: 45 / 600, // ancho frame / ancho sheet
            uvHeight: 64 / 371, // alto frame / alto sheet
            flipX: false,
            flipY: false
        });
        // Definir animaciones del sprite-sheet ninja
        const animations = new Map<string, any>();
        // Idle (frames 0-3)
        animations.set('idle', {
            name: 'idle',
            frames: [0, 1, 2, 3],
            duration: 0.4,
            loop: true,
            pingPong: false
        });
        // Walk (frames 4-9)
        animations.set('walk', {
            name: 'walk',
            frames: [4, 5, 6, 7, 8, 9],
            duration: 0.3,
            loop: true,
            pingPong: false
        });
        // Jump (frames 10-13)
        animations.set('jump', {
            name: 'jump',
            frames: [10, 11, 12, 13],
            duration: 0.25,
            loop: false,
            pingPong: false
        });
        // Attack (frames 14-19)
        animations.set('attack', {
            name: 'attack',
            frames: [14, 15, 16, 17, 18, 19],
            duration: 0.2,
            loop: false,
            pingPong: false
        });
        // Hurt (frames 20-22)
        animations.set('hurt', {
            name: 'hurt',
            frames: [20, 21, 22],
            duration: 0.3,
            loop: false,
            pingPong: false
        });
        // Fall (frames 23-26)
        animations.set('fall', {
            name: 'fall',
            frames: [23, 24, 25, 26],
            duration: 0.25,
            loop: false,
            pingPong: false
        });
        // Land (frames 27-29)
        animations.set('land', {
            name: 'land',
            frames: [27, 28, 29],
            duration: 0.2,
            loop: false,
            pingPong: false
        });
        // Dead (frames 30-33)
        animations.set('dead', {
            name: 'dead',
            frames: [30, 31, 32, 33],
            duration: 0.4,
            loop: false,
            pingPong: false
        });

        this.entity.addComponent({
            type: 'animation',
            spriteSheet: 'ninja',
            currentAnimation: 'idle',
            currentFrame: 0,
            frameTime: 0.1,
            elapsedTime: 0,
            loop: true,
            playing: true,
            animations,
            frameSfx: {}
        });
        scene.addEntity(this.entity);
    }
}

// Start the game when the page loads
window.addEventListener('load', async () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
        throw new Error('Canvas element not found');
    }
    const game = new PlatformerGame(canvas);
    await game.initialize();
    game.start();
});