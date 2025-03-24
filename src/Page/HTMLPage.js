define(["require", "exports", "tslib", "./Page", "../Helper"], function (require, exports, tslib_1, Page_1, Helper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HTMLPage = void 0;
    /**
     * Class representing a book page as a HTML Element
     */
    var HTMLPage = /** @class */ (function (_super) {
        tslib_1.__extends(HTMLPage, _super);
        function HTMLPage(render, element, density) {
            var _this = _super.call(this, render, density) || this;
            _this.copiedElement = null;
            _this.temporaryCopy = null;
            _this.isLoad = false;
            _this.element = element;
            _this.element.classList.add('stf__item');
            _this.element.classList.add('--' + density);
            return _this;
        }
        HTMLPage.prototype.newTemporaryCopy = function () {
            if (this.nowDrawingDensity === "hard" /* PageDensity.HARD */) {
                return this;
            }
            if (this.temporaryCopy === null) {
                this.copiedElement = this.element.cloneNode(true);
                this.element.parentElement.appendChild(this.copiedElement);
                this.temporaryCopy = new HTMLPage(this.render, this.copiedElement, this.nowDrawingDensity);
            }
            return this.getTemporaryCopy();
        };
        HTMLPage.prototype.getTemporaryCopy = function () {
            return this.temporaryCopy;
        };
        HTMLPage.prototype.hideTemporaryCopy = function () {
            if (this.temporaryCopy !== null) {
                this.copiedElement.remove();
                this.copiedElement = null;
                this.temporaryCopy = null;
            }
        };
        HTMLPage.prototype.draw = function (tempDensity) {
            var density = tempDensity ? tempDensity : this.nowDrawingDensity;
            var pagePos = this.render.convertToGlobal(this.state.position);
            var pageWidth = this.render.getRect().pageWidth;
            var pageHeight = this.render.getRect().height;
            this.element.classList.remove('--simple');
            var commonStyle = "\n            display: block;\n            z-index: ".concat(this.element.style.zIndex, ";\n            left: 0;\n            top: 0;\n            width: ").concat(pageWidth, "px;\n            height: ").concat(pageHeight, "px;\n        ");
            density === "hard" /* PageDensity.HARD */
                ? this.drawHard(commonStyle)
                : this.drawSoft(pagePos, commonStyle);
        };
        HTMLPage.prototype.drawHard = function (commonStyle) {
            if (commonStyle === void 0) { commonStyle = ''; }
            var pos = this.render.getRect().left + this.render.getRect().width / 2;
            var angle = this.state.hardDrawingAngle;
            var newStyle = commonStyle +
                "\n                backface-visibility: hidden;\n                -webkit-backface-visibility: hidden;\n                clip-path: none;\n                -webkit-clip-path: none;\n            " +
                (this.orientation === 0 /* PageOrientation.LEFT */
                    ? "transform-origin: ".concat(this.render.getRect().pageWidth, "px 0; \n                   transform: translate3d(0, 0, 0) rotateY(").concat(angle, "deg);")
                    : "transform-origin: 0 0; \n                   transform: translate3d(".concat(pos, "px, 0, 0) rotateY(").concat(angle, "deg);"));
            this.element.style.cssText = newStyle;
        };
        HTMLPage.prototype.drawSoft = function (position, commonStyle) {
            if (commonStyle === void 0) { commonStyle = ''; }
            var polygon = 'polygon( ';
            for (var _i = 0, _a = this.state.area; _i < _a.length; _i++) {
                var p = _a[_i];
                if (p !== null) {
                    var g = this.render.getDirection() === 1 /* FlipDirection.BACK */
                        ? {
                            x: -p.x + this.state.position.x,
                            y: p.y - this.state.position.y,
                        }
                        : {
                            x: p.x - this.state.position.x,
                            y: p.y - this.state.position.y,
                        };
                    g = Helper_1.Helper.GetRotatedPoint(g, { x: 0, y: 0 }, this.state.angle);
                    polygon += g.x + 'px ' + g.y + 'px, ';
                }
            }
            polygon = polygon.slice(0, -2);
            polygon += ')';
            var newStyle = commonStyle +
                "transform-origin: 0 0; clip-path: ".concat(polygon, "; -webkit-clip-path: ").concat(polygon, ";") +
                (this.render.isSafari() && this.state.angle === 0
                    ? "transform: translate(".concat(position.x, "px, ").concat(position.y, "px);")
                    : "transform: translate3d(".concat(position.x, "px, ").concat(position.y, "px, 0) rotate(").concat(this.state.angle, "rad);"));
            this.element.style.cssText = newStyle;
        };
        HTMLPage.prototype.simpleDraw = function (orient, doClip) {
            if (doClip === void 0) { doClip = false; }
            var rect = this.render.getRect();
            var pageWidth = rect.pageWidth;
            var pageHeight = rect.height;
            var x = orient === 1 /* PageOrientation.RIGHT */ ? rect.left + rect.pageWidth : rect.left;
            var y = rect.top;
            var clipPolygon = undefined;
            var clipMe = doClip &&
                (this.render.getDirection() === 0 /* FlipDirection.FORWARD */
                    ? orient === 1 /* PageOrientation.RIGHT */
                    : orient === 0 /* PageOrientation.LEFT */);
            if (clipMe) {
                clipPolygon = 'polygon( ';
                for (var _i = 0, _a = this.state.area; _i < _a.length; _i++) {
                    var p = _a[_i];
                    if (p !== null) {
                        var g = this.render.getDirection() === 1 /* FlipDirection.BACK */
                            ? {
                                x: -p.x + this.state.position.x,
                                y: p.y - this.state.position.y,
                            }
                            : {
                                x: p.x - this.state.position.x,
                                y: p.y - this.state.position.y,
                            };
                        g = Helper_1.Helper.GetRotatedPoint(g, { x: 0, y: 0 }, this.state.angle);
                        clipPolygon += g.x + 'px ' + g.y + 'px, ';
                    }
                }
                clipPolygon = clipPolygon.slice(0, -2);
                clipPolygon += ')';
            }
            this.element.classList.add('--simple');
            var styles = "\n            position: absolute; \n            display: block; \n            height: ".concat(pageHeight, "px; \n            left: ").concat(x, "px; \n            top: ").concat(y, "px; \n            width: ").concat(pageWidth, "px; \n            z-index: ").concat(this.render.getSettings().startZIndex + 1, ";\n        ");
            if (clipPolygon) {
                styles += "clip-path: ".concat(clipPolygon, "; -webkit-clip-path: ").concat(clipPolygon, ";");
            }
            this.element.style.cssText = styles;
        };
        HTMLPage.prototype.getElement = function () {
            return this.element;
        };
        HTMLPage.prototype.load = function () {
            this.isLoad = true;
        };
        HTMLPage.prototype.setOrientation = function (orientation) {
            _super.prototype.setOrientation.call(this, orientation);
            this.element.classList.remove('--left', '--right');
            this.element.classList.add(orientation === 1 /* PageOrientation.RIGHT */ ? '--right' : '--left');
        };
        HTMLPage.prototype.setDrawingDensity = function (density) {
            this.element.classList.remove('--soft', '--hard');
            this.element.classList.add('--' + density);
            _super.prototype.setDrawingDensity.call(this, density);
        };
        return HTMLPage;
    }(Page_1.Page));
    exports.HTMLPage = HTMLPage;
});
//# sourceMappingURL=HTMLPage.js.map