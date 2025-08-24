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

class BrickBreakerGame {
    private engine: GameEngine;
    private paddle: Entity;
    private ball: Entity;
    private bricks: Entity[] = [];
    private eventSystem: EventSystem;
    private inputSystem: InputSystem;
    private inputManager: InputManager;
    private score: number = 0;
    private lives: number = 3;
    private gameStarted: boolean = false;
    private gameOver: boolean = false;
    private ballSpeed: number = 5;
    private paddleSpeed: number = 10;
    private brickRows: number = 5;
    private brickCols: number = 10;
    private brickWidth: number = 75;
    private brickHeight: number = 20;
    private brickPadding: number = 10;
    private brickOffsetTop: number = 60;
    private brickOffsetLeft: number = 35;
    private brickColors: string[] = ['#FF5252', '#FF4081', '#7C4DFF', '#536DFE', '#448AFF'];

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

        console.log('Brick Breaker game engine created');
    }

    async initialize() {
        // Crear escena principal
        const mainScene = new Scene('main');
        
        // Añadir sistemas al motor
        this.engine.addSystem(new RenderSystem());
        this.engine.addSystem(this.inputSystem);
        this.engine.addSystem(new MovementSystem());
        this.engine.addSystem(new CollisionSystem());

        // Registrar la escena en el motor
        this.engine.addScene(mainScene);
        this.engine.setActiveScene('main');

        // Crear entidades del juego
        this.createPaddle();
        this.createBall();
        this.createBricks();

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

    private createPaddle() {
        const canvasWidth = this.engine.getWidth();
        const canvasHeight = this.engine.getHeight();

        this.paddle = new Entity('paddle');
        this.paddle.addComponent({
            type: 'transform',
            position: { x: canvasWidth / 2, y: canvasHeight - 30 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        this.paddle.addComponent({
            type: 'rectangle',
            width: 100,
            height: 15,
            color: '#2196F3'
        });

        this.paddle.addComponent({
            type: 'collider',
            shape: 'rectangle',
            width: 100,
            height: 15,
            isTrigger: false
        });

        this.paddle.addComponent({
            type: 'rigidbody',
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            mass: 0, // Masa infinita para que no se mueva con colisiones
            isKinematic: true // Controlado por el jugador
        });

        // Añadir a la escena activa
        this.engine.getActiveScene().addEntity(this.paddle);
    }

    private createBall() {
        const canvasWidth = this.engine.getWidth();
        const paddlePos = this.paddle.getComponent('transform').position;

        this.ball = new Entity('ball');
        this.ball.addComponent({
            type: 'transform',
            position: { x: paddlePos.x, y: paddlePos.y - 15 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        this.ball.addComponent({
            type: 'circle',
            radius: 8,
            color: '#FFFFFF'
        });

        this.ball.addComponent({
            type: 'collider',
            shape: 'circle',
            radius: 8,
            isTrigger: false
        });

        this.ball.addComponent({
            type: 'rigidbody',
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            mass: 1,
            isKinematic: false
        });

        // Añadir a la escena activa
        this.engine.getActiveScene().addEntity(this.ball);
    }

    private createBricks() {
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                const brick = new Entity(`brick_${row}_${col}`);
                
                const brickX = col * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                const brickY = row * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                
                brick.addComponent({
                    type: 'transform',
                    position: { x: brickX, y: brickY },
                    rotation: 0,
                    scale: { x: 1, y: 1 }
                });

                brick.addComponent({
                    type: 'rectangle',
                    width: this.brickWidth,
                    height: this.brickHeight,
                    color: this.brickColors[row % this.brickColors.length]
                });

                brick.addComponent({
                    type: 'collider',
                    shape: 'rectangle',
                    width: this.brickWidth,
                    height: this.brickHeight,
                    isTrigger: false
                });

                // Añadir a la escena activa
                this.engine.getActiveScene().addEntity(brick);
                this.bricks.push(brick);
            }
        }
    }

    private setupInputEvents() {
        // Mover paleta con teclado
        this.eventSystem.on(INPUT_EVENTS.KEYDOWN, (data: any) => {
            if (this.gameOver) return;
            
            const paddleRb = this.paddle.getComponent('rigidbody');
            
            if (data.key === 'ArrowLeft') {
                paddleRb.velocity.x = -this.paddleSpeed;
            } else if (data.key === 'ArrowRight') {
                paddleRb.velocity.x = this.paddleSpeed;
            } else if (data.key === 'Space' && !this.gameStarted) {
                this.launchBall();
            }
        });

        this.eventSystem.on(INPUT_EVENTS.KEYUP, (data: any) => {
            if (this.gameOver) return;
            
            const paddleRb = this.paddle.getComponent('rigidbody');
            
            if (data.key === 'ArrowLeft' || data.key === 'ArrowRight') {
                paddleRb.velocity.x = 0;
            }
        });

        // Mover paleta con ratón
        this.eventSystem.on(INPUT_EVENTS.MOUSEMOVE, (data: any) => {
            if (this.gameOver) return;
            
            const paddleTransform = this.paddle.getComponent('transform');
            const paddleWidth = this.paddle.getComponent('rectangle').width;
            const canvasWidth = this.engine.getWidth();
            
            // Limitar la posición de la paleta dentro del canvas
            let newX = data.position.x;
            if (newX < paddleWidth / 2) newX = paddleWidth / 2;
            if (newX > canvasWidth - paddleWidth / 2) newX = canvasWidth - paddleWidth / 2;
            
            paddleTransform.position.x = newX;
            
            // Si el juego no ha comenzado, mover la bola con la paleta
            if (!this.gameStarted) {
                const ballTransform = this.ball.getComponent('transform');
                ballTransform.position.x = paddleTransform.position.x;
            }
        });

        // Lanzar bola con clic
        this.eventSystem.on(INPUT_EVENTS.MOUSEDOWN, (data: any) => {
            if (this.gameOver) return;
            
            if (!this.gameStarted && data.button === 0) {
                this.launchBall();
            }
        });

        // Soporte para dispositivos táctiles
        this.eventSystem.on(INPUT_EVENTS.TOUCHMOVE, (data: any) => {
            if (this.gameOver) return;
            
            if (data.touches && data.touches.length > 0) {
                const touch = data.touches[0];
                const paddleTransform = this.paddle.getComponent('transform');
                const paddleWidth = this.paddle.getComponent('rectangle').width;
                const canvasWidth = this.engine.getWidth();
                
                // Limitar la posición de la paleta dentro del canvas
                let newX = touch.position.x;
                if (newX < paddleWidth / 2) newX = paddleWidth / 2;
                if (newX > canvasWidth - paddleWidth / 2) newX = canvasWidth - paddleWidth / 2;
                
                paddleTransform.position.x = newX;
                
                // Si el juego no ha comenzado, mover la bola con la paleta
                if (!this.gameStarted) {
                    const ballTransform = this.ball.getComponent('transform');
                    ballTransform.position.x = paddleTransform.position.x;
                }
            }
        });

        this.eventSystem.on(INPUT_EVENTS.TOUCHSTART, (data: any) => {
            if (this.gameOver) return;
            
            if (!this.gameStarted) {
                this.launchBall();
            }
        });
    }

    private setupCollisionEvents() {
        // Detectar colisiones
        this.eventSystem.on(PHYSICS_EVENTS.COLLISION, (data: any) => {
            if (this.gameOver) return;
            
            const { entityA, entityB } = data;
            
            // Colisión de la bola con la paleta
            if ((entityA.id === 'ball' && entityB.id === 'paddle') ||
                (entityA.id === 'paddle' && entityB.id === 'ball')) {
                this.handlePaddleCollision();
            }
            
            // Colisión de la bola con un ladrillo
            if (entityA.id === 'ball' && entityB.id.startsWith('brick_')) {
                this.handleBrickCollision(entityB);
            } else if (entityB.id === 'ball' && entityA.id.startsWith('brick_')) {
                this.handleBrickCollision(entityA);
            }
        });

        // Actualizar lógica del juego en cada frame
        this.eventSystem.on(ENGINE_EVENTS.UPDATE, (deltaTime: number) => {
            if (this.gameOver) return;
            
            this.checkBallBounds();
            
            // Si el juego no ha comenzado, mantener la bola sobre la paleta
            if (!this.gameStarted) {
                const paddleTransform = this.paddle.getComponent('transform');
                const ballTransform = this.ball.getComponent('transform');
                ballTransform.position.x = paddleTransform.position.x;
                ballTransform.position.y = paddleTransform.position.y - 15;
            }
        });
    }

    private launchBall() {
        this.gameStarted = true;
        const ballRb = this.ball.getComponent('rigidbody');
        
        // Lanzar la bola en una dirección aleatoria hacia arriba
        const angle = Math.random() * Math.PI / 4 + Math.PI / 4; // Entre 45 y 135 grados
        ballRb.velocity.x = this.ballSpeed * Math.cos(angle);
        ballRb.velocity.y = -this.ballSpeed * Math.sin(angle);
    }

    private handlePaddleCollision() {
        const ballRb = this.ball.getComponent('rigidbody');
        const ballTransform = this.ball.getComponent('transform');
        const paddleTransform = this.paddle.getComponent('transform');
        
        // Calcular el punto de impacto relativo a la paleta (-1 a 1)
        const paddleWidth = this.paddle.getComponent('rectangle').width;
        const hitPoint = (ballTransform.position.x - paddleTransform.position.x) / (paddleWidth / 2);
        
        // Calcular el ángulo de rebote basado en el punto de impacto
        const bounceAngle = hitPoint * (Math.PI / 3); // Máximo 60 grados
        
        // Aplicar velocidad con el nuevo ángulo
        ballRb.velocity.x = this.ballSpeed * Math.sin(bounceAngle);
        ballRb.velocity.y = -this.ballSpeed * Math.cos(bounceAngle);
        
        // Asegurar que la bola siempre se mueva hacia arriba después de golpear la paleta
        if (ballRb.velocity.y > 0) {
            ballRb.velocity.y *= -1;
        }
    }

    private handleBrickCollision(brick: Entity) {
        // Eliminar el ladrillo
        this.engine.getActiveScene().removeEntity(brick.id);
        
        // Eliminar de la lista de ladrillos
        this.bricks = this.bricks.filter(b => b.id !== brick.id);
        
        // Aumentar puntuación
        this.score += 10;
        this.updateUI();
        
        // Comprobar si se han eliminado todos los ladrillos
        if (this.bricks.length === 0) {
            this.handleLevelComplete();
        }
        
        // Invertir dirección Y de la bola
        const ballRb = this.ball.getComponent('rigidbody');
        ballRb.velocity.y *= -1;
        
        // Añadir pequeña variación aleatoria a la velocidad X para hacer el juego más interesante
        ballRb.velocity.x += (Math.random() - 0.5) * 0.5;
    }

    private checkBallBounds() {
        if (!this.gameStarted) return;
        
        const ballTransform = this.ball.getComponent('transform');
        const ballRb = this.ball.getComponent('rigidbody');
        const ballRadius = this.ball.getComponent('circle').radius;
        const canvasWidth = this.engine.getWidth();
        const canvasHeight = this.engine.getHeight();
        
        // Rebote en los bordes laterales
        if (ballTransform.position.x - ballRadius <= 0 || 
            ballTransform.position.x + ballRadius >= canvasWidth) {
            ballRb.velocity.x *= -1;
        }
        
        // Rebote en el borde superior
        if (ballTransform.position.y - ballRadius <= 0) {
            ballRb.velocity.y *= -1;
        }
        
        // Si la bola cae por debajo del canvas
        if (ballTransform.position.y - ballRadius > canvasHeight) {
            this.handleBallLost();
        }
    }

    private handleBallLost() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.handleGameOver();
        } else {
            // Reiniciar posición de la bola
            this.resetBall();
        }
    }

    private resetBall() {
        this.gameStarted = false;
        
        const paddleTransform = this.paddle.getComponent('transform');
        const ballTransform = this.ball.getComponent('transform');
        const ballRb = this.ball.getComponent('rigidbody');
        
        ballTransform.position.x = paddleTransform.position.x;
        ballTransform.position.y = paddleTransform.position.y - 15;
        ballRb.velocity.x = 0;
        ballRb.velocity.y = 0;
    }

    private handleLevelComplete() {
        alert('¡Nivel completado! Puntuación: ' + this.score);
        
        // Reiniciar el nivel con más dificultad
        this.ballSpeed += 1;
        this.resetBall();
        this.createBricks();
    }

    private handleGameOver() {
        this.gameOver = true;
        alert('¡Juego terminado! Puntuación final: ' + this.score);
        
        // Opción para reiniciar
        if (confirm('¿Quieres jugar de nuevo?')) {
            this.restartGame();
        }
    }

    private restartGame() {
        // Reiniciar variables del juego
        this.score = 0;
        this.lives = 3;
        this.gameStarted = false;
        this.gameOver = false;
        this.ballSpeed = 5;
        
        // Limpiar ladrillos existentes
        this.bricks.forEach(brick => {
            this.engine.getActiveScene().removeEntity(brick.id);
        });
        this.bricks = [];
        
        // Reiniciar posiciones
        this.resetBall();
        
        // Crear nuevos ladrillos
        this.createBricks();
        
        // Actualizar UI
        this.updateUI();
    }

    private updateUI() {
        const scoreElement = document.getElementById('score');
        const livesElement = document.getElementById('lives');
        
        if (scoreElement) scoreElement.textContent = this.score.toString();
        if (livesElement) livesElement.textContent = this.lives.toString();
    }
}

// Iniciar el juego cuando se cargue la página
window.addEventListener('load', () => {
    const game = new BrickBreakerGame();
    game.initialize();
});