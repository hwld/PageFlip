define(["require", "exports", "tslib", "./Render", "../Helper"], function (require, exports, tslib_1, Render_1, Helper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HTMLRender = void 0;
    /**
     * Class responsible for rendering the HTML book
     */
    var HTMLRender = /** @class */ (function (_super) {
        tslib_1.__extends(HTMLRender, _super);
        /**
         * @constructor
         *
         * @param {PageFlip} app - PageFlip object
         * @param {FlipSetting} setting - Configuration object
         * @param {HTMLElement} element - Parent HTML Element
         */
        function HTMLRender(app, setting, element) {
            var _this = _super.call(this, app, setting) || this;
            _this.outerShadow = null;
            _this.innerShadow = null;
            _this.hardShadow = null;
            _this.hardInnerShadow = null;
            _this.element = element;
            _this.createShadows();
            return _this;
        }
        HTMLRender.prototype.createShadows = function () {
            this.element.insertAdjacentHTML('beforeend', "<div class='stf__outerShadow'></div>\n             <div class='stf__innerShadow'></div>\n             <div class='stf__hardShadow'></div>\n             <div class='stf__hardInnerShadow'></div>");
            this.outerShadow = this.element.querySelector('.stf__outerShadow');
            this.innerShadow = this.element.querySelector('.stf__innerShadow');
            this.hardShadow = this.element.querySelector('.stf__hardShadow');
            this.hardInnerShadow = this.element.querySelector('.stf__hardInnerShadow');
        };
        HTMLRender.prototype.clearShadow = function () {
            _super.prototype.clearShadow.call(this);
            this.outerShadow.style.cssText = 'display: none';
            this.innerShadow.style.cssText = 'display: none';
            this.hardShadow.style.cssText = 'display: none';
            this.hardInnerShadow.style.cssText = 'display: none';
        };
        HTMLRender.prototype.reload = function () {
            var testShadow = this.element.querySelector('.stf__outerShadow');
            if (!testShadow) {
                this.createShadows();
            }
        };
        /**
         * Draw inner shadow to the hard page
         */
        HTMLRender.prototype.drawHardInnerShadow = function () {
            var rect = this.getRect();
            var progress = this.shadow.progress > 100 ? 200 - this.shadow.progress : this.shadow.progress;
            var innerShadowSize = ((100 - progress) * (2.5 * rect.pageWidth)) / 100 + 20;
            if (innerShadowSize > rect.pageWidth)
                innerShadowSize = rect.pageWidth;
            var newStyle = "\n            display: block;\n            z-index: ".concat((this.getSettings().startZIndex + 5).toString(10), ";\n            width: ").concat(innerShadowSize, "px;\n            height: ").concat(rect.height, "px;\n            background: linear-gradient(to right,\n                rgba(0, 0, 0, ").concat((this.shadow.opacity * progress) / 100, ") 5%,\n                rgba(0, 0, 0, 0) 100%);\n            left: ").concat(rect.left + rect.width / 2, "px;\n            transform-origin: 0 0;\n        ");
            newStyle +=
                (this.getDirection() === 0 /* FlipDirection.FORWARD */ && this.shadow.progress > 100) ||
                    (this.getDirection() === 1 /* FlipDirection.BACK */ && this.shadow.progress <= 100)
                    ? "transform: translate3d(0, 0, 0);"
                    : "transform: translate3d(0, 0, 0) rotateY(180deg);";
            this.hardInnerShadow.style.cssText = newStyle;
        };
        /**
         * Draw outer shadow to the hard page
         */
        HTMLRender.prototype.drawHardOuterShadow = function () {
            var rect = this.getRect();
            var progress = this.shadow.progress > 100 ? 200 - this.shadow.progress : this.shadow.progress;
            var shadowSize = ((100 - progress) * (2.5 * rect.pageWidth)) / 100 + 20;
            if (shadowSize > rect.pageWidth)
                shadowSize = rect.pageWidth;
            var newStyle = "\n            display: block;\n            z-index: ".concat((this.getSettings().startZIndex + 4).toString(10), ";\n            width: ").concat(shadowSize, "px;\n            height: ").concat(rect.height, "px;\n            background: linear-gradient(to left, rgba(0, 0, 0, ").concat(this.shadow.opacity, ") 5%, rgba(0, 0, 0, 0) 100%);\n            left: ").concat(rect.left + rect.width / 2, "px;\n            transform-origin: 0 0;\n        ");
            newStyle +=
                (this.getDirection() === 0 /* FlipDirection.FORWARD */ && this.shadow.progress > 100) ||
                    (this.getDirection() === 1 /* FlipDirection.BACK */ && this.shadow.progress <= 100)
                    ? "transform: translate3d(0, 0, 0) rotateY(180deg);"
                    : "transform: translate3d(0, 0, 0);";
            this.hardShadow.style.cssText = newStyle;
        };
        /**
         * Draw inner shadow to the soft page
         */
        HTMLRender.prototype.drawInnerShadow = function () {
            var rect = this.getRect();
            var innerShadowSize = (this.shadow.width * 3) / 4;
            var shadowTranslate = this.getDirection() === 0 /* FlipDirection.FORWARD */ ? innerShadowSize : 0;
            var shadowDirection = this.getDirection() === 0 /* FlipDirection.FORWARD */ ? 'to left' : 'to right';
            var shadowPos = this.convertToGlobal(this.shadow.pos);
            var angle = this.shadow.angle + (3 * Math.PI) / 2;
            var clip = [
                this.pageRect.topLeft,
                this.pageRect.topRight,
                this.pageRect.bottomRight,
                this.pageRect.bottomLeft,
            ];
            var polygon = 'polygon( ';
            for (var _i = 0, clip_1 = clip; _i < clip_1.length; _i++) {
                var p = clip_1[_i];
                var g = this.getDirection() === 1 /* FlipDirection.BACK */
                    ? {
                        x: -p.x + this.shadow.pos.x,
                        y: p.y - this.shadow.pos.y,
                    }
                    : {
                        x: p.x - this.shadow.pos.x,
                        y: p.y - this.shadow.pos.y,
                    };
                g = Helper_1.Helper.GetRotatedPoint(g, { x: shadowTranslate, y: 100 }, angle);
                polygon += g.x + 'px ' + g.y + 'px, ';
            }
            polygon = polygon.slice(0, -2);
            polygon += ')';
            var newStyle = "\n            display: block;\n            z-index: ".concat((this.getSettings().startZIndex + 10).toString(10), ";\n            width: ").concat(innerShadowSize, "px;\n            height: ").concat(rect.height * 2, "px;\n            background: linear-gradient(").concat(shadowDirection, ",\n                rgba(0, 0, 0, ").concat(this.shadow.opacity, ") 5%,\n                rgba(0, 0, 0, 0.05) 15%,\n                rgba(0, 0, 0, ").concat(this.shadow.opacity, ") 35%,\n                rgba(0, 0, 0, 0) 100%);\n            transform-origin: ").concat(shadowTranslate, "px 100px;\n            transform: translate3d(").concat(shadowPos.x - shadowTranslate, "px, ").concat(shadowPos.y - 100, "px, 0) rotate(").concat(angle, "rad);\n            clip-path: ").concat(polygon, ";\n            -webkit-clip-path: ").concat(polygon, ";\n        ");
            // this.element.style.clipPath = polygon;
            // `
            //     clip-path: ${polygon};
            //     -webkit-clip-path: ${polygon};
            // `;
            this.innerShadow.style.cssText = newStyle;
        };
        /**
         * Draw outer shadow to the soft page
         */
        HTMLRender.prototype.drawOuterShadow = function () {
            var rect = this.getRect();
            var shadowPos = this.convertToGlobal({ x: this.shadow.pos.x, y: this.shadow.pos.y });
            var angle = this.shadow.angle + (3 * Math.PI) / 2;
            var shadowTranslate = this.getDirection() === 1 /* FlipDirection.BACK */ ? this.shadow.width : 0;
            var shadowDirection = this.getDirection() === 0 /* FlipDirection.FORWARD */ ? 'to right' : 'to left';
            var clip = [
                { x: 0, y: 0 },
                { x: rect.pageWidth, y: 0 },
                { x: rect.pageWidth, y: rect.height },
                { x: 0, y: rect.height },
            ];
            var polygon = 'polygon( ';
            for (var _i = 0, clip_2 = clip; _i < clip_2.length; _i++) {
                var p = clip_2[_i];
                if (p !== null) {
                    var g = this.getDirection() === 1 /* FlipDirection.BACK */
                        ? {
                            x: -p.x + this.shadow.pos.x,
                            y: p.y - this.shadow.pos.y,
                        }
                        : {
                            x: p.x - this.shadow.pos.x,
                            y: p.y - this.shadow.pos.y,
                        };
                    g = Helper_1.Helper.GetRotatedPoint(g, { x: shadowTranslate, y: 100 }, angle);
                    polygon += g.x + 'px ' + g.y + 'px, ';
                }
            }
            polygon = polygon.slice(0, -2);
            polygon += ')';
            var newStyle = "\n            display: block;\n            z-index: ".concat((this.getSettings().startZIndex + 10).toString(10), ";\n            width: ").concat(this.shadow.width, "px;\n            height: ").concat(rect.height * 2, "px;\n            background: linear-gradient(").concat(shadowDirection, ", rgba(0, 0, 0, ").concat(this.shadow.opacity, "), rgba(0, 0, 0, 0));\n            transform-origin: ").concat(shadowTranslate, "px 100px;\n            transform: translate3d(").concat(shadowPos.x - shadowTranslate, "px, ").concat(shadowPos.y - 100, "px, 0) rotate(").concat(angle, "rad);\n            clip-path: ").concat(polygon, ";\n            -webkit-clip-path: ").concat(polygon, ";\n        ");
            this.outerShadow.style.cssText = newStyle;
        };
        /**
         * Draw left static page
         */
        HTMLRender.prototype.drawLeftPage = function () {
            if (this.orientation === "portrait" /* Orientation.PORTRAIT */ || this.leftPage === null)
                return;
            if (this.direction === 1 /* FlipDirection.BACK */ &&
                this.flippingPage !== null &&
                this.flippingPage.getDrawingDensity() === "hard" /* PageDensity.HARD */) {
                this.leftPage.getElement().style.zIndex = (this.getSettings().startZIndex + 5).toString(10);
                this.leftPage.setHardDrawingAngle(180 + this.flippingPage.getHardAngle());
                this.leftPage.draw(this.flippingPage.getDrawingDensity());
            }
            else {
                this.leftPage.simpleDraw(0 /* PageOrientation.LEFT */, this.app.getState() !== "read" /* FlippingState.READ */);
            }
        };
        /**
         * Draw right static page
         */
        HTMLRender.prototype.drawRightPage = function () {
            if (this.rightPage === null)
                return;
            if (this.direction === 0 /* FlipDirection.FORWARD */ &&
                this.flippingPage !== null &&
                this.flippingPage.getDrawingDensity() === "hard" /* PageDensity.HARD */) {
                this.rightPage.getElement().style.zIndex = (this.getSettings().startZIndex + 5).toString(10);
                this.rightPage.setHardDrawingAngle(180 + this.flippingPage.getHardAngle());
                this.rightPage.draw(this.flippingPage.getDrawingDensity());
            }
            else {
                this.rightPage.simpleDraw(1 /* PageOrientation.RIGHT */, this.app.getState() !== "read" /* FlippingState.READ */);
            }
        };
        /**
         * Draw the next page at the time of flipping
         */
        HTMLRender.prototype.drawBottomPage = function () {
            if (this.bottomPage === null)
                return;
            var tempDensity = this.flippingPage != null ? this.flippingPage.getDrawingDensity() : null;
            if (!(this.orientation === "portrait" /* Orientation.PORTRAIT */ && this.direction === 1 /* FlipDirection.BACK */)) {
                this.bottomPage.getElement().style.zIndex = (this.getSettings().startZIndex + 3).toString(10);
                this.bottomPage.draw(tempDensity);
            }
        };
        HTMLRender.prototype.drawFrame = function () {
            this.clear();
            this.drawLeftPage();
            this.drawRightPage();
            this.drawBottomPage();
            if (this.flippingPage != null) {
                this.flippingPage.getElement().style.zIndex = (this.getSettings().startZIndex + 5).toString(10);
                this.flippingPage.draw();
            }
            if (this.shadow != null && this.flippingPage !== null) {
                if (this.flippingPage.getDrawingDensity() === "soft" /* PageDensity.SOFT */) {
                    this.drawOuterShadow();
                    this.drawInnerShadow();
                }
                else {
                    this.drawHardOuterShadow();
                    this.drawHardInnerShadow();
                }
            }
        };
        HTMLRender.prototype.clear = function () {
            for (var _i = 0, _a = this.app.getPageCollection().getPages(); _i < _a.length; _i++) {
                var page = _a[_i];
                if (page !== this.leftPage &&
                    page !== this.rightPage &&
                    page !== this.flippingPage &&
                    page !== this.bottomPage) {
                    page.getElement().style.cssText = 'display: none';
                }
                if (page.getTemporaryCopy() !== this.flippingPage) {
                    page.hideTemporaryCopy();
                }
            }
        };
        HTMLRender.prototype.update = function () {
            _super.prototype.update.call(this);
            if (this.rightPage !== null) {
                this.rightPage.setOrientation(1 /* PageOrientation.RIGHT */);
            }
            if (this.leftPage !== null) {
                this.leftPage.setOrientation(0 /* PageOrientation.LEFT */);
            }
        };
        return HTMLRender;
    }(Render_1.Render));
    exports.HTMLRender = HTMLRender;
});
//# sourceMappingURL=HTMLRender.js.map