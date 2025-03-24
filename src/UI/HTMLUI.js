define(["require", "exports", "tslib", "./UI"], function (require, exports, tslib_1, UI_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HTMLUI = void 0;
    /**
     * UI for HTML mode
     */
    var HTMLUI = /** @class */ (function (_super) {
        tslib_1.__extends(HTMLUI, _super);
        function HTMLUI(inBlock, app, setting, items) {
            var _this = _super.call(this, inBlock, app, setting) || this;
            // Second wrapper to HTML page
            _this.wrapper.insertAdjacentHTML('afterbegin', '<div class="stf__block"></div>');
            _this.distElement = inBlock.querySelector('.stf__block');
            _this.items = items;
            // Convert to array to make TypeScript happy
            var itemsArray = Array.isArray(items) ? items : Array.from(items);
            for (var _i = 0, itemsArray_1 = itemsArray; _i < itemsArray_1.length; _i++) {
                var item = itemsArray_1[_i];
                _this.distElement.appendChild(item);
            }
            _this.setHandlers();
            return _this;
        }
        HTMLUI.prototype.clear = function () {
            // Convert to array to make TypeScript happy
            var itemsArray = Array.isArray(this.items) ? this.items : Array.from(this.items);
            for (var _i = 0, itemsArray_2 = itemsArray; _i < itemsArray_2.length; _i++) {
                var item = itemsArray_2[_i];
                this.parentElement.appendChild(item);
            }
        };
        /**
         * Update page list from HTMLElements
         *
         * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
         */
        HTMLUI.prototype.updateItems = function (items) {
            this.removeHandlers();
            this.distElement.innerHTML = '';
            // Convert to array to make TypeScript happy
            var itemsArray = Array.isArray(items) ? items : Array.from(items);
            for (var _i = 0, itemsArray_3 = itemsArray; _i < itemsArray_3.length; _i++) {
                var item = itemsArray_3[_i];
                this.distElement.appendChild(item);
            }
            this.items = items;
            this.setHandlers();
        };
        HTMLUI.prototype.update = function () {
            this.app.getRender().update();
        };
        return HTMLUI;
    }(UI_1.UI));
    exports.HTMLUI = HTMLUI;
});
//# sourceMappingURL=HTMLUI.js.map