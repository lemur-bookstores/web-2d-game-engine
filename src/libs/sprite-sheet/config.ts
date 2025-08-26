// Configuration value objects for detection
export abstract class DetectionConfig {
    abstract readonly type: 'grid' | 'dynamic';
}

export class GridDetectionConfig extends DetectionConfig {
    readonly type = 'grid' as const;

    constructor(
        public readonly frameWidth: number,
        public readonly frameHeight: number,
        public readonly startX: number = 0,
        public readonly startY: number = 0,
        public readonly spacing: number = 0,
        public readonly margin: number = 0
    ) { super(); }
}

export class DynamicDetectionConfig extends DetectionConfig {
    readonly type = 'dynamic' as const;

    constructor(
        public readonly alphaThreshold: number = 1,
        public readonly minFrameSize: number = 1,
        public readonly padding: number = 0
    ) { super(); }
}
