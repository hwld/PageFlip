define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Settings = void 0;
    var Settings = /** @class */ (function () {
        function Settings() {
            this._default = {
                startPage: 0,
                size: "fixed" /* SizeType.FIXED */,
                width: 0,
                height: 0,
                minWidth: 0,
                maxWidth: 0,
                minHeight: 0,
                maxHeight: 0,
                drawShadow: true,
                flippingTime: 1000,
                usePortrait: true,
                startZIndex: 0,
                autoSize: true,
                maxShadowOpacity: 1,
                showCover: false,
                mobileScrollSupport: true,
                swipeDistance: 30,
                clickEventForward: true,
                useMouseEvents: true,
                showPageCorners: true,
                disableFlipByClick: false,
            };
        }
        /**
         * Processing parameters received from the user. Substitution default values
         *
         * @param userSetting
         * @returns {FlipSetting} Сonfiguration object
         */
        Settings.prototype.getSettings = function (userSetting) {
            var result = this._default;
            Object.assign(result, userSetting);
            if (result.size !== "stretch" /* SizeType.STRETCH */ && result.size !== "fixed" /* SizeType.FIXED */)
                throw new Error('Invalid size type. Available only "fixed" and "stretch" value');
            if (result.width <= 0 || result.height <= 0)
                throw new Error('Invalid width or height');
            if (result.flippingTime <= 0)
                throw new Error('Invalid flipping time');
            if (result.size === "stretch" /* SizeType.STRETCH */) {
                if (result.minWidth <= 0)
                    result.minWidth = 100;
                if (result.maxWidth < result.minWidth)
                    result.maxWidth = 2000;
                if (result.minHeight <= 0)
                    result.minHeight = 100;
                if (result.maxHeight < result.minHeight)
                    result.maxHeight = 2000;
            }
            else {
                result.minWidth = result.width;
                result.maxWidth = result.width;
                result.minHeight = result.height;
                result.maxHeight = result.height;
            }
            return result;
        };
        return Settings;
    }());
    exports.Settings = Settings;
});
//# sourceMappingURL=Settings.js.map