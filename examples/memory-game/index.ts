import { GameEngine } from '../../src';
import { Scene } from '../../src/core/Scene';
import { Entity } from '../../src/ecs/Entity';
import { EventSystem } from '../../src/core/EventSystem';
import { InputManager, InputSystem } from '../../src/input';
import { RenderSystem } from '../../src/graphics';
import { ENGINE_EVENTS, INPUT_EVENTS } from '../../src/types/event-const';
import { Vector2 } from '../../src/math/Vector2';

class MemoryGame {
    private engine: GameEngine;
    private eventSystem: EventSystem;
    private inputSystem: InputSystem;
    private inputManager: InputManager;
    private cards: Entity[] = [];
    private cardValues: number[] = [];
    private flippedCards: Entity[] = [];
    private matchedPairs: number = 0;
    private totalPairs: number = 8;
    private moves: number = 0;
    private gameStarted: boolean = false;
    private gameOver: boolean = false;
    private startTime: number = 0;
    private elapsedTime: number = 0;
    private timerInterval: number | null = null;
    private difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    private cardWidth: number = 80;
    private cardHeight: number = 120;
    private cardBackColor: string = '#2980b9';
    private cardFrontColors: string[] = [
        '#e74c3c', '#9b59b6', '#3498db', '#2ecc71',
        '#f1c40f', '#e67e22', '#1abc9c', '#34495e'
    ];
    private canFlip: boolean = true;

    constructor() {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Inicializar InputManager
        this.inputManager = InputManager.getInstance();
        this.inputManager.initialize({
            canvas,
            preventDefaultKeys: [],
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

        console.log('Memory Game engine created');

        // Configurar botones de la interfaz
        this.setupUIButtons();
    }

    async initialize() {
        // Crear escena principal
        const mainScene = new Scene('main');
        
        // Añadir sistemas a la escena
        mainScene.addSystem(new RenderSystem());
        mainScene.addSystem(this.inputSystem);

        // Registrar la escena en el motor
        this.engine.addScene(mainScene);
        this.engine.setActiveScene('main');

        // Crear cartas del juego
        this.createCards();

        // Configurar eventos de input
        this.setupInputEvents();

        // Iniciar el bucle del juego
        this.engine.start();
        this.startGame();
        console.log('Game started');
    }

    private setupUIButtons() {
        const restartBtn = document.getElementById('restartBtn');
        const difficultyBtn = document.getElementById('difficultyBtn');

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        if (difficultyBtn) {
            difficultyBtn.addEventListener('click', () => {
                this.cycleDifficulty();
            });
        }
    }

    private cycleDifficulty() {
        if (this.difficulty === 'easy') {
            this.difficulty = 'medium';
            this.totalPairs = 8;
        } else if (this.difficulty === 'medium') {
            this.difficulty = 'hard';
            this.totalPairs = 12;
        } else {
            this.difficulty = 'easy';
            this.totalPairs = 6;
        }

        alert(`Dificultad cambiada a: ${this.difficulty.toUpperCase()}`);
        this.restartGame();
    }

    private createCards() {
        // Limpiar cartas existentes
        this.cards.forEach(card => {
            this.engine.getActiveScene().removeEntity(card.id);
        });
        this.cards = [];

        // Crear array de valores para las cartas (pares)
        this.cardValues = [];
        for (let i = 0; i < this.totalPairs; i++) {
            this.cardValues.push(i);
            this.cardValues.push(i);
        }

        // Mezclar los valores
        this.shuffleArray(this.cardValues);

        // Calcular filas y columnas según la dificultad
        let rows = 3;
        let cols = 4;

        if (this.difficulty === 'easy') {
            rows = 3;
            cols = 4;
        } else if (this.difficulty === 'medium') {
            rows = 4;
            cols = 4;
        } else if (this.difficulty === 'hard') {
            rows = 4;
            cols = 6;
        }

        // Calcular espaciado
        const spacing = 20;
        const startX = (this.engine.getWidth() - (cols * this.cardWidth + (cols - 1) * spacing)) / 2;
        const startY = (this.engine.getHeight() - (rows * this.cardHeight + (rows - 1) * spacing)) / 2;

        // Crear entidades de cartas
        let cardIndex = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (cardIndex >= this.cardValues.length) break;

                const x = startX + col * (this.cardWidth + spacing);
                const y = startY + row * (this.cardHeight + spacing);
                
                const card = this.createCard(cardIndex, this.cardValues[cardIndex], x, y);
                this.cards.push(card);
                this.engine.getActiveScene().addEntity(card);
                
                cardIndex++;
            }
        }
    }

    private createCard(index: number, value: number, x: number, y: number): Entity {
        const card = new Entity(`card_${index}`);
        
        // Añadir componente de transformación
        card.addComponent({
            type: 'transform',
            position: { x, y },
            rotation: 0,
            scale: { x: 1, y: 1 }
        });

        // Añadir componente de rectángulo (parte trasera de la carta)
        card.addComponent({
            type: 'rectangle',
            width: this.cardWidth,
            height: this.cardHeight,
            color: this.cardBackColor
        });

        // Añadir datos personalizados para la carta
        card.addComponent({
            type: 'custom',
            value,
            isFlipped: false,
            isMatched: false
        });

        return card;
    }

