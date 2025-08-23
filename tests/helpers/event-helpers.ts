import { vi } from 'vitest';

interface ExtendedEventInit extends EventInit {
    target?: EventTarget;
    currentTarget?: EventTarget;
}

interface ExtendedKeyboardEventInit extends KeyboardEventInit, ExtendedEventInit { }
interface ExtendedMouseEventInit extends MouseEventInit, ExtendedEventInit { }
interface ExtendedWheelEventInit extends WheelEventInit, ExtendedEventInit { }

const eventProto = {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    composedPath: () => [],
    initEvent: (type: string) => { }
};

export function createKeyboardEvent(type: string, options: ExtendedKeyboardEventInit = {}): KeyboardEvent {
    const event = Object.create(eventProto);
    Object.assign(event, {
        bubbles: true,
        cancelable: true,
        composed: true,
        target: options.target || document,
        currentTarget: options.currentTarget || options.target || document,
        type,
        code: options.code || '',
        key: options.key || options.code || '',
        keyCode: options.keyCode || 0,
        which: options.which || 0,
        altKey: options.altKey || false,
        ctrlKey: options.ctrlKey || false,
        shiftKey: options.shiftKey || false,
        metaKey: options.metaKey || false,
        repeat: options.repeat || false,
        location: options.location || 0,
    });
    return event as unknown as KeyboardEvent;
}

export function createMouseEvent(type: string, options: ExtendedMouseEventInit = {}): MouseEvent {
    const event = Object.create(eventProto);
    Object.assign(event, {
        bubbles: true,
        cancelable: true,
        composed: true,
        target: options.target || document,
        currentTarget: options.currentTarget || options.target || document,
        type,
        button: options.button || 0,
        buttons: options.buttons || 0,
        clientX: options.clientX || 0,
        clientY: options.clientY || 0,
        screenX: options.screenX || 0,
        screenY: options.screenY || 0,
        offsetX: options.clientX || 0,
        offsetY: options.clientY || 0,
        pageX: options.clientX || 0,
        pageY: options.clientY || 0,
        altKey: options.altKey || false,
        ctrlKey: options.ctrlKey || false,
        shiftKey: options.shiftKey || false,
        metaKey: options.metaKey || false,
        relatedTarget: options.relatedTarget || null,
    });
    return event as unknown as MouseEvent;
}

export function createWheelEvent(type: string, options: ExtendedWheelEventInit = {}): WheelEvent {
    const mouseEvent = createMouseEvent(type, options);
    const event = Object.create(eventProto);
    Object.assign(event, mouseEvent, {
        deltaX: options.deltaX || 0,
        deltaY: options.deltaY || 0,
        deltaZ: options.deltaZ || 0,
        deltaMode: options.deltaMode || 0,
    });
    return event as unknown as WheelEvent;
}

export function createTouch(options: any): Touch {
    return {
        identifier: options.identifier || 0,
        target: options.target,
        clientX: options.clientX || 0,
        clientY: options.clientY || 0,
        pageX: options.pageX || options.clientX || 0,
        pageY: options.pageY || options.clientY || 0,
        screenX: options.screenX || options.clientX || 0,
        screenY: options.screenY || options.clientY || 0,
        radiusX: options.radiusX || 1,
        radiusY: options.radiusY || 1,
        rotationAngle: options.rotationAngle || 0,
        force: options.force || 1,
    };
}

interface ExtendedTouchEventInit {
    target?: EventTarget;
    touches?: Touch[];
    targetTouches?: Touch[];
    changedTouches?: Touch[];
}

export function createTouchEvent(type: string, touches: Touch[] = []): TouchEvent {
    const event = Object.create(eventProto);
    Object.assign(event, {
        bubbles: true,
        cancelable: true,
        composed: true,
        target: touches[0]?.target || document,
        currentTarget: touches[0]?.target || document,
        type,
        touches,
        targetTouches: touches,
        changedTouches: touches,
    });
    return event as unknown as TouchEvent;
}
