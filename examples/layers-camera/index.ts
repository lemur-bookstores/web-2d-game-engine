import { GameEngine } from '../../src';
import { Scene } from '../../src/core/Scene';
import { Entity } from '../../src/ecs/Entity';
import { Texture, RenderSystem } from '../../src/graphics';
import { Camera2D } from '../../src/graphics/Camera2D';

// Helper: create an image filled with a color and return a loaded HTMLImageElement
function createColoredImage(width: number, height: number, color: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        const c = document.createElement('canvas');
        c.width = width;
        c.height = height;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = c.toDataURL();
    });
}

window.addEventListener('load', async () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas element not found');

    const engine = new GameEngine({
        canvas,
        width: 800,
        height: 600,
        renderer: 'canvas2d',
        debug: false
    });

    const scene = new Scene('layers-camera');
    engine.addScene(scene);

    // Configure custom layers (background lower, player middle, foreground top)
    scene.addLayer('background', 0x0100, undefined, true, 0.9);
    scene.addLayer('player', 0x0200, undefined, true, 1);
    scene.addLayer('foreground', 0x0400, undefined, true, 0.9);

    await engine.initialize();

    // Create and set camera
    const cam = engine.createCamera(canvas.width, canvas.height);
    engine.setCamera(cam);

    // Get render system to register textures
    const renderSystems = engine.getGameLoop().getSystems().filter(s => (s as any).constructor?.name === 'RenderSystem') as RenderSystem[];
    const rs = renderSystems[0];

    // Create textures
    const bgImg = await createColoredImage(1024, 768, '#2a6fb0');
    const playerImg = await createColoredImage(64, 64, '#39d353');
    const fgImg = await createColoredImage(256, 128, 'rgba(255,255,255,0.5)');

    rs.registerTexture('bg', new Texture(bgImg));
    rs.registerTexture('player', new Texture(playerImg));
    rs.registerTexture('fg', new Texture(fgImg));

    // Background entity (large)
    const bg = new Entity('bg');
    bg.addComponent({ type: 'transform', position: { x: 400, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } });
    bg.addComponent({ type: 'sprite', texture: 'bg', width: 1024, height: 768 });
    bg.setLayer('background');
    scene.addEntity(bg);

    // Player entity
    const player = new Entity('player');
    player.addComponent({ type: 'transform', position: { x: 400, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } });
    player.addComponent({ type: 'sprite', texture: 'player', width: 64, height: 64 });
    player.setLayer('player');
    scene.addEntity(player);

    // Foreground entity (decorative)
    const fg = new Entity('fg');
    fg.addComponent({ type: 'transform', position: { x: 520, y: 240 }, rotation: 0, scale: { x: 1, y: 1 } });
    fg.addComponent({ type: 'sprite', texture: 'fg', width: 256, height: 128 });
    fg.setLayer('foreground');
    scene.addEntity(fg);

    // Ensure render system knows layer order from scene
    rs.setLayerOrder(scene.getLayers());

    // Camera follow the player's transform component (object with position)
    const playerTransform = player.getComponent('transform');
    cam.follow(playerTransform, { lerp: 0.08, offset: { x: 0, y: 0 } } as any);

    // Simple input to move player with arrow keys
    window.addEventListener('keydown', (e) => {
        const t = player.getComponent('transform');
        if (!t) return;
        switch (e.code) {
            case 'ArrowLeft': t.position.x -= 16; break;
            case 'ArrowRight': t.position.x += 16; break;
            case 'ArrowUp': t.position.y -= 16; break;
            case 'ArrowDown': t.position.y += 16; break;
        }
    });

    // Update camera each frame by attaching to the game loop's fixed update (simple approach)
    engine.getGameLoop().getSystems();

    engine.setActiveScene(scene);
    engine.start();
});
