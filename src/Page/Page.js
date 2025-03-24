define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Page = void 0;
    /**
     * Class representing a book page
     */
    var Page = /** @class */ (function () {
        function Page(render, density) {
            this.state = {
                angle: 0,
                area: [],
                position: { x: 0, y: 0 },
                hardAngle: 0,
                hardDrawingAngle: 0,
            };
            this.createdDensity = density;
            this.nowDrawingDensity = this.createdDensity;
            this.render = render;
        }
        /**
         * Set a constant page density
         *
         * @param {PageDensity} density
         */
        Page.prototype.setDensity = function (density) {
            this.createdDensity = density;
            this.nowDrawingDensity = density;
        };
        /**
         * Set temp page density to next render
         *
         * @param {PageDensity}  density
         */
        Page.prototype.setDrawingDensity = function (density) {
            this.nowDrawingDensity = density;
        };
        /**
         * Set page position
         *
         * @param {Point} pagePos
         */
        Page.prototype.setPosition = function (pagePos) {
            this.state.position = pagePos;
        };
        /**
         * Set page angle
         *
         * @param {number} angle
         */
        Page.prototype.setAngle = function (angle) {
            this.state.angle = angle;
        };
        /**
         * Set page crop area
         *
         * @param {Point[]} area
         */
        Page.prototype.setArea = function (area) {
            this.state.area = area;
        };
        /**
         * Rotate angle for hard pages to next render
         *
         * @param {number} angle
         */
        Page.prototype.setHardDrawingAngle = function (angle) {
            this.state.hardDrawingAngle = angle;
        };
        /**
         * Rotate angle for hard pages
         *
         * @param {number} angle
         */
        Page.prototype.setHardAngle = function (angle) {
            this.state.hardAngle = angle;
            this.state.hardDrawingAngle = angle;
        };
        /**
         * Set page orientation
         *
         * @param {PageOrientation} orientation
         */
        Page.prototype.setOrientation = function (orientation) {
            this.orientation = orientation;
        };
        /**
         * Get temp page density
         */
        Page.prototype.getDrawingDensity = function () {
            return this.nowDrawingDensity;
        };
        /**
         * Get a constant page density
         */
        Page.prototype.getDensity = function () {
            return this.createdDensity;
        };
        /**
         * Get rotate angle for hard pages
         */
        Page.prototype.getHardAngle = function () {
            return this.state.hardAngle;
        };
        return Page;
    }());
    exports.Page = Page;
});
//# sourceMappingURL=Page.js.map