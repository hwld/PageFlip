define(["require", "exports", "tslib", "../Page/HTMLPage", "./PageCollection"], function (require, exports, tslib_1, HTMLPage_1, PageCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HTMLPageCollection = void 0;
    /**
     * Сlass representing a collection of pages as HTML Element
     */
    var HTMLPageCollection = /** @class */ (function (_super) {
        tslib_1.__extends(HTMLPageCollection, _super);
        function HTMLPageCollection(app, render, element, items) {
            var _this = _super.call(this, app, render) || this;
            _this.element = element;
            _this.pagesElement = items;
            return _this;
        }
        HTMLPageCollection.prototype.load = function () {
            // Convert to array to make TypeScript happy
            var pageElements = Array.isArray(this.pagesElement)
                ? this.pagesElement
                : Array.from(this.pagesElement);
            for (var _i = 0, pageElements_1 = pageElements; _i < pageElements_1.length; _i++) {
                var pageElement = pageElements_1[_i];
                var page = new HTMLPage_1.HTMLPage(this.render, pageElement, pageElement.dataset['density'] === 'hard' ? "hard" /* PageDensity.HARD */ : "soft" /* PageDensity.SOFT */);
                page.load();
                this.pages.push(page);
            }
            this.createSpread();
        };
        return HTMLPageCollection;
    }(PageCollection_1.PageCollection));
    exports.HTMLPageCollection = HTMLPageCollection;
});
//# sourceMappingURL=HTMLPageCollection.js.map