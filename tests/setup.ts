import { vi, beforeEach, afterEach } from 'vitest';
import { EventSystem } from '../src/core/EventSystem';

// Reset EventSystem singleton before each test
beforeEach(() => {
  // Reset EventSystem singleton
  (EventSystem as any).instance = undefined;
});

afterEach(() => {
  // Clean up EventSystem singleton
  (EventSystem as any).instance = undefined;
});

// Mock getBoundingClientRect for canvas
Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
  })),
});

// Mock addEventListener and removeEventListener for canvas
const eventListeners = new Map<HTMLCanvasElement, Map<string, Function[]>>();
const documentEventListeners = new Map<string, Function[]>();

const addEventListenerMock = vi.fn(function (this: HTMLCanvasElement, type: string, listener: Function) {
  if (!eventListeners.has(this)) {
    eventListeners.set(this, new Map());
  }
  const elementListeners = eventListeners.get(this)!;
  if (!elementListeners.has(type)) {
    elementListeners.set(type, []);
  }
  elementListeners.get(type)!.push(listener);
});

const removeEventListenerMock = vi.fn(function (this: HTMLCanvasElement, type: string, listener: Function) {
  const elementListeners = eventListeners.get(this);
  if (elementListeners && elementListeners.has(type)) {
    const listeners = elementListeners.get(type)!;
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
});

const dispatchEventMock = vi.fn(function (this: HTMLCanvasElement, event: Event) {
  const elementListeners = eventListeners.get(this);
  if (elementListeners && elementListeners.has(event.type)) {
    const listeners = elementListeners.get(event.type)!;
    listeners.forEach(listener => {
      try {
        listener.call(this, event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
  return true;
});

// Mock document event listeners
const documentAddEventListenerMock = vi.fn((type: string, listener: Function) => {
  if (!documentEventListeners.has(type)) {
    documentEventListeners.set(type, []);
  }
  documentEventListeners.get(type)!.push(listener);
});

const documentRemoveEventListenerMock = vi.fn((type: string, listener: Function) => {
  if (documentEventListeners.has(type)) {
    const listeners = documentEventListeners.get(type)!;
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
});

const documentDispatchEventMock = vi.fn((event: Event) => {
  if (documentEventListeners.has(event.type)) {
    const listeners = documentEventListeners.get(event.type)!;
    listeners.forEach(listener => {
      try {
        listener.call(document, event);
      } catch (error) {
        console.error('Error in document event listener:', error);
      }
    });
  }
  return true;
});

Object.defineProperty(HTMLCanvasElement.prototype, 'addEventListener', {
  value: addEventListenerMock,
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'removeEventListener', {
  value: removeEventListenerMock,
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'dispatchEvent', {
  value: dispatchEventMock,
  writable: true,
});

// Mock document event listeners
Object.defineProperty(document, 'addEventListener', {
  value: documentAddEventListenerMock,
  writable: true,
});

Object.defineProperty(document, 'removeEventListener', {
  value: documentRemoveEventListenerMock,
  writable: true,
});

Object.defineProperty(document, 'dispatchEvent', {
  value: documentDispatchEventMock,
  writable: true,
});

// Mock WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn((contextType: string) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        clearColor: vi.fn(),
        clear: vi.fn(),
        viewport: vi.fn(),
        createShader: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        createProgram: vi.fn(),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        useProgram: vi.fn(),
        getAttribLocation: vi.fn(),
        getUniformLocation: vi.fn(),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        uniform1f: vi.fn(),
        uniform2f: vi.fn(),
        uniform3f: vi.fn(),
        uniform4f: vi.fn(),
        uniformMatrix4fv: vi.fn(),
        createBuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        drawArrays: vi.fn(),
        drawElements: vi.fn(),
        VERTEX_SHADER: 35633,
        FRAGMENT_SHADER: 35632,
        ARRAY_BUFFER: 34962,
        ELEMENT_ARRAY_BUFFER: 34963,
        STATIC_DRAW: 35044,
        COLOR_BUFFER_BIT: 16384,
        DEPTH_BUFFER_BIT: 256,
        TRIANGLES: 4,
      };
    }
    if (contextType === '2d') {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        rect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        canvas: {
          width: 800,
          height: 600,
        },
      };
    }
    return null;
  }),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  const id = setTimeout(() => callback(Date.now()), 16);
  return Number(id);
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock performance.now
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Mock Image constructor
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  width = 0;
  height = 0;

  constructor() {
    setTimeout(() => {
      this.width = 100;
      this.height = 100;
      if (this.onload) this.onload();
    }, 0);
  }
} as any;

// Mock Audio constructor
global.Audio = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  volume = 1;
  currentTime = 0;
  duration = 0;
  paused = true;

  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  load = vi.fn();
} as any;

// Mock TouchEvent constructor
global.TouchEvent = class extends Event {
  touches: TouchList;
  targetTouches: TouchList;
  changedTouches: TouchList;

  constructor(type: string, eventInitDict?: TouchEventInit) {
    super(type, eventInitDict);
    this.touches = (eventInitDict?.touches || []) as any;
    this.targetTouches = (eventInitDict?.targetTouches || []) as any;
    this.changedTouches = (eventInitDict?.changedTouches || []) as any;
  }
} as any;

// Mock KeyboardEvent constructor
const MockKeyboardEvent = class extends Event {
  code: string;
  key: string;
  keyCode: number;
  which: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  location: number;

  constructor(type: string, eventInitDict?: KeyboardEventInit) {
    super(type, eventInitDict);
    this.code = eventInitDict?.code || '';
    this.key = eventInitDict?.key || '';
    this.keyCode = eventInitDict?.keyCode || 0;
    this.which = eventInitDict?.which || 0;
    this.altKey = eventInitDict?.altKey || false;
    this.ctrlKey = eventInitDict?.ctrlKey || false;
    this.shiftKey = eventInitDict?.shiftKey || false;
    this.metaKey = eventInitDict?.metaKey || false;
    this.repeat = eventInitDict?.repeat || false;
    this.location = eventInitDict?.location || 0;
  }
} as any;

// Mock MouseEvent constructor
const MockMouseEvent = class extends Event {
  button: number;
  buttons: number;
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  movementX: number;
  movementY: number;
  relatedTarget: EventTarget | null;

  constructor(type: string, eventInitDict?: MouseEventInit) {
    super(type, eventInitDict);
    this.button = eventInitDict?.button || 0;
    this.buttons = eventInitDict?.buttons || 0;
    this.clientX = eventInitDict?.clientX || 0;
    this.clientY = eventInitDict?.clientY || 0;
    this.offsetX = (eventInitDict as any)?.offsetX || this.clientX;
    this.offsetY = (eventInitDict as any)?.offsetY || this.clientY;
    this.pageX = (eventInitDict as any)?.pageX || this.clientX;
    this.pageY = (eventInitDict as any)?.pageY || this.clientY;
    this.screenX = eventInitDict?.screenX || 0;
    this.screenY = eventInitDict?.screenY || 0;
    this.altKey = eventInitDict?.altKey || false;
    this.ctrlKey = eventInitDict?.ctrlKey || false;
    this.shiftKey = eventInitDict?.shiftKey || false;
    this.metaKey = eventInitDict?.metaKey || false;
    this.movementX = eventInitDict?.movementX || 0;
    this.movementY = eventInitDict?.movementY || 0;
    this.relatedTarget = eventInitDict?.relatedTarget || null;
  }
} as any;

// Mock WheelEvent constructor
const MockWheelEvent = class extends MockMouseEvent {
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  deltaMode: number;

  constructor(type: string, eventInitDict?: WheelEventInit) {
    super(type, eventInitDict);
    this.deltaX = eventInitDict?.deltaX || 0;
    this.deltaY = eventInitDict?.deltaY || 0;
    this.deltaZ = eventInitDict?.deltaZ || 0;
    this.deltaMode = eventInitDict?.deltaMode || 0;
  }
} as any;

// Assign to both global and globalThis
global.KeyboardEvent = MockKeyboardEvent;
global.MouseEvent = MockMouseEvent;
global.WheelEvent = MockWheelEvent;
globalThis.KeyboardEvent = MockKeyboardEvent;
globalThis.MouseEvent = MockMouseEvent;
globalThis.WheelEvent = MockWheelEvent;

// Force window assignment if exists
if (typeof window !== 'undefined') {
  (window as any).KeyboardEvent = MockKeyboardEvent;
  (window as any).MouseEvent = MockMouseEvent;
  (window as any).WheelEvent = MockWheelEvent;
}

// Mock Touch interface
class MockTouch {
  identifier: number;
  target: EventTarget;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  radiusX: number;
  radiusY: number;
  rotationAngle: number;
  force: number;

  constructor(init: TouchInit) {
    this.identifier = init.identifier;
    this.target = init.target;
    this.clientX = init.clientX || 0;
    this.clientY = init.clientY || 0;
    this.pageX = init.pageX || 0;
    this.pageY = init.pageY || 0;
    this.screenX = init.screenX || 0;
    this.screenY = init.screenY || 0;
    this.radiusX = init.radiusX || 0;
    this.radiusY = init.radiusY || 0;
    this.rotationAngle = init.rotationAngle || 0;
    this.force = init.force || 0;
  }
}

global.Touch = MockTouch as any;

// Mock GamepadEvent constructor
global.GamepadEvent = class extends Event {
  gamepad: Gamepad;

  constructor(type: string, eventInitDict?: GamepadEventInit) {
    super(type, eventInitDict);
    this.gamepad = eventInitDict?.gamepad || {} as Gamepad;
  }
} as any;

// Mock navigator.getGamepads
Object.defineProperty(global.navigator, 'getGamepads', {
  value: vi.fn(() => []),
  writable: true,
});

// Reset EventSystem singleton before each test
beforeEach(() => {
  EventSystem.reset();
  // Clear event listeners map for canvas mocks
  eventListeners.clear();
});