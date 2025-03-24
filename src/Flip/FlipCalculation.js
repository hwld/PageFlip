define(["require", "exports", "../Helper"], function (require, exports, Helper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FlipCalculation = void 0;
    /**
     * Class representing mathematical methods for calculating page position (rotation angle, clip area ...)
     */
    var FlipCalculation = /** @class */ (function () {
        /**
         * @constructor
         *
         * @param {FlipDirection} direction - Flipping direction
         * @param {FlipCorner} corner - Flipping corner
         * @param pageWidth - Current page width
         * @param pageHeight - Current page height
         */
        function FlipCalculation(direction, corner, pageWidth, pageHeight) {
            this.direction = direction;
            this.corner = corner;
            /** The point of intersection of the page with the borders of the book */
            this.topIntersectPoint = null; // With top border
            this.sideIntersectPoint = null; // With side border
            this.bottomIntersectPoint = null; // With bottom border
            this.pageWidth = parseInt(pageWidth, 10);
            this.pageHeight = parseInt(pageHeight, 10);
        }
        /**
         * The main calculation method
         *
         * @param {Point} localPos - Touch Point Coordinates (relative active page!)
         *
         * @returns {boolean} True - if the calculations were successful, false if errors occurred
         */
        FlipCalculation.prototype.calc = function (localPos) {
            try {
                // Find: page rotation angle and active corner position
                this.position = this.calcAngleAndPosition(localPos);
                // Find the intersection points of the scrolling page and the book
                this.calculateIntersectPoint(this.position);
                return true;
            }
            catch (e) {
                return false;
            }
        };
        /**
         * Get the crop area for the page that will be duplicated and flipped.
         *
         * @returns {Point[]} Polygon page
         */
        FlipCalculation.prototype.getCurrentClipArea = function () {
            var result = [];
            var startPoint = this.topIntersectPoint !== null ? this.topIntersectPoint : { x: this.pageWidth, y: 0 };
            result.push(startPoint);
            result.push({ x: 0, y: 0 });
            result.push({ x: 0, y: this.pageHeight });
            result.push(this.bottomIntersectPoint
                ? this.bottomIntersectPoint
                : { x: this.pageWidth, y: this.pageHeight });
            if (this.sideIntersectPoint) {
                result.push(this.sideIntersectPoint);
            }
            result.push(startPoint);
            return result;
        };
        /**
         * Get the crop area for the flipping page
         *
         * @returns {Point[]} Polygon page
         */
        FlipCalculation.prototype.getFlippingClipArea = function () {
            var result = [];
            var clipBottom = false;
            result.push(this.rect.topLeft);
            result.push(this.topIntersectPoint);
            if (this.sideIntersectPoint === null) {
                clipBottom = true;
            }
            else {
                result.push(this.sideIntersectPoint);
                if (this.bottomIntersectPoint === null)
                    clipBottom = false;
            }
            result.push(this.bottomIntersectPoint);
            if (clipBottom || this.corner === "bottom" /* FlipCorner.BOTTOM */) {
                result.push(this.rect.bottomLeft);
            }
            return result;
        };
        /**
         * Get the crop area for the page that is below the page to be flipped
         *
         * @returns {Point[]} Polygon page
         */
        FlipCalculation.prototype.getBottomClipArea = function () {
            var result = [];
            result.push(this.topIntersectPoint);
            if (this.corner === "top" /* FlipCorner.TOP */) {
                result.push({ x: this.pageWidth, y: 0 });
            }
            else {
                if (this.topIntersectPoint !== null) {
                    result.push({ x: this.pageWidth, y: 0 });
                }
                result.push({ x: this.pageWidth, y: this.pageHeight });
            }
            if (this.sideIntersectPoint !== null) {
                if (Helper_1.Helper.GetDistanceBetweenTwoPoint(this.sideIntersectPoint, this.topIntersectPoint) >= 10)
                    result.push(this.sideIntersectPoint);
            }
            else {
                if (this.corner === "top" /* FlipCorner.TOP */) {
                    result.push({ x: this.pageWidth, y: this.pageHeight });
                }
            }
            result.push(this.bottomIntersectPoint);
            result.push(this.topIntersectPoint);
            return result;
        };
        /**
         * Get page rotation angle
         */
        FlipCalculation.prototype.getAngle = function () {
            if (this.direction === 0 /* FlipDirection.FORWARD */) {
                return -this.angle;
            }
            return this.angle;
        };
        /**
         * Get page area while flipping
         */
        FlipCalculation.prototype.getRect = function () {
            return this.rect;
        };
        /**
         * Get the position of the active angle when turning
         */
        FlipCalculation.prototype.getPosition = function () {
            return this.position;
        };
        /**
         * Get the active corner of the page (which pull)
         */
        FlipCalculation.prototype.getActiveCorner = function () {
            if (this.direction === 0 /* FlipDirection.FORWARD */) {
                return this.rect.topLeft;
            }
            return this.rect.topRight;
        };
        /**
         * Get flipping direction
         */
        FlipCalculation.prototype.getDirection = function () {
            return this.direction;
        };
        /**
         * Get flipping progress (0-100)
         */
        FlipCalculation.prototype.getFlippingProgress = function () {
            return Math.abs(((this.position.x - this.pageWidth) / (2 * this.pageWidth)) * 100);
        };
        /**
         * Get flipping corner position (top, bottom)
         */
        FlipCalculation.prototype.getCorner = function () {
            return this.corner;
        };
        /**
         * Get start position for the page that is below the page to be flipped
         */
        FlipCalculation.prototype.getBottomPagePosition = function () {
            if (this.direction === 1 /* FlipDirection.BACK */) {
                return { x: this.pageWidth, y: 0 };
            }
            return { x: 0, y: 0 };
        };
        /**
         * Get the starting position of the shadow
         */
        FlipCalculation.prototype.getShadowStartPoint = function () {
            if (this.corner === "top" /* FlipCorner.TOP */) {
                return this.topIntersectPoint;
            }
            else {
                if (this.sideIntersectPoint !== null)
                    return this.sideIntersectPoint;
                return this.topIntersectPoint;
            }
        };
        /**
         * Get the rotate angle of the shadow
         */
        FlipCalculation.prototype.getShadowAngle = function () {
            var angle = Helper_1.Helper.GetAngleBetweenTwoLine(this.getSegmentToShadowLine(), [
                { x: 0, y: 0 },
                { x: this.pageWidth, y: 0 },
            ]);
            if (this.direction === 0 /* FlipDirection.FORWARD */) {
                return angle;
            }
            return Math.PI - angle;
        };
        FlipCalculation.prototype.calcAngleAndPosition = function (pos) {
            var result = pos;
            this.updateAngleAndGeometry(result);
            if (this.corner === "top" /* FlipCorner.TOP */) {
                result = this.checkPositionAtCenterLine(result, { x: 0, y: 0 }, { x: 0, y: this.pageHeight });
            }
            else {
                result = this.checkPositionAtCenterLine(result, { x: 0, y: this.pageHeight }, { x: 0, y: 0 });
            }
            if (Math.abs(result.x - this.pageWidth) < 1 && Math.abs(result.y) < 1) {
                throw new Error('Point is too small');
            }
            return result;
        };
        FlipCalculation.prototype.updateAngleAndGeometry = function (pos) {
            this.angle = this.calculateAngle(pos);
            this.rect = this.getPageRect(pos);
        };
        FlipCalculation.prototype.calculateAngle = function (pos) {
            var left = this.pageWidth - pos.x + 1;
            var top = this.corner === "bottom" /* FlipCorner.BOTTOM */ ? this.pageHeight - pos.y : pos.y;
            var angle = 2 * Math.acos(left / Math.sqrt(top * top + left * left));
            if (top < 0)
                angle = -angle;
            var da = Math.PI - angle;
            if (!isFinite(angle) || (da >= 0 && da < 0.003))
                throw new Error('The G point is too small');
            if (this.corner === "bottom" /* FlipCorner.BOTTOM */)
                angle = -angle;
            return angle;
        };
        FlipCalculation.prototype.getPageRect = function (localPos) {
            if (this.corner === "top" /* FlipCorner.TOP */) {
                return this.getRectFromBasePoint([
                    { x: 0, y: 0 },
                    { x: this.pageWidth, y: 0 },
                    { x: 0, y: this.pageHeight },
                    { x: this.pageWidth, y: this.pageHeight },
                ], localPos);
            }
            return this.getRectFromBasePoint([
                { x: 0, y: -this.pageHeight },
                { x: this.pageWidth, y: -this.pageHeight },
                { x: 0, y: 0 },
                { x: this.pageWidth, y: 0 },
            ], localPos);
        };
        FlipCalculation.prototype.getRectFromBasePoint = function (points, localPos) {
            return {
                topLeft: this.getRotatedPoint(points[0], localPos),
                topRight: this.getRotatedPoint(points[1], localPos),
                bottomLeft: this.getRotatedPoint(points[2], localPos),
                bottomRight: this.getRotatedPoint(points[3], localPos),
            };
        };
        FlipCalculation.prototype.getRotatedPoint = function (transformedPoint, startPoint) {
            return {
                x: transformedPoint.x * Math.cos(this.angle) +
                    transformedPoint.y * Math.sin(this.angle) +
                    startPoint.x,
                y: transformedPoint.y * Math.cos(this.angle) -
                    transformedPoint.x * Math.sin(this.angle) +
                    startPoint.y,
            };
        };
        FlipCalculation.prototype.calculateIntersectPoint = function (pos) {
            var boundRect = {
                left: -1,
                top: -1,
                width: this.pageWidth + 2,
                height: this.pageHeight + 2,
            };
            if (this.corner === "top" /* FlipCorner.TOP */) {
                this.topIntersectPoint = Helper_1.Helper.GetIntersectBetweenTwoSegment(boundRect, [pos, this.rect.topRight], [
                    { x: 0, y: 0 },
                    { x: this.pageWidth, y: 0 },
                ]);
                this.sideIntersectPoint = Helper_1.Helper.GetIntersectBetweenTwoSegment(boundRect, [pos, this.rect.bottomLeft], [
                    { x: this.pageWidth, y: 0 },
                    { x: this.pageWidth, y: this.pageHeight },
                ]);
                this.bottomIntersectPoint = Helper_1.Helper.GetIntersectBetweenTwoSegment(boundRect, [this.rect.bottomLeft, this.rect.bottomRight], [
                    { x: 0, y: this.pageHeight },
                    { x: this.pageWidth, y: this.pageHeight },
                ]);
            }
            else {
                this.topIntersectPoint = Helper_1.Helper.GetIntersectBetweenTwoSegment(boundRect, [this.rect.topLeft, this.rect.topRight], [
                    { x: 0, y: 0 },
                    { x: this.pageWidth, y: 0 },
                ]);
                this.sideIntersectPoint = Helper_1.Helper.GetIntersectBetweenTwoSegment(boundRect, [pos, this.rect.topLeft], [
                    { x: this.pageWidth, y: 0 },
                    { x: this.pageWidth, y: this.pageHeight },
                ]);
                this.bottomIntersectPoint = Helper_1.Helper.GetIntersectBetweenTwoSegment(boundRect, [this.rect.bottomLeft, this.rect.bottomRight], [
                    { x: 0, y: this.pageHeight },
                    { x: this.pageWidth, y: this.pageHeight },
                ]);
            }
        };
        FlipCalculation.prototype.checkPositionAtCenterLine = function (checkedPos, centerOne, centerTwo) {
            var result = checkedPos;
            var tmp = Helper_1.Helper.LimitPointToCircle(centerOne, this.pageWidth, result);
            if (result !== tmp) {
                result = tmp;
                this.updateAngleAndGeometry(result);
            }
            var rad = Math.sqrt(Math.pow(this.pageWidth, 2) + Math.pow(this.pageHeight, 2));
            var checkPointOne = this.rect.bottomRight;
            var checkPointTwo = this.rect.topLeft;
            if (this.corner === "bottom" /* FlipCorner.BOTTOM */) {
                checkPointOne = this.rect.topRight;
                checkPointTwo = this.rect.bottomLeft;
            }
            if (checkPointOne.x <= 0) {
                var bottomPoint = Helper_1.Helper.LimitPointToCircle(centerTwo, rad, checkPointTwo);
                if (bottomPoint !== result) {
                    result = bottomPoint;
                    this.updateAngleAndGeometry(result);
                }
            }
            return result;
        };
        FlipCalculation.prototype.getSegmentToShadowLine = function () {
            var first = this.getShadowStartPoint();
            var second = first !== this.sideIntersectPoint && this.sideIntersectPoint !== null
                ? this.sideIntersectPoint
                : this.bottomIntersectPoint;
            return [first, second];
        };
        return FlipCalculation;
    }());
    exports.FlipCalculation = FlipCalculation;
});
//# sourceMappingURL=FlipCalculation.js.map