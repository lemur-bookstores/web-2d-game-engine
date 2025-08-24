import { AnimationSystem } from '../../src/graphics/AnimationSystem';
import { SpriteSheet } from '../../src/graphics/SpriteSheet';
import { AnimationComponent } from '../../src/graphics/Animation';
import { Entity } from '../../src/ecs/Entity';

// Mock a minimal spriteSheet with frame metadata
const mockTexture: any = { width: 64, height: 16, dispose: () => { } };
const spriteSheet = new SpriteSheet(mockTexture, 16, 16);
spriteSheet.addAnimation('walk', { name: 'walk', frames: [0, 1, 2, 3], duration: 0.1, loop: true, pingPong: false });

test('AnimationSystem advances frame with deltaTime', () => {
    const system = new AnimationSystem();
    system.registerSpriteSheet('mock', spriteSheet);

    const entity = new Entity('e1');
    const anim: AnimationComponent = {
        type: 'animation',
        spriteSheet: 'mock',
        currentAnimation: 'walk',
        currentFrame: 0,
        frameTime: 0.1,
        elapsedTime: 0,
        loop: true,
        playing: true
    };

    entity.addComponent(anim);
    entity.addComponent({ type: 'sprite', texture: '', width: 16, height: 16, uvX: 0, uvY: 0, uvWidth: 1, uvHeight: 1, flipX: false, flipY: false });

    // initial update with small dt should not advance
    system.update([entity], 0.05);
    expect(anim.currentFrame).toBe(0);

    // enough dt to advance one frame
    system.update([entity], 0.1);
    expect(anim.currentFrame).toBe(1);
});
