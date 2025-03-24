define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Render = void 0;
    /**
     * Class responsible for rendering the book
     */
    var Render = /** @class */ (function () {
        function Render(app, setting) {
            /** Left static book page */
            this.leftPage = null;
            /** Right static book page */
            this.rightPage = null;
            /** Page currently flipping */
            this.flippingPage = null;
            /** Next page at the time of flipping */
            this.bottomPage = null;
            /** Current flipping direction */
            this.direction = null;
            /** Current book orientation */
            this.orientation = null;
            /** Сurrent state of the shadows */
            this.shadow = null;
            /** Сurrent animation process */
            this.animation = null;
            /** Page borders while flipping */
            this.pageRect = null;
            /** Current book area */
            this.boundsRect = null;
            /** Timer started from start of rendering */
            this.timer = 0;
            /**
             * Safari browser definitions for resolving a bug with a css property clip-area
             *
             * https://bugs.webkit.org/show_bug.cgi?id=126207
             */
            this.safari = false;
            this.setting = setting;
            this.app = app;
            // detect safari
            var regex = new RegExp('Version\\/[\\d\\.]+.*Safari/');
            this.safari = regex.exec(window.navigator.userAgent) !== null;
        }
        /**
         * Executed when requestAnimationFrame is called. Performs the current animation process and call drawFrame()
         *
         * @param timer
         */
        Render.prototype.render = function (timer) {
            if (this.animation !== null) {
                // Find current frame of animation
                var frameIndex = Math.round((timer - this.animation.startedAt) / this.animation.durationFrame);
                if (frameIndex < this.animation.frames.length) {
                    this.animation.frames[frameIndex]();
                }
                else {
                    this.animation.onAnimateEnd();
                    this.animation = null;
                }
            }
            this.timer = timer;
            this.drawFrame();
        };
        /**
         * Running requestAnimationFrame, and rendering process
         */
        Render.prototype.start = function () {
            var _this = this;
            this.update();
            var loop = function (timer) {
                _this.render(timer);
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        };
        /**
         * Start a new animation process
         *
         * @param {FrameAction[]} frames - Frame list
         * @param {number} duration - total animation duration
         * @param {AnimationSuccessAction} onAnimateEnd - Animation callback function
         */
        Render.prototype.startAnimation = function (frames, duration, onAnimateEnd) {
            this.finishAnimation(); // finish the previous animation process
            this.animation = {
                frames: frames,
                duration: duration,
                durationFrame: duration / frames.length,
                onAnimateEnd: onAnimateEnd,
                startedAt: this.timer,
            };
        };
        /**
         * End the current animation process and call the callback
         */
        Render.prototype.finishAnimation = function () {
            if (this.animation !== null) {
                this.animation.frames[this.animation.frames.length - 1]();
                if (this.animation.onAnimateEnd !== null) {
                    this.animation.onAnimateEnd();
                }
            }
            this.animation = null;
        };
        /**
         * Recalculate the size of the displayed area, and update the page orientation
         */
        Render.prototype.update = function () {
            this.boundsRect = null;
            var orientation = this.calculateBoundsRect();
            if (this.orientation !== orientation) {
                this.orientation = orientation;
                this.app.updateOrientation(orientation);
            }
        };
        /**
         * Calculate the size and position of the book depending on the parent element and configuration parameters
         */
        Render.prototype.calculateBoundsRect = function () {
            var orientation = "landscape" /* Orientation.LANDSCAPE */;
            var blockWidth = this.getBlockWidth();
            var middlePoint = {
                x: blockWidth / 2,
                y: this.getBlockHeight() / 2,
            };
            var ratio = this.setting.width / this.setting.height;
            var pageWidth = this.setting.width;
            var pageHeight = this.setting.height;
            var left = middlePoint.x - pageWidth;
            if (this.setting.size === "stretch" /* SizeType.STRETCH */) {
                if (blockWidth < this.setting.minWidth * 2 && this.app.getSettings().usePortrait)
                    orientation = "portrait" /* Orientation.PORTRAIT */;
                pageWidth =
                    orientation === "portrait" /* Orientation.PORTRAIT */
                        ? this.getBlockWidth()
                        : this.getBlockWidth() / 2;
                if (pageWidth > this.setting.maxWidth)
                    pageWidth = this.setting.maxWidth;
                pageHeight = pageWidth / ratio;
                if (pageHeight > this.getBlockHeight()) {
                    pageHeight = this.getBlockHeight();
                    pageWidth = pageHeight * ratio;
                }
                left =
                    orientation === "portrait" /* Orientation.PORTRAIT */
                        ? middlePoint.x - pageWidth / 2 - pageWidth
                        : middlePoint.x - pageWidth;
            }
            else {
                if (blockWidth < pageWidth * 2) {
                    if (this.app.getSettings().usePortrait) {
                        orientation = "portrait" /* Orientation.PORTRAIT */;
                        left = middlePoint.x - pageWidth / 2 - pageWidth;
                    }
                }
            }
            this.boundsRect = {
                left: left,
                top: middlePoint.y - pageHeight / 2,
                width: pageWidth * 2,
                height: pageHeight,
                pageWidth: pageWidth,
            };
            return orientation;
        };
        /**
         * Set the current parameters of the drop shadow
         *
         * @param {Point} pos - Shadow Position Start Point
         * @param {number} angle - The angle of the shadows relative to the book
         * @param {number} progress - Flipping progress in percent (0 - 100)
         * @param {FlipDirection} direction - Flipping Direction, the direction of the shadow gradients
         */
        Render.prototype.setShadowData = function (pos, angle, progress, direction) {
            if (!this.app.getSettings().drawShadow)
                return;
            var maxShadowOpacity = 100 * this.getSettings().maxShadowOpacity;
            this.shadow = {
                pos: pos,
                angle: angle,
                width: (((this.getRect().pageWidth * 3) / 4) * progress) / 100,
                opacity: ((100 - progress) * maxShadowOpacity) / 100 / 100,
                direction: direction,
                progress: progress * 2,
            };
        };
        /**
         * Clear shadow
         */
        Render.prototype.clearShadow = function () {
            this.shadow = null;
        };
        /**
         * Get parent block offset width
         */
        Render.prototype.getBlockWidth = function () {
            return this.app.getUI().getDistElement().offsetWidth;
        };
        /**
         * Get parent block offset height
         */
        Render.prototype.getBlockHeight = function () {
            return this.app.getUI().getDistElement().offsetHeight;
        };
        /**
         * Get current flipping direction
         */
        Render.prototype.getDirection = function () {
            return this.direction;
        };
        /**
         * Сurrent size and position of the book
         */
        Render.prototype.getRect = function () {
            if (this.boundsRect === null)
                this.calculateBoundsRect();
            return this.boundsRect;
        };
        /**
         * Get configuration object
         */
        Render.prototype.getSettings = function () {
            return this.app.getSettings();
        };
        /**
         * Get current book orientation
         */
        Render.prototype.getOrientation = function () {
            return this.orientation;
        };
        /**
         * Set page area while flipping
         *
         * @param direction
         */
        Render.prototype.setPageRect = function (pageRect) {
            this.pageRect = pageRect;
        };
        /**
         * Set flipping direction
         *
         * @param direction
         */
        Render.prototype.setDirection = function (direction) {
            this.direction = direction;
        };
        /**
         * Set right static book page
         *
         * @param page
         */
        Render.prototype.setRightPage = function (page) {
            if (page !== null)
                page.setOrientation(1 /* PageOrientation.RIGHT */);
            this.rightPage = page;
        };
        /**
         * Set left static book page
         * @param page
         */
        Render.prototype.setLeftPage = function (page) {
            if (page !== null)
                page.setOrientation(0 /* PageOrientation.LEFT */);
            this.leftPage = page;
        };
        /**
         * Set next page at the time of flipping
         * @param page
         */
        Render.prototype.setBottomPage = function (page) {
            if (page !== null)
                page.setOrientation(this.direction === 1 /* FlipDirection.BACK */ ? 0 /* PageOrientation.LEFT */ : 1 /* PageOrientation.RIGHT */);
            this.bottomPage = page;
        };
        /**
         * Set currently flipping page
         *
         * @param page
         */
        Render.prototype.setFlippingPage = function (page) {
            if (page !== null)
                page.setOrientation(this.direction === 0 /* FlipDirection.FORWARD */ &&
                    this.orientation !== "portrait" /* Orientation.PORTRAIT */
                    ? 0 /* PageOrientation.LEFT */
                    : 1 /* PageOrientation.RIGHT */);
            this.flippingPage = page;
        };
        /**
         * Coordinate conversion function. Window coordinates -> to book coordinates
         *
         * @param {Point} pos - Global coordinates relative to the window
         * @returns {Point} Coordinates relative to the book
         */
        Render.prototype.convertToBook = function (pos) {
            var rect = this.getRect();
            return {
                x: pos.x - rect.left,
                y: pos.y - rect.top,
            };
        };
        Render.prototype.isSafari = function () {
            return this.safari;
        };
        /**
         * Coordinate conversion function. Window coordinates -> to current coordinates of the working page
         *
         * @param {Point} pos - Global coordinates relative to the window
         * @param {FlipDirection} direction  - Current flipping direction
         *
         * @returns {Point} Coordinates relative to the work page
         */
        Render.prototype.convertToPage = function (pos, direction) {
            if (!direction)
                direction = this.direction;
            var rect = this.getRect();
            var x = direction === 0 /* FlipDirection.FORWARD */
                ? pos.x - rect.left - rect.width / 2
                : rect.width / 2 - pos.x + rect.left;
            return {
                x: x,
                y: pos.y - rect.top,
            };
        };
        /**
         * Coordinate conversion function. Coordinates relative to the work page -> Window coordinates
         *
         * @param {Point} pos - Coordinates relative to the work page
         * @param {FlipDirection} direction  - Current flipping direction
         *
         * @returns {Point} Global coordinates relative to the window
         */
        Render.prototype.convertToGlobal = function (pos, direction) {
            if (!direction)
                direction = this.direction;
            if (pos == null)
                return null;
            var rect = this.getRect();
            var x = direction === 0 /* FlipDirection.FORWARD */
                ? pos.x + rect.left + rect.width / 2
                : rect.width / 2 - pos.x + rect.left;
            return {
                x: x,
                y: pos.y + rect.top,
            };
        };
        /**
         * Casting the coordinates of the corners of the rectangle in the coordinates relative to the window
         *
         * @param {RectPoints} rect - Coordinates of the corners of the rectangle relative to the work page
         * @param {FlipDirection} direction  - Current flipping direction
         *
         * @returns {RectPoints} Coordinates of the corners of the rectangle relative to the window
         */
        Render.prototype.convertRectToGlobal = function (rect, direction) {
            if (!direction)
                direction = this.direction;
            return {
                topLeft: this.convertToGlobal(rect.topLeft, direction),
                topRight: this.convertToGlobal(rect.topRight, direction),
                bottomLeft: this.convertToGlobal(rect.bottomLeft, direction),
                bottomRight: this.convertToGlobal(rect.bottomRight, direction),
            };
        };
        return Render;
    }());
    exports.Render = Render;
});
//# sourceMappingURL=Render.js.map