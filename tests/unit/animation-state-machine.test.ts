import { expect, test, beforeEach } from 'vitest';
import { AnimationStateMachineSystem, registerStateMachine } from '../../src/graphics/AnimationStateMachine';
import { Entity } from '../../src/ecs/Entity';
import { AnimationComponent } from '../../src/graphics/Animation';
import { AnimationStateMachineComponent } from '../../src/types/anim-state';
import { EventSystem } from '../../src/core/EventSystem';

beforeEach(() => {
    EventSystem.reset();
});

test('StateMachine transitions by condition', () => {
    const system = new AnimationStateMachineSystem();

    const def = {
        states: [
            { name: 'idle', animation: 'idle' },
            { name: 'move', animation: 'walk' }
        ],
        transitions: [
            { from: 'idle', to: 'move', condition: (e: any) => !!e.getComponent('input')?.moving }
        ],
        initial: 'idle'
    };

    registerStateMachine('player', def as any);

    const entity = new Entity('p1');
    const animComp: AnimationComponent = {
        type: 'animation',
        spriteSheet: 'mock',
        currentAnimation: 'idle',
        currentFrame: 0,
        frameTime: 0.1,
        elapsedTime: 0,
        loop: true,
        playing: true,
        animations: new Map()
    };

    const machine: AnimationStateMachineComponent = {
        type: 'anim-machine',
        defKey: 'player',
        currentState: 'idle',
        elapsed: 0
    };

    entity.addComponent(animComp);
    entity.addComponent(machine);

    // No input -> no transition
    system.update([entity], 0.016);
    expect(machine.currentState).toBe('idle');

    // simulate input moving
    entity.addComponent({ type: 'input', moving: true });
    system.update([entity], 0.016);
    expect(machine.currentState).toBe('move');
    expect(animComp.currentAnimation).toBe('walk');
});

test('StateMachine trigger transition', () => {
    const system = new AnimationStateMachineSystem();
    const es = EventSystem.getInstance();

    const def = {
        states: [
            { name: 'idle', animation: 'idle' },
            { name: 'attack', animation: 'attack' }
        ],
        transitions: [
            { from: '*', to: 'attack', trigger: 'PLAYER_ATTACK', priority: 10 }
        ],
        initial: 'idle'
    };

    registerStateMachine('player2', def as any);

    const entity = new Entity('p2');
    const animComp: AnimationComponent = {
        type: 'animation',
        spriteSheet: 'mock',
        currentAnimation: 'idle',
        currentFrame: 0,
        frameTime: 0.1,
        elapsedTime: 0,
        loop: true,
        playing: true,
        animations: new Map()
    };

    const machine: AnimationStateMachineComponent = {
        type: 'anim-machine',
        defKey: 'player2',
        currentState: 'idle',
        elapsed: 0
    };

    entity.addComponent(animComp);
    entity.addComponent(machine);

    // emit trigger
    system.trigger(entity, 'PLAYER_ATTACK');

    expect(machine.currentState).toBe('attack');
    expect(animComp.currentAnimation).toBe('attack');
});
