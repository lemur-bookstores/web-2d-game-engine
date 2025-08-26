/// <reference types="vitest" />
import { test, expect, vi } from 'vitest';
import { EventSystem } from '../../src/core/EventSystem';
import { AnimationSystem } from '../../src/graphics/AnimationSystem';
import { SpriteSheet } from '../../src/graphics/SpriteSheet';
import { Entity } from '../../src/ecs/Entity';
import { AnimationComponent } from '../../src/graphics/Animation';
import { AudioManager } from '../../src/audio/AudioManager';
import { AudioSystem } from '../../src/audio/AudioSystem';

test('integration: AnimationSystem advances frames and AudioSystem plays mapped SFX', () => {
    // Ensure fresh EventSystem (clears previous listeners)
    EventSystem.reset();

    // Prepare sprite sheet and animation
    const mockTexture: any = { width: 64, height: 16, dispose: () => { } };
    const sheet = new SpriteSheet(mockTexture, 16, 16);
    sheet.addAnimation('explode', { name: 'explode', frames: [0, 1, 2, 3], duration: 0.1, loop: false, pingPong: false });

    // Systems
    const animSys = new AnimationSystem();
    animSys.registerSpriteSheet('mock', sheet);
    const audioSys = new AudioSystem();

    // Spy AudioManager.play
    const am = AudioManager.getInstance();
    const playSpy = vi.spyOn(am, 'play').mockImplementation((name: string) => ({ id: 'mock' } as any));

    // Entity with animation that maps local frame index 2 -> 'boom'
    const entity = new Entity('e1');
    const anim: AnimationComponent = {
        type: 'animation',
        spriteSheet: 'mock',
        currentAnimation: 'explode',
        currentFrame: 0,
        frameTime: 0.05,
        elapsedTime: 0,
        loop: false,
        playing: true,
        animations: new Map(),
        frameSfx: { 2: 'boom' }
    };

    entity.addComponent(anim);
    entity.addComponent({ type: 'sprite', texture: '', width: 16, height: 16, uvX: 0, uvY: 0, uvWidth: 1, uvHeight: 1, flipX: false, flipY: false });

    // Advance updates to reach frame index 2 (two updates with dt >= frameTime)
    animSys.update([entity], 0.05);
    animSys.update([entity], 0.05);

    // AudioSystem subscribes to FRAME events and should have triggered play('boom')
    expect(playSpy).toHaveBeenCalled();
    expect(playSpy).toHaveBeenCalledWith('boom', {});

    playSpy.mockRestore();
});
