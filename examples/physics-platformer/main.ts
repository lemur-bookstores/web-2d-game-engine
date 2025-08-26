import { GameEngine } from '@/core/Engine';
import { Scene } from '@/core/Scene';
import { Entity } from '@/ecs/Entity';
import { PhysicsWorld } from '@/physics/PhysicsWorld';
import { PhysicsBody, PhysicsBodyType, PhysicsShape } from '@/physics/PhysicsBody';
import { Vector2 } from '@/math/Vector2';

// Minimal example runtime for the platformer skeleton.
async function run() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const engine = new GameEngine({ canvas, width: 800, height: 600, renderer: 'canvas2d' });
    const scene = new Scene('level1');
    engine.addScene(scene);
    engine.setActiveScene('level1');

    // initialize engine
    await engine.initialize();

    const world = await PhysicsWorld.getInstance();

    // player
    const playerEntity = new Entity('player');
    playerEntity.addComponent({ type: 'transform', position: new Vector2(400, 300) });
    playerEntity.addComponent({ type: 'rectangle', width: 32, height: 64, color: '#00ff00' });

    // try to create a physics body if box2d available
    const b = new PhysicsBody(world, {
        type: PhysicsBodyType.Dynamic,
        shape: PhysicsShape.Box,
        width: 1,
        height: 2,
        density: 1,
        position: new Vector2(400, 300),
    } as any);

    // simple input for jump
    window.addEventListener('keydown', (ev) => {
        if (ev.code === 'Space') {
            b.applyImpulse(new Vector2(0, -5));
        }
    });

    scene.addEntity(playerEntity);
    engine.start();
}

run().catch((e) => console.error('Example run failed', e));
