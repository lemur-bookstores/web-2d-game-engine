import { GameEngine, Scene, Vector2 } from "../../src";
import { Entity } from "../../src/ecs/Entity";
import { PhysicsBody, PhysicsBodyType, PhysicsShape } from "../../src/physics/PhysicsBody";
import { PhysicsWorld } from "../../src/physics/PhysicsWorld";

// Minimal example runtime for the platformer skeleton.
async function run() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const engine = new GameEngine({ canvas, width: 800, height: 600, renderer: 'canvas2d' });
    const scene = new Scene('level1');

    // Setup collision layers
    scene.addLayer('player', 0x0002);
    scene.addLayer('ground', 0x0008);

    engine.addScene(scene);
    engine.setActiveScene('level1');

    // initialize engine
    await engine.initialize();

    const world = await PhysicsWorld.getInstance();

    // Create ground bodies
    const ground1 = new PhysicsBody(world, {
        type: PhysicsBodyType.Static,
        shape: PhysicsShape.Box,
        width: 200,
        height: 20,
        position: new Vector2(200, 500),
        collisionCategory: scene.getLayer('ground')?.bit || 0x0008,
        collisionMask: 0xFFFF
    } as any);

    const ground2 = new PhysicsBody(world, {
        type: PhysicsBodyType.Static,
        shape: PhysicsShape.Box,
        width: 200,
        height: 20,
        position: new Vector2(600, 400),
        collisionCategory: scene.getLayer('ground')?.bit || 0x0008,
        collisionMask: 0xFFFF
    } as any);

    // player
    const playerEntity = new Entity('player');
    playerEntity.addComponent({ type: 'transform', position: new Vector2(400, 300) });
    playerEntity.addComponent({ type: 'rectangle', width: 32, height: 64, color: '#00ff00' });

    // Player physics body
    const playerBody = new PhysicsBody(world, {
        type: PhysicsBodyType.Dynamic,
        shape: PhysicsShape.Box,
        width: 1,
        height: 2,
        density: 1,
        position: new Vector2(400, 300),
        collisionCategory: scene.getLayer('player')?.bit || 0x0002,
        collisionMask: 0xFFFF
    } as any);

    // Ground detection function using raycast
    function isOnGround(): boolean {
        const playerPos = playerBody.getPosition();
        const rayOrigin = new Vector2(playerPos.x, playerPos.y + 1); // Start from bottom of player
        const rayDirection = new Vector2(0, 1); // Down
        const rayLength = 0.1; // Short ray just below player

        const hits = world.raycast(rayOrigin, rayDirection, rayLength, {
            layerMask: scene.getLayerMask(['ground']),
            includeSensors: false
        });

        return hits.length > 0;
    }

    // Enhanced input with ground detection
    window.addEventListener('keydown', (ev) => {
        if (ev.code === 'Space') {
            // Only jump if on ground
            if (isOnGround()) {
                playerBody.applyImpulse(new Vector2(0, -15));
                console.log('Jump!');
            } else {
                console.log('Cannot jump - not on ground');
            }
        }

        // Movement
        if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') {
            playerBody.applyForce(new Vector2(-50, 0));
        }
        if (ev.code === 'ArrowRight' || ev.code === 'KeyD') {
            playerBody.applyForce(new Vector2(50, 0));
        }
    });

    scene.addEntity(playerEntity);
    engine.start();

    console.log('Platformer example started!');
    console.log('Controls: Space = Jump, A/Left = Left, D/Right = Right');
    console.log('Ground detection uses raycast system');
}

run().catch((e) => console.error('Example run failed', e));
