define(["require", "exports", "../Helper", "./FlipCalculation"], function (require, exports, Helper_1, FlipCalculation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Flip = void 0;
    /**
     * Class representing the flipping process
     */
    var Flip = /** @class */ (function () {
        function Flip(render, app) {
            this.flippingPage = null;
            this.bottomPage = null;
            this.calc = null;
            this.state = "read" /* FlippingState.READ */;
            this.render = render;
            this.app = app;
        }
        /**
         * Called when the page folding (User drags page corner)
         *
         * @param globalPos - Touch Point Coordinates (relative window)
         */
        Flip.prototype.fold = function (globalPos) {
            var didStart = this.calc !== null;
            // If the process has not started yet
            if (this.calc === null) {
                didStart = this.start(globalPos);
            }
            /**
             * Only start the folding if we indeed have a calc
             */
            if (didStart)
                this.setState("user_fold" /* FlippingState.USER_FOLD */);
            this.do(this.render.convertToPage(globalPos));
        };
        /**
         * Page turning with animation
         *
         * @param globalPos - Touch Point Coordinates (relative window)
         */
        Flip.prototype.flip = function (globalPos) {
            if (this.app.getSettings().disableFlipByClick && !this.isPointOnCorners(globalPos))
                return;
            // the flipiing process is already running
            if (this.calc !== null)
                this.render.finishAnimation();
            if (!this.start(globalPos))
                return;
            var rect = this.getBoundsRect();
            this.setState("flipping" /* FlippingState.FLIPPING */);
            // Margin from top to start flipping
            var topMargins = rect.height / 10;
            // Defining animation start points
            var yStart = this.calc.getCorner() === "bottom" /* FlipCorner.BOTTOM */ ? rect.height - topMargins : topMargins;
            var yDest = this.calc.getCorner() === "bottom" /* FlipCorner.BOTTOM */ ? rect.height : 0;
            // Сalculations for these points
            this.calc.calc({ x: rect.pageWidth - topMargins, y: yStart });
            // Run flipping animation
            this.animateFlippingTo({ x: rect.pageWidth - topMargins, y: yStart }, { x: -rect.pageWidth, y: yDest }, true);
        };
        /**
         * Start the flipping process. Find direction and corner of flipping. Creating an object for calculation.
         *
         * @param {Point} globalPos - Touch Point Coordinates (relative window)
         *
         * @returns {boolean} True if flipping is possible, false otherwise
         */
        Flip.prototype.start = function (globalPos) {
            this.reset();
            var bookPos = this.render.convertToBook(globalPos);
            var rect = this.getBoundsRect();
            // Find the direction of flipping
            var direction = this.getDirectionByPoint(bookPos);
            // Find the active corner
            var flipCorner = bookPos.y >= rect.height / 2 ? "bottom" /* FlipCorner.BOTTOM */ : "top" /* FlipCorner.TOP */;
            if (!this.checkDirection(direction))
                return false;
            try {
                this.currentPage = this.app.getPageCollection().getCurrentPage(direction);
                this.flippingPage = this.app.getPageCollection().getFlippingPage(direction);
                this.bottomPage = this.app.getPageCollection().getBottomPage(direction);
                // In landscape mode, needed to set the density  of the next page to the same as that of the flipped
                if (this.render.getOrientation() === "landscape" /* Orientation.LANDSCAPE */) {
                    if (direction === 1 /* FlipDirection.BACK */) {
                        var nextPage = this.app.getPageCollection().nextBy(this.flippingPage);
                        if (nextPage !== null) {
                            if (this.flippingPage.getDensity() !== nextPage.getDensity()) {
                                this.flippingPage.setDrawingDensity("hard" /* PageDensity.HARD */);
                                nextPage.setDrawingDensity("hard" /* PageDensity.HARD */);
                            }
                        }
                    }
                    else {
                        var prevPage = this.app.getPageCollection().prevBy(this.flippingPage);
                        if (prevPage !== null) {
                            if (this.flippingPage.getDensity() !== prevPage.getDensity()) {
                                this.flippingPage.setDrawingDensity("hard" /* PageDensity.HARD */);
                                prevPage.setDrawingDensity("hard" /* PageDensity.HARD */);
                            }
                        }
                    }
                }
                this.render.setDirection(direction);
                this.calc = new FlipCalculation_1.FlipCalculation(direction, flipCorner, rect.pageWidth.toString(10), // fix bug with type casting
                rect.height.toString(10) // fix bug with type casting
                );
                return true;
            }
            catch (e) {
                return false;
            }
        };
        /**
         * Perform calculations for the current page position. Pass data to render object
         *
         * @param {Point} pagePos - Touch Point Coordinates (relative active page)
         */
        Flip.prototype.do = function (pagePos) {
            if (this.calc === null)
                return; // Flipping process not started
            if (this.calc.calc(pagePos)) {
                // Perform calculations for a specific position
                var progress = this.calc.getFlippingProgress();
                this.currentPage.setArea(this.calc.getCurrentClipArea());
                this.currentPage.setPosition(this.calc.getBottomPagePosition());
                this.currentPage.setAngle(0);
                this.currentPage.setHardAngle(0);
                this.bottomPage.setArea(this.calc.getBottomClipArea());
                this.bottomPage.setPosition(this.calc.getBottomPagePosition());
                this.bottomPage.setAngle(0);
                this.bottomPage.setHardAngle(0);
                this.flippingPage.setArea(this.calc.getFlippingClipArea());
                this.flippingPage.setPosition(this.calc.getActiveCorner());
                this.flippingPage.setAngle(this.calc.getAngle());
                if (this.calc.getDirection() === 0 /* FlipDirection.FORWARD */) {
                    this.flippingPage.setHardAngle((90 * (200 - progress * 2)) / 100);
                }
                else {
                    this.flippingPage.setHardAngle((-90 * (200 - progress * 2)) / 100);
                }
                this.render.setPageRect(this.calc.getRect());
                this.render.setBottomPage(this.bottomPage);
                this.render.setFlippingPage(this.flippingPage);
                this.render.setShadowData(this.calc.getShadowStartPoint(), this.calc.getShadowAngle(), progress, this.calc.getDirection());
            }
        };
        /**
         * Turn to the specified page number (with animation)
         *
         * @param {number} page - New page number
         * @param {FlipCorner} corner - Active page corner when turning
         */
        Flip.prototype.flipToPage = function (page, corner) {
            var current = this.app.getPageCollection().getCurrentSpreadIndex();
            var next = this.app.getPageCollection().getSpreadIndexByPage(page);
            try {
                if (next > current) {
                    this.app.getPageCollection().setCurrentSpreadIndex(next - 1);
                    this.flipNext(corner);
                }
                if (next < current) {
                    this.app.getPageCollection().setCurrentSpreadIndex(next + 1);
                    this.flipPrev(corner);
                }
            }
            catch (e) {
                //
            }
        };
        /**
         * Turn to the next page (with animation)
         *
         * @param {FlipCorner} corner - Active page corner when turning
         */
        Flip.prototype.flipNext = function (corner) {
            this.flip({
                x: this.render.getRect().left + this.render.getRect().pageWidth * 2 - 10,
                y: corner === "top" /* FlipCorner.TOP */ ? 1 : this.render.getRect().height - 2,
            });
        };
        /**
         * Turn to the prev page (with animation)
         *
         * @param {FlipCorner} corner - Active page corner when turning
         */
        Flip.prototype.flipPrev = function (corner) {
            this.flip({
                x: 10,
                y: corner === "top" /* FlipCorner.TOP */ ? 1 : this.render.getRect().height - 2,
            });
        };
        /**
         * Called when the user has stopped flipping
         */
        Flip.prototype.stopMove = function () {
            if (this.calc === null)
                return;
            var pos = this.calc.getPosition();
            var rect = this.getBoundsRect();
            var y = this.calc.getCorner() === "bottom" /* FlipCorner.BOTTOM */ ? rect.height : 0;
            if (pos.x <= 0)
                this.animateFlippingTo(pos, { x: -rect.pageWidth, y: y }, true);
            else
                this.animateFlippingTo(pos, { x: rect.pageWidth, y: y }, false);
        };
        /**
         * Fold the corners of the book when the mouse pointer is over them.
         * Called when the mouse pointer is over the book without clicking
         *
         * @param globalPos
         */
        Flip.prototype.showCorner = function (globalPos) {
            if (!this.checkState("read" /* FlippingState.READ */, "fold_corner" /* FlippingState.FOLD_CORNER */))
                return;
            var rect = this.getBoundsRect();
            var pageWidth = rect.pageWidth;
            if (this.isPointOnCorners(globalPos)) {
                if (this.calc === null) {
                    if (!this.start(globalPos))
                        return;
                    this.setState("fold_corner" /* FlippingState.FOLD_CORNER */);
                    this.calc.calc({ x: pageWidth - 1, y: 1 });
                    var fixedCornerSize = 50;
                    var yStart = this.calc.getCorner() === "bottom" /* FlipCorner.BOTTOM */ ? rect.height - 1 : 1;
                    var yDest = this.calc.getCorner() === "bottom" /* FlipCorner.BOTTOM */
                        ? rect.height - fixedCornerSize
                        : fixedCornerSize;
                    this.animateFlippingTo({ x: pageWidth - 1, y: yStart }, { x: pageWidth - fixedCornerSize, y: yDest }, false, false);
                }
                else {
                    this.do(this.render.convertToPage(globalPos));
                }
            }
            else {
                this.setState("read" /* FlippingState.READ */);
                this.render.finishAnimation();
                this.stopMove();
            }
        };
        /**
         * Starting the flipping animation process
         *
         * @param {Point} start - animation start point
         * @param {Point} dest - animation end point
         * @param {boolean} isTurned - will the page turn over, or just bring it back
         * @param {boolean} needReset - reset the flipping process at the end of the animation
         */
        Flip.prototype.animateFlippingTo = function (start, dest, isTurned, needReset) {
            var _this = this;
            if (needReset === void 0) { needReset = true; }
            var points = Helper_1.Helper.GetCordsFromTwoPoint(start, dest);
            // Create frames
            var frames = [];
            var _loop_1 = function (p) {
                frames.push(function () { return _this.do(p); });
            };
            for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
                var p = points_1[_i];
                _loop_1(p);
            }
            var duration = this.getAnimationDuration(points.length);
            this.render.startAnimation(frames, duration, function () {
                // callback function
                if (!_this.calc)
                    return;
                if (isTurned) {
                    if (_this.calc.getDirection() === 1 /* FlipDirection.BACK */)
                        _this.app.turnToPrevPage();
                    else
                        _this.app.turnToNextPage();
                }
                if (needReset) {
                    _this.render.setBottomPage(null);
                    _this.render.setFlippingPage(null);
                    _this.render.clearShadow();
                    _this.setState("read" /* FlippingState.READ */);
                    _this.reset();
                }
            });
        };
        /**
         * Get current flipping state
         */
        Flip.prototype.getState = function () {
            return this.state;
        };
        Flip.prototype.setState = function (newState) {
            if (this.state !== newState) {
                this.app.updateState(newState);
                this.state = newState;
            }
        };
        Flip.prototype.getDirectionByPoint = function (touchPos) {
            var rect = this.getBoundsRect();
            if (this.render.getOrientation() === "portrait" /* Orientation.PORTRAIT */) {
                if (touchPos.x - rect.pageWidth <= rect.width / 5) {
                    return 1 /* FlipDirection.BACK */;
                }
            }
            else if (touchPos.x < rect.width / 2) {
                return 1 /* FlipDirection.BACK */;
            }
            return 0 /* FlipDirection.FORWARD */;
        };
        Flip.prototype.getAnimationDuration = function (size) {
            var defaultTime = this.app.getSettings().flippingTime;
            if (size >= 1000)
                return defaultTime;
            return (size / 1000) * defaultTime;
        };
        Flip.prototype.checkDirection = function (direction) {
            if (direction === 0 /* FlipDirection.FORWARD */)
                return this.app.getCurrentPageIndex() < this.app.getPageCount() - 1;
            return this.app.getCurrentPageIndex() >= 1;
        };
        Flip.prototype.reset = function () {
            this.calc = null;
            this.flippingPage = null;
            this.bottomPage = null;
            this.currentPage = null;
        };
        Flip.prototype.getBoundsRect = function () {
            return this.render.getRect();
        };
        Flip.prototype.checkState = function () {
            var states = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                states[_i] = arguments[_i];
            }
            for (var _a = 0, states_1 = states; _a < states_1.length; _a++) {
                var state = states_1[_a];
                if (this.state === state)
                    return true;
            }
            return false;
        };
        Flip.prototype.isPointOnCorners = function (globalPos) {
            var rect = this.getBoundsRect();
            var pageWidth = rect.pageWidth;
            var operatingDistance = Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;
            var bookPos = this.render.convertToBook(globalPos);
            return (bookPos.x > 0 &&
                bookPos.y > 0 &&
                bookPos.x < rect.width &&
                bookPos.y < rect.height &&
                (bookPos.x < operatingDistance || bookPos.x > rect.width - operatingDistance) &&
                (bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance));
        };
        return Flip;
    }());
    exports.Flip = Flip;
});
//# sourceMappingURL=Flip.js.map