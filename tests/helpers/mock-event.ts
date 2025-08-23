export class MockEvent implements Event {
    bubbles: boolean;
    cancelBubble: boolean;
    cancelable: boolean;
    composed: boolean;
    currentTarget: EventTarget | null;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    returnValue: boolean;
    srcElement: EventTarget | null;
    target: EventTarget | null;
    timeStamp: number;
    type: string;

    static readonly NONE = 0;
    static readonly CAPTURING_PHASE = 1;
    static readonly AT_TARGET = 2;
    static readonly BUBBLING_PHASE = 3;

    constructor(type: string, options: EventInit = {}) {
        this.type = type;
        this.bubbles = options.bubbles ?? true;
        this.cancelable = options.cancelable ?? true;
        this.composed = options.composed ?? true;
        this.currentTarget = null;
        this.defaultPrevented = false;
        this.eventPhase = MockEvent.NONE;
        this.isTrusted = false;
        this.returnValue = true;
        this.srcElement = null;
        this.target = null;
        this.timeStamp = Date.now();
        this.cancelBubble = false;
    }

    preventDefault() {
        if (this.cancelable) {
            this.defaultPrevented = true;
        }
    }

    stopPropagation() {
        this.cancelBubble = true;
    }

    stopImmediatePropagation() {
        this.cancelBubble = true;
    }

    composedPath(): EventTarget[] {
        return [];
    }

    initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void {
        this.type = type;
        if (bubbles !== undefined) this.bubbles = bubbles;
        if (cancelable !== undefined) this.cancelable = cancelable;
    }

    readonly NONE: 0 = MockEvent.NONE;
    readonly CAPTURING_PHASE: 1 = MockEvent.CAPTURING_PHASE;
    readonly AT_TARGET: 2 = MockEvent.AT_TARGET;
    readonly BUBBLING_PHASE: 3 = MockEvent.BUBBLING_PHASE;
}

export function createEvent(type: string, options: EventInit = {}) {
    return new MockEvent(type, options);
}
