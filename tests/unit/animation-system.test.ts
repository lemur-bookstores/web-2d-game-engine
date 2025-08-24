/// <reference types="vitest" />
import { AnimationSystem } from '../../src/graphics/AnimationSystem';
import { SpriteSheet } from '../../src/graphics/SpriteSheet';
import { AnimationComponent } from '../../src/graphics/Animation';
import { Entity } from '../../src/ecs/Entity';
import { expect, test } from 'vitest';
import { EventSystem } from '../../src/core/EventSystem';
import { ANIMATION_EVENTS } from '../../src/types/event-const';

// Mock a minimal spriteSheet with frame metadata
const mockTexture: any = { width: 64, height: 16, dispose: () => { } };
const spriteSheet = new SpriteSheet(mockTexture, 16, 16);
spriteSheet.addAnimation('walk', { name: 'walk', frames: [0, 1, 2, 3], duration: 0.1, loop: true, pingPong: false });

test('AnimationSystem advances frame with deltaTime', () => {
    const system = new AnimationSystem();
    system.registerSpriteSheet('mock', spriteSheet);

    const events: any[] = [];
    const es = EventSystem.getInstance();
    es.on(ANIMATION_EVENTS.FRAME, (e) => events.push({ type: 'frame', data: e.data }));
    es.on(ANIMATION_EVENTS.COMPLETE, (e) => events.push({ type: 'complete', data: e.data }));

    const entity = new Entity('e1');
    const anim: AnimationComponent = {
        type: 'animation',
        spriteSheet: 'mock',
        currentAnimation: 'walk',
        currentFrame: 0,
        frameTime: 0.1,
        elapsedTime: 0,
        loop: true,
        playing: true,
        // satisfy type which may require an animations map/cache
        animations: new Map()
    };

    entity.addComponent(anim);
    entity.addComponent({ type: 'sprite', texture: '', width: 16, height: 16, uvX: 0, uvY: 0, uvWidth: 1, uvHeight: 1, flipX: false, flipY: false });

    // initial update with small dt should not advance
    system.update([entity], 0.05);
    expect(anim.currentFrame).toBe(0);

    // enough dt to advance one frame
    system.update([entity], 0.1);
    expect(anim.currentFrame).toBe(1);

    // Advance to complete a non-looping animation
    // convert animation to non-looping and set to last frame - 1
    spriteSheet.addAnimation('once', { name: 'once', frames: [0, 1], duration: 0.1, loop: false, pingPong: false });
    anim.currentAnimation = 'once';
    anim.currentFrame = 0;
    anim.frameTime = 0.05;
    anim.elapsedTime = 0;
    anim.playing = true;

    // Advance twice: first to last frame, second to trigger completion
    system.update([entity], 0.05);
    system.update([entity], 0.05);

    // Should have emitted at least one FRAME and one COMPLETE
    const types = events.map((ev) => ev.type);
    expect(types).toContain('frame');
    expect(types).toContain('complete');
});
