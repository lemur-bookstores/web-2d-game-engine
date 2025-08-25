// Domain entities and request/response types
export class SpriteFrame {
    constructor(
        public readonly name: string,
        public readonly uvX: number,
        public readonly uvY: number,
        public readonly uvWidth: number,
        public readonly uvHeight: number
    ) { }
}

export class Rectangle {
    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly width: number,
        public readonly height: number
    ) { }
}

export class ImageSize {
    constructor(
        public readonly width: number,
        public readonly height: number
    ) { }
}

export class UVCoordinate {
    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly width: number,
        public readonly height: number
    ) { }
}

export class ProcessSpriteSheetRequest {
    constructor(
        public readonly imageSource: any,
        public readonly detectionConfig: any,
        public readonly namingPattern: string = 'frame_{index}'
    ) { }
}

export class ProcessSpriteSheetResponse {
    constructor(
        public readonly frames: SpriteFrame[]
    ) { }
}
