define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PageCollection = void 0;
    /**
     * Сlass representing a collection of pages
     */
    var PageCollection = /** @class */ (function () {
        function PageCollection(app, render) {
            /** Pages List */
            this.pages = [];
            /** Index of the current page in list */
            this.currentPageIndex = 0;
            /** Number of the current spread in book */
            this.currentSpreadIndex = 0;
            /**  Two-page spread in landscape mode */
            this.landscapeSpread = [];
            /**  One-page spread in portrait mode */
            this.portraitSpread = [];
            this.render = render;
            this.app = app;
            this.currentPageIndex = 0;
            this.isShowCover = this.app.getSettings().showCover;
        }
        /**
         * Clear pages list
         */
        PageCollection.prototype.destroy = function () {
            this.pages = [];
        };
        /**
         * Split the book on the two-page spread in landscape mode and one-page spread in portrait mode
         */
        PageCollection.prototype.createSpread = function () {
            this.landscapeSpread = [];
            this.portraitSpread = [];
            for (var i = 0; i < this.pages.length; i++) {
                this.portraitSpread.push([i]); // In portrait mode - (one spread = one page)
            }
            var start = 0;
            if (this.isShowCover) {
                this.landscapeSpread.push([start]);
                start++;
            }
            for (var i = start; i < this.pages.length; i += 2) {
                if (i < this.pages.length - 1) {
                    this.landscapeSpread.push([i, i + 1]);
                }
                else {
                    this.landscapeSpread.push([i]);
                }
            }
        };
        /**
         * Get spread by mode (portrait or landscape)
         */
        PageCollection.prototype.getSpread = function () {
            return this.render.getOrientation() === "landscape" /* Orientation.LANDSCAPE */
                ? this.landscapeSpread
                : this.portraitSpread;
        };
        /**
         * Get spread index by page number
         *
         * @param {number} pageNum - page index
         */
        PageCollection.prototype.getSpreadIndexByPage = function (pageNum) {
            var spread = this.getSpread();
            for (var i = 0; i < spread.length; i++)
                if (pageNum === spread[i][0] || pageNum === spread[i][1])
                    return i;
            return null;
        };
        /**
         * Get the total number of pages
         */
        PageCollection.prototype.getPageCount = function () {
            return this.pages.length;
        };
        /**
         * Get the pages list
         */
        PageCollection.prototype.getPages = function () {
            return this.pages;
        };
        /**
         * Get page by index
         *
         * @param {number} pageIndex
         */
        PageCollection.prototype.getPage = function (pageIndex) {
            if (pageIndex >= 0 && pageIndex < this.pages.length) {
                return this.pages[pageIndex];
            }
            throw new Error('Invalid page number');
        };
        /**
         * Get the next page from the specified
         *
         * @param {Page} current
         */
        PageCollection.prototype.nextBy = function (current) {
            var idx = this.pages.indexOf(current);
            if (idx < this.pages.length - 1)
                return this.pages[idx + 1];
            return null;
        };
        /**
         * Get previous page from specified
         *
         * @param {Page} current
         */
        PageCollection.prototype.prevBy = function (current) {
            var idx = this.pages.indexOf(current);
            if (idx > 0)
                return this.pages[idx - 1];
            return null;
        };
        /**
         * Get Next page at the time of flipping
         *
         * @param {FlipDirection}  direction
         */
        PageCollection.prototype.getCurrentPage = function (direction) {
            var current = this.currentSpreadIndex;
            var spread = this.getSpread()[current];
            if (spread.length === 1)
                return this.pages[spread[0]];
            return direction === 0 /* FlipDirection.FORWARD */ ? this.pages[spread[1]] : this.pages[spread[0]];
        };
        /**
         * Get flipping page depending on the direction
         *
         * @param {FlipDirection} direction
         */
        PageCollection.prototype.getFlippingPage = function (direction) {
            var current = this.currentSpreadIndex;
            if (this.render.getOrientation() === "portrait" /* Orientation.PORTRAIT */) {
                return direction === 0 /* FlipDirection.FORWARD */
                    ? this.pages[current].newTemporaryCopy()
                    : this.pages[current - 1];
            }
            else {
                var spread = direction === 0 /* FlipDirection.FORWARD */
                    ? this.getSpread()[current + 1]
                    : this.getSpread()[current - 1];
                if (spread.length === 1)
                    return this.pages[spread[0]];
                return direction === 0 /* FlipDirection.FORWARD */
                    ? this.pages[spread[0]]
                    : this.pages[spread[1]];
            }
        };
        /**
         * Get Next page at the time of flipping
         *
         * @param {FlipDirection}  direction
         */
        PageCollection.prototype.getBottomPage = function (direction) {
            var current = this.currentSpreadIndex;
            if (this.render.getOrientation() === "portrait" /* Orientation.PORTRAIT */) {
                return direction === 0 /* FlipDirection.FORWARD */
                    ? this.pages[current + 1]
                    : this.pages[current - 1];
            }
            else {
                var spread = direction === 0 /* FlipDirection.FORWARD */
                    ? this.getSpread()[current + 1]
                    : this.getSpread()[current - 1];
                if (spread.length === 1)
                    return this.pages[spread[0]];
                return direction === 0 /* FlipDirection.FORWARD */
                    ? this.pages[spread[1]]
                    : this.pages[spread[0]];
            }
        };
        /**
         * Show next spread
         */
        PageCollection.prototype.showNext = function () {
            if (this.currentSpreadIndex < this.getSpread().length) {
                this.currentSpreadIndex++;
                this.showSpread();
            }
        };
        /**
         * Show prev spread
         */
        PageCollection.prototype.showPrev = function () {
            if (this.currentSpreadIndex > 0) {
                this.currentSpreadIndex--;
                this.showSpread();
            }
        };
        /**
         * Get the number of the current spread in book
         */
        PageCollection.prototype.getCurrentPageIndex = function () {
            return this.currentPageIndex;
        };
        /**
         * Show specified page
         * @param {number} pageNum - Page index (from 0s)
         */
        PageCollection.prototype.show = function (pageNum) {
            if (pageNum === void 0) { pageNum = null; }
            if (pageNum === null)
                pageNum = this.currentPageIndex;
            if (pageNum < 0 || pageNum >= this.pages.length)
                return;
            var spreadIndex = this.getSpreadIndexByPage(pageNum);
            if (spreadIndex !== null) {
                this.currentSpreadIndex = spreadIndex;
                this.showSpread();
            }
        };
        /**
         * Index of the current page in list
         */
        PageCollection.prototype.getCurrentSpreadIndex = function () {
            return this.currentSpreadIndex;
        };
        /**
         * Set new spread index as current
         *
         * @param {number} newIndex - new spread index
         */
        PageCollection.prototype.setCurrentSpreadIndex = function (newIndex) {
            if (newIndex >= 0 && newIndex < this.getSpread().length) {
                this.currentSpreadIndex = newIndex;
            }
            else {
                throw new Error('Invalid page');
            }
        };
        /**
         * Show current spread
         */
        PageCollection.prototype.showSpread = function () {
            var spread = this.getSpread()[this.currentSpreadIndex];
            if (spread.length === 2) {
                this.render.setLeftPage(this.pages[spread[0]]);
                this.render.setRightPage(this.pages[spread[1]]);
            }
            else {
                if (this.render.getOrientation() === "landscape" /* Orientation.LANDSCAPE */) {
                    if (spread[0] === this.pages.length - 1) {
                        this.render.setLeftPage(this.pages[spread[0]]);
                        this.render.setRightPage(null);
                    }
                    else {
                        this.render.setLeftPage(null);
                        this.render.setRightPage(this.pages[spread[0]]);
                    }
                }
                else {
                    this.render.setLeftPage(null);
                    this.render.setRightPage(this.pages[spread[0]]);
                }
            }
            this.currentPageIndex = spread[0];
            this.app.updatePageIndex(this.currentPageIndex);
        };
        return PageCollection;
    }());
    exports.PageCollection = PageCollection;
});
//# sourceMappingURL=PageCollection.js.map