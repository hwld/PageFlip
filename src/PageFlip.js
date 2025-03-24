define(["require", "exports", "tslib", "./Collection/HTMLPageCollection", "./Event/EventObject", "./Flip/Flip", "./Helper", "./Render/HTMLRender", "./Settings", "./UI/HTMLUI"], function (require, exports, tslib_1, HTMLPageCollection_1, EventObject_1, Flip_1, Helper_1, HTMLRender_1, Settings_1, HTMLUI_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PageFlip = void 0;
    /**
     * Class representing a main PageFlip object
     *
     * @extends EventObject
     */
    var PageFlip = /** @class */ (function (_super) {
        tslib_1.__extends(PageFlip, _super);
        /**
         * Create a new PageFlip instance
         *
         * @constructor
         * @param {HTMLElement} inBlock - Root HTML Element
         * @param {Object} setting - Configuration object
         */
        function PageFlip(inBlock, setting) {
            var _this = _super.call(this) || this;
            _this.isUserTouch = false;
            _this.isUserMove = false;
            _this.setting = null;
            _this.pages = null;
            _this.setting = new Settings_1.Settings().getSettings(setting);
            _this.block = inBlock;
            return _this;
        }
        /**
         * Destructor. Remove a root HTML element and all event handlers
         */
        PageFlip.prototype.destroy = function () {
            this.ui.destroy();
            this.block.remove();
        };
        /**
         * Update the render area. Re-show current page.
         */
        PageFlip.prototype.update = function () {
            this.render.update();
            this.pages.show();
        };
        /**
         * Load pages from HTML elements on the HTML mode
         *
         * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
         */
        PageFlip.prototype.loadFromHTML = function (items) {
            var _this = this;
            this.ui = new HTMLUI_1.HTMLUI(this.block, this, this.setting, items);
            this.render = new HTMLRender_1.HTMLRender(this, this.setting, this.ui.getDistElement());
            this.flipController = new Flip_1.Flip(this.render, this);
            this.pages = new HTMLPageCollection_1.HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);
            this.pages.load();
            this.render.start();
            this.pages.show(this.setting.startPage);
            // safari fix
            setTimeout(function () {
                _this.ui.update();
                _this.trigger('init', _this, {
                    page: _this.setting.startPage,
                    mode: _this.render.getOrientation(),
                });
            }, 1);
        };
        /**
         * Update current pages from HTML
         *
         * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
         */
        PageFlip.prototype.updateFromHtml = function (items) {
            var current = this.pages.getCurrentPageIndex();
            this.pages.destroy();
            this.pages = new HTMLPageCollection_1.HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);
            this.pages.load();
            this.ui.updateItems(items);
            this.render.reload();
            this.pages.show(current);
            this.trigger('update', this, {
                page: current,
                mode: this.render.getOrientation(),
            });
        };
        /**
         * Clear pages from HTML (remove to initinalState)
         */
        PageFlip.prototype.clear = function () {
            this.pages.destroy();
            this.ui.clear();
        };
        /**
         * Turn to the previous page (without animation)
         */
        PageFlip.prototype.turnToPrevPage = function () {
            this.pages.showPrev();
        };
        /**
         * Turn to the next page (without animation)
         */
        PageFlip.prototype.turnToNextPage = function () {
            this.pages.showNext();
        };
        /**
         * Turn to the specified page number (without animation)
         *
         * @param {number} page - New page number
         */
        PageFlip.prototype.turnToPage = function (page) {
            this.pages.show(page);
        };
        /**
         * Turn to the next page (with animation)
         *
         * @param {FlipCorner} corner - Active page corner when turning
         */
        PageFlip.prototype.flipNext = function (corner) {
            if (corner === void 0) { corner = "top" /* FlipCorner.TOP */; }
            this.flipController.flipNext(corner);
        };
        /**
         * Turn to the prev page (with animation)
         *
         * @param {FlipCorner} corner - Active page corner when turning
         */
        PageFlip.prototype.flipPrev = function (corner) {
            if (corner === void 0) { corner = "top" /* FlipCorner.TOP */; }
            this.flipController.flipPrev(corner);
        };
        /**
         * Turn to the specified page number (with animation)
         *
         * @param {number} page - New page number
         * @param {FlipCorner} corner - Active page corner when turning
         */
        PageFlip.prototype.flip = function (page, corner) {
            if (corner === void 0) { corner = "top" /* FlipCorner.TOP */; }
            this.flipController.flipToPage(page, corner);
        };
        /**
         * Call a state change event trigger
         *
         * @param {FlippingState} newState - New  state of the object
         */
        PageFlip.prototype.updateState = function (newState) {
            this.trigger('changeState', this, newState);
        };
        /**
         * Call a page number change event trigger
         *
         * @param {number} newPage - New page Number
         */
        PageFlip.prototype.updatePageIndex = function (newPage) {
            this.trigger('flip', this, newPage);
        };
        /**
         * Call a page orientation change event trigger. Update UI and rendering area
         *
         * @param {Orientation} newOrientation - New page orientation (portrait, landscape)
         */
        PageFlip.prototype.updateOrientation = function (newOrientation) {
            this.ui.setOrientationStyle(newOrientation);
            this.update();
            this.trigger('changeOrientation', this, newOrientation);
        };
        /**
         * Get the total number of pages in a book
         *
         * @returns {number}
         */
        PageFlip.prototype.getPageCount = function () {
            return this.pages.getPageCount();
        };
        /**
         * Get the index of the current page in the page list (starts at 0)
         *
         * @returns {number}
         */
        PageFlip.prototype.getCurrentPageIndex = function () {
            return this.pages.getCurrentPageIndex();
        };
        /**
         * Get page from collection by number
         *
         * @param {number} pageIndex
         * @returns {Page}
         */
        PageFlip.prototype.getPage = function (pageIndex) {
            return this.pages.getPage(pageIndex);
        };
        /**
         * Get the current rendering object
         *
         * @returns {Render}
         */
        PageFlip.prototype.getRender = function () {
            return this.render;
        };
        /**
         * Get current object responsible for flipping
         *
         * @returns {Flip}
         */
        PageFlip.prototype.getFlipController = function () {
            return this.flipController;
        };
        /**
         * Get current page orientation
         *
         * @returns {Orientation} Сurrent orientation: portrait or landscape
         */
        PageFlip.prototype.getOrientation = function () {
            return this.render.getOrientation();
        };
        /**
         * Get current book sizes and position
         *
         * @returns {PageRect}
         */
        PageFlip.prototype.getBoundsRect = function () {
            return this.render.getRect();
        };
        /**
         * Get configuration object
         *
         * @returns {FlipSetting}
         */
        PageFlip.prototype.getSettings = function () {
            return this.setting;
        };
        /**
         * Get UI object
         *
         * @returns {UI}
         */
        PageFlip.prototype.getUI = function () {
            return this.ui;
        };
        /**
         * Get current flipping state
         *
         * @returns {FlippingState}
         */
        PageFlip.prototype.getState = function () {
            return this.flipController.getState();
        };
        /**
         * Get page collection
         *
         * @returns {PageCollection}
         */
        PageFlip.prototype.getPageCollection = function () {
            return this.pages;
        };
        /**
         * Start page turning. Called when a user clicks or touches
         *
         * @param {Point} pos - Touch position in coordinates relative to the book
         */
        PageFlip.prototype.startUserTouch = function (pos) {
            this.mousePosition = pos; // Save touch position
            this.isUserTouch = true;
            this.isUserMove = false;
        };
        /**
         * Called when a finger / mouse moves
         *
         * @param {Point} pos - Touch position in coordinates relative to the book
         * @param {boolean} isTouch - True if there was a touch event, not a mouse click
         */
        PageFlip.prototype.userMove = function (pos, isTouch) {
            if (!this.isUserTouch && !isTouch && this.setting.showPageCorners) {
                this.flipController.showCorner(pos); // fold Page Corner
            }
            else if (this.isUserTouch) {
                if (Helper_1.Helper.GetDistanceBetweenTwoPoint(this.mousePosition, pos) > 5) {
                    this.isUserMove = true;
                    this.flipController.fold(pos);
                }
            }
        };
        /**
         * Сalled when the user has stopped touching
         *
         * @param {Point} pos - Touch end position in coordinates relative to the book
         * @param {boolean} isSwipe - true if there was a mobile swipe event
         */
        PageFlip.prototype.userStop = function (pos, isSwipe) {
            if (isSwipe === void 0) { isSwipe = false; }
            if (this.isUserTouch) {
                this.isUserTouch = false;
                if (!isSwipe) {
                    if (!this.isUserMove)
                        this.flipController.flip(pos);
                    else
                        this.flipController.stopMove();
                }
            }
        };
        return PageFlip;
    }(EventObject_1.EventObject));
    exports.PageFlip = PageFlip;
});
//# sourceMappingURL=PageFlip.js.map