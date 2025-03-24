define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventObject = void 0;
    /**
     * A class implementing a basic event model
     */
    var EventObject = /** @class */ (function () {
        function EventObject() {
            this.events = new Map();
        }
        /**
         * Add new event handler
         *
         * @param {string} eventName
         * @param {EventCallback} callback
         */
        EventObject.prototype.on = function (eventName, callback) {
            if (!this.events.has(eventName)) {
                this.events.set(eventName, [callback]);
            }
            else {
                this.events.get(eventName).push(callback);
            }
            return this;
        };
        /**
         * Removing all handlers from an event
         *
         * @param {string} event - Event name
         */
        EventObject.prototype.off = function (event) {
            this.events.delete(event);
        };
        EventObject.prototype.trigger = function (eventName, app, data) {
            if (data === void 0) { data = null; }
            if (!this.events.has(eventName))
                return;
            for (var _i = 0, _a = this.events.get(eventName); _i < _a.length; _i++) {
                var callback = _a[_i];
                callback({ data: data, object: app });
            }
        };
        return EventObject;
    }());
    exports.EventObject = EventObject;
});
//# sourceMappingURL=EventObject.js.map