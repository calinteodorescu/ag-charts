import { toRadians } from './angle';

export function getRotatedBoxDimensions(width: number, height: number, rotation: number) {
    const rotationRadians = toRadians(rotation);
    const cosRotation = Math.cos(rotationRadians);
    const sinRotation = Math.sin(rotationRadians);
    return {
        width: Math.abs(width * cosRotation) + Math.abs(height * sinRotation),
        height: Math.abs(width * sinRotation) + Math.abs(height * cosRotation),
    };
}

export function createIdsGenerator(): (name: string) => string {
    const idsCounter = new Map<string, number>();
    return (name: string) => {
        const counter = idsCounter.get(name);
        if (counter) {
            idsCounter.set(name, counter + 1);
            return `${name}_${counter}`;
        }
        idsCounter.set(name, 1);
        return name;
    };
}
