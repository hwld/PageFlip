define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UI = void 0;
    /**
     * UI Class, represents work with DOM
     */
    var UI = /** @class */ (function () {
        /**
         * @constructor
         *
         * @param {HTMLElement} inBlock - Root HTML Element
         * @param {PageFlip} app - PageFlip instanse
         * @param {FlipSetting} setting - Configuration object
         */
        function UI(inBlock, app, setting) {
            var _this = this;
            this.touchPoint = null;
            this.swipeTimeout = 250;
            this.onResize = function () {
                _this.update();
            };
            this.onMouseDown = function (e) {
                if (_this.checkTarget(e.target)) {
                    var pos = _this.getMousePos(e.clientX, e.clientY);
                    _this.app.startUserTouch(pos);
                    e.preventDefault();
                }
            };
            this.onTouchStart = function (e) {
                if (_this.checkTarget(e.target)) {
                    if (e.changedTouches.length > 0) {
                        var t = e.changedTouches[0];
                        var pos_1 = _this.getMousePos(t.clientX, t.clientY);
                        _this.touchPoint = {
                            point: pos_1,
                            time: Date.now(),
                        };
                        // part of swipe detection
                        setTimeout(function () {
                            if (_this.touchPoint !== null) {
                                _this.app.startUserTouch(pos_1);
                            }
                        }, _this.swipeTimeout);
                        if (!_this.app.getSettings().mobileScrollSupport)
                            e.preventDefault();
                    }
                }
            };
            this.onMouseUp = function (e) {
                var pos = _this.getMousePos(e.clientX, e.clientY);
                _this.app.userStop(pos);
            };
            this.onMouseMove = function (e) {
                var pos = _this.getMousePos(e.clientX, e.clientY);
                _this.app.userMove(pos, false);
            };
            this.onTouchMove = function (e) {
                if (e.changedTouches.length > 0) {
                    var t = e.changedTouches[0];
                    var pos = _this.getMousePos(t.clientX, t.clientY);
                    if (_this.app.getSettings().mobileScrollSupport) {
                        if (_this.touchPoint !== null) {
                            if (Math.abs(_this.touchPoint.point.x - pos.x) > 10 ||
                                _this.app.getState() !== "read" /* FlippingState.READ */) {
                                if (e.cancelable)
                                    _this.app.userMove(pos, true);
                            }
                        }
                        if (_this.app.getState() !== "read" /* FlippingState.READ */) {
                            e.preventDefault();
                        }
                    }
                    else {
                        _this.app.userMove(pos, true);
                    }
                }
            };
            this.onTouchEnd = function (e) {
                if (e.changedTouches.length > 0) {
                    var t = e.changedTouches[0];
                    var pos = _this.getMousePos(t.clientX, t.clientY);
                    var isSwipe = false;
                    // swipe detection
                    if (_this.touchPoint !== null) {
                        var dx = pos.x - _this.touchPoint.point.x;
                        var distY = Math.abs(pos.y - _this.touchPoint.point.y);
                        if (Math.abs(dx) > _this.swipeDistance &&
                            distY < _this.swipeDistance * 2 &&
                            Date.now() - _this.touchPoint.time < _this.swipeTimeout) {
                            if (dx > 0) {
                                _this.app.flipPrev(_this.touchPoint.point.y < _this.app.getRender().getRect().height / 2
                                    ? "top" /* FlipCorner.TOP */
                                    : "bottom" /* FlipCorner.BOTTOM */);
                            }
                            else {
                                _this.app.flipNext(_this.touchPoint.point.y < _this.app.getRender().getRect().height / 2
                                    ? "top" /* FlipCorner.TOP */
                                    : "bottom" /* FlipCorner.BOTTOM */);
                            }
                            isSwipe = true;
                        }
                        _this.touchPoint = null;
                    }
                    _this.app.userStop(pos, isSwipe);
                }
            };
            this.parentElement = inBlock;
            inBlock.classList.add('stf__parent');
            // Add first wrapper
            inBlock.insertAdjacentHTML('afterbegin', '<div class="stf__wrapper"></div>');
            this.wrapper = inBlock.querySelector('.stf__wrapper');
            this.app = app;
            var k = this.app.getSettings().usePortrait ? 1 : 2;
            // Setting block sizes based on configuration
            inBlock.style.minWidth = setting.minWidth * k + 'px';
            inBlock.style.minHeight = setting.minHeight + 'px';
            if (setting.size === "fixed" /* SizeType.FIXED */) {
                inBlock.style.minWidth = setting.width * k + 'px';
                inBlock.style.minHeight = setting.height + 'px';
            }
            if (setting.autoSize) {
                inBlock.style.width = '100%';
                inBlock.style.maxWidth = setting.maxWidth * 2 + 'px';
            }
            inBlock.style.display = 'block';
            window.addEventListener('resize', this.onResize, false);
            this.swipeDistance = setting.swipeDistance;
        }
        /**
         * Destructor. Remove all HTML elements and all event handlers
         */
        UI.prototype.destroy = function () {
            if (this.app.getSettings().useMouseEvents)
                this.removeHandlers();
            this.distElement.remove();
            this.wrapper.remove();
        };
        /**
         * Get parent element for book
         *
         * @returns {HTMLElement}
         */
        UI.prototype.getDistElement = function () {
            return this.distElement;
        };
        /**
         * Get wrapper element
         *
         * @returns {HTMLElement}
         */
        UI.prototype.getWrapper = function () {
            return this.wrapper;
        };
        /**
         * Updates styles and sizes based on book orientation
         *
         * @param {Orientation} orientation - New book orientation
         */
        UI.prototype.setOrientationStyle = function (orientation) {
            this.wrapper.classList.remove('--portrait', '--landscape');
            if (orientation === "portrait" /* Orientation.PORTRAIT */) {
                if (this.app.getSettings().autoSize)
                    this.wrapper.style.paddingBottom =
                        (this.app.getSettings().height / this.app.getSettings().width) * 100 + '%';
                this.wrapper.classList.add('--portrait');
            }
            else {
                if (this.app.getSettings().autoSize)
                    this.wrapper.style.paddingBottom =
                        (this.app.getSettings().height / (this.app.getSettings().width * 2)) * 100 +
                            '%';
                this.wrapper.classList.add('--landscape');
            }
            this.update();
        };
        UI.prototype.removeHandlers = function () {
            window.removeEventListener('resize', this.onResize);
            this.distElement.removeEventListener('mousedown', this.onMouseDown);
            this.distElement.removeEventListener('touchstart', this.onTouchStart);
            window.removeEventListener('mousemove', this.onMouseMove);
            window.removeEventListener('touchmove', this.onTouchMove);
            window.removeEventListener('mouseup', this.onMouseUp);
            window.removeEventListener('touchend', this.onTouchEnd);
        };
        UI.prototype.setHandlers = function () {
            window.addEventListener('resize', this.onResize, false);
            if (!this.app.getSettings().useMouseEvents)
                return;
            this.distElement.addEventListener('mousedown', this.onMouseDown);
            this.distElement.addEventListener('touchstart', this.onTouchStart);
            window.addEventListener('mousemove', this.onMouseMove);
            window.addEventListener('touchmove', this.onTouchMove, {
                passive: !this.app.getSettings().mobileScrollSupport,
            });
            window.addEventListener('mouseup', this.onMouseUp);
            window.addEventListener('touchend', this.onTouchEnd);
        };
        /**
         * Convert global coordinates to relative book coordinates
         *
         * @param x
         * @param y
         */
        UI.prototype.getMousePos = function (x, y) {
            var rect = this.distElement.getBoundingClientRect();
            
            // Calculate scale factor by comparing the element's offsetWidth with its bounding client width
            // This accounts for any CSS scaling applied to parent elements
            var scaleX = this.distElement.offsetWidth / rect.width;
            var scaleY = this.distElement.offsetHeight / rect.height;
            
            // Apply the inverse of the scale factor to correctly map touch coordinates
            return {
                x: (x - rect.left) * scaleX,
                y: (y - rect.top) * scaleY
            };
        };
        UI.prototype.checkTarget = function (targer) {
            if (!this.app.getSettings().clickEventForward)
                return true;
            if (['a', 'button'].includes(targer.tagName.toLowerCase())) {
                return false;
            }
            return true;
        };
        return UI;
    }());
    exports.UI = UI;
});
//# sourceMappingURL=UI.js.map