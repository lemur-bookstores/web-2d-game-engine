/// <reference types="vitest" />
import { test, expect, vi } from 'vitest';
import { EventSystem } from '../../src/core/EventSystem';
import { ANIMATION_EVENTS } from '../../src/types/event-const';
import { AudioManager } from '../../src/audio/AudioManager';
import { AudioSystem } from '../../src/audio/AudioSystem';
import { Entity } from '../../src/ecs/Entity';

test('AudioSystem plays audio on animation FRAME when configured', () => {
    // Reset and get event system
    EventSystem.reset();
    const es = EventSystem.getInstance();

    // Spy on AudioManager.play
    const am = AudioManager.getInstance();
    const playSpy = vi.spyOn(am, 'play').mockImplementation((_name: string) => ({ id: 'mock' } as any));

    const audioSystem = new AudioSystem();
    if (audioSystem) { }

    const entity = new Entity('e1');
    entity.addComponent({ type: 'audio', clip: 'sfx_ping', autoplayOnFrame: true, triggerFrame: 2 });

    // Also add an animation component that maps frame 3 to 'sfx_frame3'
    entity.addComponent({ type: 'animation', spriteSheet: 'mock', currentAnimation: 'a', currentFrame: 0, frameTime: 0.1, elapsedTime: 0, loop: true, playing: true, animations: new Map(), frameSfx: { 3: 'sfx_frame3' } });

    // Emit FRAME with a different frame -> should not trigger
    es.emit(ANIMATION_EVENTS.FRAME, { entity, animationName: 'foo', frameIndex: 1 });
    // In tests, EventSystem processes immediately
    expect(playSpy).not.toHaveBeenCalled();

    // Emit FRAME with matching triggerFrame -> should trigger play (audio component)
    es.emit(ANIMATION_EVENTS.FRAME, { entity, animationName: 'foo', frameIndex: 2 });
    expect(playSpy).toHaveBeenCalledWith('sfx_ping', { loop: false, volume: undefined, group: undefined });

    // Clear spy calls and emit frame 3 -> should trigger frameSfx mapping
    playSpy.mockClear();
    es.emit(ANIMATION_EVENTS.FRAME, { entity, animationName: 'foo', frameIndex: 3 });
    expect(playSpy).toHaveBeenCalledWith('sfx_frame3', {});

    playSpy.mockRestore();
});