    private setupInputEvents() {
        // Manejar clics en las cartas
        this.eventSystem.on(INPUT_EVENTS.MOUSEDOWN, (data: any) => {
            if (this.gameOver || !this.canFlip) return;
            
            const clickedCard = this.findCardAtPosition(data.position.x, data.position.y);
            if (clickedCard) {
                this.handleCardClick(clickedCard);
            }
        });

        // Soporte para dispositivos táctiles
        this.eventSystem.on(INPUT_EVENTS.TOUCHSTART, (data: any) => {
            if (this.gameOver || !this.canFlip) return;
            
            if (data.touches && data.touches.length > 0) {
                const touch = data.touches[0];
                const touchedCard = this.findCardAtPosition(touch.position.x, touch.position.y);
                if (touchedCard) {
                    this.handleCardClick(touchedCard);
                }
            }
        });

        // Actualizar lógica del juego en cada frame
        this.eventSystem.on(ENGINE_EVENTS.UPDATE, (deltaTime: number) => {
            if (this.gameStarted && !this.gameOver) {
                this.updateTimer();
            }
        });
    }

    private findCardAtPosition(x: number, y: number): Entity | null {
        for (const card of this.cards) {
            const transform = card.getComponent('transform');
            const rect = card.getComponent('rectangle');
            const custom = card.getComponent('custom');
            
            // Ignorar cartas ya emparejadas
            if (custom.isMatched) continue;
            
            // Comprobar si el punto está dentro de la carta
            if (x >= transform.position.x - rect.width / 2 &&
                x <= transform.position.x + rect.width / 2 &&
                y >= transform.position.y - rect.height / 2 &&
                y <= transform.position.y + rect.height / 2) {
                return card;
            }
        }
        
        return null;
    }

    private handleCardClick(card: Entity) {
        const custom = card.getComponent('custom');
        
        // Ignorar si la carta ya está volteada o emparejada
        if (custom.isFlipped || custom.isMatched) return;
        
        // Voltear la carta
        this.flipCard(card, true);
        
        // Añadir a la lista de cartas volteadas
        this.flippedCards.push(card);
        
        // Si hay dos cartas volteadas, comprobar si son pareja
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateUI();
            
            const card1 = this.flippedCards[0];
            const card2 = this.flippedCards[1];
            
            const value1 = card1.getComponent('custom').value;
            const value2 = card2.getComponent('custom').value;
            
            if (value1 === value2) {
                // Es una pareja
                this.handleMatch();
            } else {
                // No es una pareja, voltear de nuevo después de un tiempo
                this.canFlip = false;
                setTimeout(() => {
                    this.flipCard(card1, false);
                    this.flipCard(card2, false);
                    this.flippedCards = [];
                    this.canFlip = true;
                }, 1000);
            }
        }
    }

    private flipCard(card: Entity, isFlipped: boolean) {
        const custom = card.getComponent('custom');
        const rect = card.getComponent('rectangle');
        
        custom.isFlipped = isFlipped;
        
        if (isFlipped) {
            // Mostrar el color correspondiente al valor
            const colorIndex = custom.value % this.cardFrontColors.length;
            rect.color = this.cardFrontColors[colorIndex];
        } else {
            // Mostrar el reverso de la carta
            rect.color = this.cardBackColor;
        }
    }

    private handleMatch() {
        // Marcar las cartas como emparejadas
        this.flippedCards.forEach(card => {
            card.getComponent('custom').isMatched = true;
        });
        
        // Incrementar contador de parejas
        this.matchedPairs++;
        this.updateUI();
        
        // Limpiar lista de cartas volteadas
        this.flippedCards = [];
        
        // Comprobar si se han encontrado todas las parejas
        if (this.matchedPairs === this.totalPairs) {
            this.handleGameComplete();
        }
    }

    private handleGameComplete() {
        this.gameOver = true;
        clearInterval(this.timerInterval as number);
        
        setTimeout(() => {
            alert(`¡Juego completado! Movimientos: ${this.moves}, Tiempo: ${this.formatTime(this.elapsedTime)}`);
        }, 500);
    }

    private startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.matchedPairs = 0;
        this.moves = 0;
        this.flippedCards = [];
        this.startTime = Date.now();
        this.elapsedTime = 0;
        
        // Iniciar temporizador
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.updateUI();
        }, 1000) as unknown as number;
        
        this.updateUI();
    }

    private restartGame() {
        // Detener temporizador actual
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Recrear cartas
        this.createCards();
        
        // Reiniciar variables del juego
        this.startGame();
    }

    private updateTimer() {
        if (this.gameStarted && !this.gameOver) {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        }
    }

    private updateUI() {
        const movesElement = document.getElementById('moves');
        const timeElement = document.getElementById('time');
        const pairsElement = document.getElementById('pairs');
        
        if (movesElement) movesElement.textContent = this.moves.toString();
        if (timeElement) timeElement.textContent = this.formatTime(this.elapsedTime);
        if (pairsElement) pairsElement.textContent = `${this.matchedPairs} / ${this.totalPairs}`;
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Iniciar el juego cuando se cargue la página
window.addEventListener('load', () => {
    const game = new MemoryGame();
    game.initialize();
});