# Ejemplos del Motor de Juegos 2D

Este directorio contiene varios ejemplos que muestran cómo utilizar el motor de juegos 2D para crear diferentes tipos de juegos. Cada ejemplo demuestra diferentes características y capacidades del motor.

## Ejemplos Disponibles

### 1. Brick Breaker

Un juego clásico de romper ladrillos donde controlas una paleta para rebotar una bola y destruir todos los ladrillos.

**Características demostradas:**
- Detección de colisiones
- Física básica (rebotes)
- Manejo de entrada (teclado y ratón)
- Sistema de puntuación
- Gestión de estados del juego

**Cómo ejecutar:**
```bash
npm run dev
```
Y navega a `http://localhost:3000/examples/brick-breaker/`

### 2. Memory Game

Un juego de memoria donde debes encontrar pares de cartas coincidentes.

**Características demostradas:**
- Gestión de eventos de entrada
- Manipulación de entidades
- Temporizadores y contadores
- Diferentes niveles de dificultad
- Interfaz de usuario interactiva

**Cómo ejecutar:**
```bash
npm run dev
```
Y navega a `http://localhost:3000/examples/memory-game/`

### 3. Simple Platformer

Un juego de plataformas simple donde controlas un personaje que debe recoger monedas saltando entre plataformas.

**Características demostradas:**
- Física de plataformas (gravedad, saltos)
- Detección de colisiones avanzada
- Triggers para recolección de objetos
- Control de personaje
- Límites del mundo y reinicio

**Cómo ejecutar:**
```bash
npm run dev
```
Y navega a `http://localhost:3000/examples/simple-platformer/`

### 4. Space Shooter

Un juego de disparos espaciales donde controlas una nave que debe destruir enemigos.

**Características demostradas:**
- Sistema de partículas
- Gestión de múltiples entidades
- Carga de assets
- Detección de colisiones
- Sistemas de armas

**Cómo ejecutar:**
```bash
npm run dev
```
Y navega a `http://localhost:3000/examples/space-shooter/`

### 5. Basic Core

Un ejemplo básico que muestra los fundamentos del motor.

**Características demostradas:**
- Configuración básica del motor
- Creación de entidades simples
- Renderizado básico

**Cómo ejecutar:**
```bash
npm run dev
```
Y navega a `http://localhost:3000/examples/basic-core/`

## Cómo Usar los Ejemplos

1. Clona el repositorio
2. Instala las dependencias con `npm install`
3. Ejecuta el servidor de desarrollo con `npm run dev`
4. Navega a la URL del ejemplo que quieras probar

## Estructura de un Ejemplo

Cada ejemplo sigue una estructura similar:

```
ejemplo/
  ├── index.html     # Página HTML que carga el juego
  ├── index.ts       # Código principal del juego
  └── assets/        # Recursos (imágenes, sonidos, etc.)
```

## Creando Tu Propio Ejemplo

Para crear tu propio ejemplo:

1. Crea una nueva carpeta en el directorio `examples/`
2. Crea un archivo `index.html` que cargue tu juego
3. Crea un archivo `index.ts` con la lógica de tu juego
4. Importa las clases necesarias del motor desde `../../src/`
5. Inicializa el motor y configura tu juego

## Documentación

Para más información sobre cómo utilizar el motor, consulta la documentación principal del proyecto.