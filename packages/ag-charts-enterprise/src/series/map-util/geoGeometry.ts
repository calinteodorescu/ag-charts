import { _Scene } from 'ag-charts-community';

import { lineStringDistance } from './lineStringUtil';
import { polygonContains } from './polygonUtil';

// import type { Geometry, Position } from 'geojson';
type Position = any;
type Geometry = any;

const { Path, Path2D, BBox, ScenePathChangeDetection } = _Scene;

export enum GeoGeometryRenderMode {
    All = 0b11,
    Polygons = 0b01,
    Lines = 0b10,
}

export class GeoGeometry extends Path {
    @ScenePathChangeDetection()
    projectedGeometry: Geometry | undefined = undefined;

    @ScenePathChangeDetection()
    renderMode: GeoGeometryRenderMode = GeoGeometryRenderMode.All;

    private bbox: _Scene.BBox | undefined;
    // Keep non-filled shapes separate so we don't fill them
    private strokePath = new Path2D();

    override computeBBox(): _Scene.BBox | undefined {
        if (this.dirtyPath || this.isDirtyPath()) {
            this.updatePath();
            this.dirtyPath = false;
        }

        return this.bbox?.clone();
    }

    override updatePath(): void {
        const { projectedGeometry } = this;

        this.strokePath.clear();
        this.path.clear();

        this.bbox = projectedGeometry != null ? this.drawGeometry(projectedGeometry, undefined) : undefined;
    }

    override drawPath(ctx: any) {
        super.drawPath(ctx);

        this.strokePath.draw(ctx);
        this.renderStroke(ctx);
    }

    override containsPoint(x: number, y: number): boolean {
        const { projectedGeometry } = this;
        if (projectedGeometry == null) return false;

        ({ x, y } = this.transformPoint(x, y));
        if (!this.getCachedBBox().containsPoint(x, y)) return false;

        return this.geometryContainsPoint(projectedGeometry, x, y);
    }

    private geometryContainsPoint(geometry: Geometry, x: number, y: number): boolean {
        const { renderMode, strokeWidth } = this;
        const drawPolygons = (renderMode & GeoGeometryRenderMode.Polygons) !== 0;
        const drawLines = (renderMode & GeoGeometryRenderMode.Lines) !== 0;
        const minStrokeDistance = Math.max(strokeWidth / 2, 1) + 1;

        switch (geometry.type) {
            case 'GeometryCollection':
                return geometry.geometries.some((g: Geometry) => this.geometryContainsPoint(g, x, y));
            case 'MultiPolygon':
                return (
                    drawPolygons &&
                    geometry.coordinates.some((coordinates: Position[][]) => polygonContains(coordinates, x, y))
                );
            case 'Polygon':
                return drawPolygons && polygonContains(geometry.coordinates, x, y);
            case 'MultiLineString':
                return (
                    drawLines &&
                    geometry.coordinates.some((lineString: Position[]) => {
                        return lineStringDistance(lineString, x, y) < minStrokeDistance;
                    })
                );
            case 'LineString':
                return drawLines && lineStringDistance(geometry.coordinates, x, y) < minStrokeDistance;
            case 'MultiPoint':
            case 'Point':
            default:
                return false;
        }
    }

    private drawGeometry(geometry: Geometry, bbox: _Scene.BBox | undefined): _Scene.BBox | undefined {
        const { renderMode, path, strokePath } = this;
        const drawPolygons = (renderMode & GeoGeometryRenderMode.Polygons) !== 0;
        const drawLines = (renderMode & GeoGeometryRenderMode.Lines) !== 0;

        switch (geometry.type) {
            case 'GeometryCollection':
                geometry.geometries.forEach((g: Geometry) => {
                    bbox = this.drawGeometry(g, bbox);
                });
                break;
            case 'MultiPolygon':
                if (drawPolygons) {
                    geometry.coordinates.forEach((coordinates: Position[][]) => {
                        bbox = this.drawPolygon(path, coordinates, bbox);
                    });
                }
                break;
            case 'Polygon':
                if (drawPolygons) {
                    bbox = this.drawPolygon(path, geometry.coordinates, bbox);
                }
                break;
            case 'LineString':
                if (drawLines) {
                    bbox = this.drawLineString(strokePath, geometry.coordinates, bbox, false);
                }
                break;
            case 'MultiLineString':
                if (drawLines) {
                    geometry.coordinates.forEach((coordinates: Position[]) => {
                        bbox = this.drawLineString(strokePath, coordinates, bbox, false);
                    });
                }
                break;
            case 'Point':
            case 'MultiPoint':
                break;
        }

        return bbox;
    }

    private drawPolygon(
        path: _Scene.Path2D,
        polygons: Position[][],
        bbox: _Scene.BBox | undefined
    ): _Scene.BBox | undefined {
        if (polygons.length < 1) return bbox;

        bbox = this.drawLineString(path, polygons[0], bbox, true);
        for (let i = 1; i < polygons.length; i += 1) {
            // Don't extend bbox for enclaves
            const enclave = polygons[i];
            this.drawLineString(path, enclave, undefined, true);
        }
        return bbox;
    }

    private drawLineString(
        path: _Scene.Path2D,
        coordinates: Position[],
        bbox: _Scene.BBox | undefined,
        isClosed: boolean
    ): _Scene.BBox | undefined {
        if (coordinates.length < 2) return bbox;

        // For polygons (i.e. closed), the start and end coordinates are the same
        // Use closePath instead so the path draws its miters correctly
        const end = isClosed ? coordinates.length - 1 : coordinates.length;

        for (let i = 0; i < end; i += 1) {
            const [x, y] = coordinates[i];

            if (i === 0) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }

            if (bbox == null) {
                bbox = new BBox(x, y, 0, 0);
            } else {
                const { x: x0, y: y0 } = bbox;
                const x1 = x0 + bbox.width;
                const y1 = y0 + bbox.height;

                bbox.x = Math.min(x0, x);
                bbox.y = Math.min(y0, y);
                bbox.width = Math.max(x1, x) - bbox.x;
                bbox.height = Math.max(y1, y) - bbox.y;
            }
        }

        if (isClosed) {
            path.closePath();
        }

        return bbox;
    }
}
