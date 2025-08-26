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

test('StateMachine transitions on EventSystem emit', () => {
    const system = new AnimationStateMachineSystem();

    const def = {
        states: [
            { name: 'idle', animation: 'idle' },
            { name: 'hurt', animation: 'hurt' }
        ],
        transitions: [
            { from: '*', to: 'hurt', trigger: 'PLAYER_HURT', priority: 5 }
        ],
        initial: 'idle'
    };

    registerStateMachine('player3', def as any);

    const entity = new Entity('p3');
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
        defKey: 'player3',
        currentState: 'idle',
        elapsed: 0
    };

    entity.addComponent(animComp);
    entity.addComponent(machine);

    // Run update once to ensure listeners are registered
    system.update([entity], 0.016);

    // emit event
    const es = EventSystem.getInstance();
    es.emit('PLAYER_HURT' as any, { entity });

    // Because test env processes events immediately, the machine should have transitioned
    expect(machine.currentState).toBe('hurt');
    expect(animComp.currentAnimation).toBe('hurt');
});

test('StateMachine picks highest priority on multiple matching triggers', () => {
    const system = new AnimationStateMachineSystem();

    const def = {
        states: [
            { name: 'idle', animation: 'idle' },
            { name: 'special', animation: 'special' },
            { name: 'normal', animation: 'normal' }
        ],
        transitions: [
            { from: '*', to: 'normal', trigger: 'PLAYER_SKILL', priority: 1 },
            { from: '*', to: 'special', trigger: 'PLAYER_SKILL', priority: 10 }
        ],
        initial: 'idle'
    };

    registerStateMachine('player4', def as any);

    const entity = new Entity('p4');
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
        defKey: 'player4',
        currentState: 'idle',
        elapsed: 0
    };

    entity.addComponent(animComp);
    entity.addComponent(machine);

    system.update([entity], 0.016);

    EventSystem.getInstance().emit('PLAYER_SKILL' as any, { entity });

    expect(machine.currentState).toBe('special');
    expect(animComp.currentAnimation).toBe('special');
});

test('StateMachine emits onExit and onEnter events', () => {
    const system = new AnimationStateMachineSystem();
    const es = EventSystem.getInstance();

    const events: string[] = [];
    es.on('TEST_EXIT' as any, () => events.push('exit'));
    es.on('TEST_ENTER' as any, () => events.push('enter'));

    const def = {
        states: [
            { name: 'idle', animation: 'idle', onExit: { events: ['TEST_EXIT'] } },
            { name: 'attack', animation: 'attack', onEnter: { events: ['TEST_ENTER'] } }
        ],
        transitions: [
            { from: 'idle', to: 'attack', trigger: 'DO_ATTACK' }
        ],
        initial: 'idle'
    };

    registerStateMachine('player5', def as any);

    const entity = new Entity('p5');
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
        defKey: 'player5',
        currentState: 'idle',
        elapsed: 0
    };

    entity.addComponent(animComp);
    entity.addComponent(machine);

    system.update([entity], 0.016);
    es.emit('DO_ATTACK' as any, { entity });

    expect(events).toContain('exit');
    expect(events).toContain('enter');
});
