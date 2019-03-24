/** @module interact */
import { Scope } from '@interactjs/core/scope';
import * as utils from '@interactjs/utils';
import browser from '@interactjs/utils/browser';
import events from '@interactjs/utils/events';
const globalEvents = {};
const scope = new Scope();
/**
 * ```js
 * interact('#draggable').draggable(true)
 *
 * var rectables = interact('rect')
 * rectables
 *   .gesturable(true)
 *   .on('gesturemove', function (event) {
 *       // ...
 *   })
 * ```
 *
 * The methods of this variable can be used to set elements as interactables
 * and also to change various default settings.
 *
 * Calling it as a function and passing an element or a valid CSS selector
 * string returns an Interactable object which has various methods to configure
 * it.
 *
 * @global
 *
 * @param {Element | string} target The HTML or SVG Element to interact with
 * or CSS selector
 * @return {Interactable}
 */
export const interact = function interact(target, options) {
    let interactable = scope.interactables.get(target, options);
    if (!interactable) {
        interactable = scope.interactables.new(target, options);
        interactable.events.global = globalEvents;
    }
    return interactable;
};
scope._plugins = [];
scope._pluginMap = {};
function pluginIsInstalled(plugin) {
    return scope._pluginMap[plugin.id] || scope._plugins.indexOf(plugin) !== -1;
}
/**
 * Use a plugin
 *
 * @alias module:interact.use
 *
 * @param {Object} plugin
 * @param {function} plugin.install
 * @return {interact}
 */
interact.use = use;
function use(plugin, options) {
    if (pluginIsInstalled(plugin)) {
        return interact;
    }
    plugin.install(scope, options);
    scope._plugins.push(plugin);
    if (plugin.id) {
        scope._pluginMap[plugin.id] = plugin;
    }
    return interact;
}
/**
 * Check if an element or selector has been set with the {@link interact}
 * function
 *
 * @alias module:interact.isSet
 *
 * @param {Element} element The Element being searched for
 * @return {boolean} Indicates if the element or CSS selector was previously
 * passed to interact
 */
interact.isSet = isSet;
function isSet(element, options) {
    return scope.interactables.indexOfElement(element, options && options.context) !== -1;
}
/**
 * Add a global listener for an InteractEvent or adds a DOM event to `document`
 *
 * @alias module:interact.on
 *
 * @param {string | array | object} type The types of events to listen for
 * @param {function} listener The function event (s)
 * @param {object | boolean} [options] object or useCapture flag for
 * addEventListener
 * @return {object} interact
 */
interact.on = on;
function on(type, listener, options) {
    if (utils.is.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
    }
    if (utils.is.array(type)) {
        for (const eventType of type) {
            interact.on(eventType, listener, options);
        }
        return interact;
    }
    if (utils.is.object(type)) {
        for (const prop in type) {
            interact.on(prop, type[prop], listener);
        }
        return interact;
    }
    // if it is an InteractEvent type, add listener to globalEvents
    if (utils.arr.contains(scope.actions.eventTypes, type)) {
        // if this type of event was never bound
        if (!globalEvents[type]) {
            globalEvents[type] = [listener];
        }
        else {
            globalEvents[type].push(listener);
        }
    }
    // If non InteractEvent type, addEventListener to document
    else {
        events.add(scope.document, type, listener, { options });
    }
    return interact;
}
/**
 * Removes a global InteractEvent listener or DOM event from `document`
 *
 * @alias module:interact.off
 *
 * @param {string | array | object} type The types of events that were listened
 * for
 * @param {function} listener The listener function to be removed
 * @param {object | boolean} options [options] object or useCapture flag for
 * removeEventListener
 * @return {object} interact
 */
interact.off = off;
function off(type, listener, options) {
    if (utils.is.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
    }
    if (utils.is.array(type)) {
        for (const eventType of type) {
            interact.off(eventType, listener, options);
        }
        return interact;
    }
    if (utils.is.object(type)) {
        for (const prop in type) {
            interact.off(prop, type[prop], listener);
        }
        return interact;
    }
    if (!utils.arr.contains(scope.actions.eventTypes, type)) {
        events.remove(scope.document, type, listener, options);
    }
    else {
        let index;
        if (type in globalEvents &&
            (index = globalEvents[type].indexOf(listener)) !== -1) {
            globalEvents[type].splice(index, 1);
        }
    }
    return interact;
}
/**
 * Returns an object which exposes internal data
 * @alias module:interact.debug
 *
 * @return {object} An object with properties that outline the current state
 * and expose internal functions and variables
 */
interact.debug = debug;
function debug() {
    return scope;
}
// expose the functions used to calculate multi-touch properties
interact.getPointerAverage = utils.pointer.pointerAverage;
interact.getTouchBBox = utils.pointer.touchBBox;
interact.getTouchDistance = utils.pointer.touchDistance;
interact.getTouchAngle = utils.pointer.touchAngle;
interact.getElementRect = utils.dom.getElementRect;
interact.getElementClientRect = utils.dom.getElementClientRect;
interact.matchesSelector = utils.dom.matchesSelector;
interact.closest = utils.dom.closest;
/**
 * @alias module:interact.supportsTouch
 *
 * @return {boolean} Whether or not the browser supports touch input
 */
interact.supportsTouch = supportsTouch;
function supportsTouch() {
    return browser.supportsTouch;
}
/**
 * @alias module:interact.supportsPointerEvent
 *
 * @return {boolean} Whether or not the browser supports PointerEvents
 */
interact.supportsPointerEvent = supportsPointerEvent;
function supportsPointerEvent() {
    return browser.supportsPointerEvent;
}
/**
 * Cancels all interactions (end events are not fired)
 *
 * @alias module:interact.stop
 *
 * @return {object} interact
 */
interact.stop = stop;
function stop() {
    for (const interaction of scope.interactions.list) {
        interaction.stop();
    }
    return interact;
}
/**
 * Returns or sets the distance the pointer must be moved before an action
 * sequence occurs. This also affects tolerance for tap events.
 *
 * @alias module:interact.pointerMoveTolerance
 *
 * @param {number} [newValue] The movement from the start position must be greater than this value
 * @return {interact | number}
 */
interact.pointerMoveTolerance = pointerMoveTolerance;
function pointerMoveTolerance(newValue) {
    if (utils.is.number(newValue)) {
        scope.interactions.pointerMoveTolerance = newValue;
        return interact;
    }
    return scope.interactions.pointerMoveTolerance;
}
scope.interactables.signals.on('unset', ({ interactable }) => {
    scope.interactables.list.splice(scope.interactables.list.indexOf(interactable), 1);
    // Stop related interactions when an Interactable is unset
    for (const interaction of scope.interactions.list) {
        if (interaction.interactable === interactable && interaction.interacting() && interaction._ending) {
            interaction.stop();
        }
    }
});
interact.addDocument = (doc, options) => scope.addDocument(doc, options);
interact.removeDocument = (doc) => scope.removeDocument(doc);
scope.interact = interact;
export { scope };
export default interact;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlcmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx1QkFBdUI7QUFJdkIsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBQzlDLE9BQU8sS0FBSyxLQUFLLE1BQU0sbUJBQW1CLENBQUE7QUFDMUMsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUF3QzdDLE1BQU0sWUFBWSxHQUFRLEVBQUUsQ0FBQTtBQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFBO0FBRXpCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F3Qkc7QUFDSCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQW1CLFNBQVMsUUFBUSxDQUFFLE1BQXVCLEVBQUUsT0FBYTtJQUMvRixJQUFJLFlBQVksR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFFM0QsSUFBSSxDQUFDLFlBQVksRUFBRTtRQUNqQixZQUFZLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ3ZELFlBQVksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQTtLQUMxQztJQUVELE9BQU8sWUFBWSxDQUFBO0FBQ3JCLENBQW1CLENBQUE7QUFFbkIsS0FBSyxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDbkIsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUE7QUFFckIsU0FBUyxpQkFBaUIsQ0FBRSxNQUFjO0lBQ3hDLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFD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LEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0FBQ3hFLFFBQVEsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUE7QUFFNUQsS0FBSyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7QUFFekIsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFBO0FBQ2hCLGVBQWUsUUFBUSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBtb2R1bGUgaW50ZXJhY3QgKi9cblxuaW1wb3J0IHsgT3B0aW9ucyB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvZGVmYXVsdE9wdGlvbnMnXG5pbXBvcnQgSW50ZXJhY3RhYmxlIGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJ1xuaW1wb3J0IHsgU2NvcGUgfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5pbXBvcnQgYnJvd3NlciBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9icm93c2VyJ1xuaW1wb3J0IGV2ZW50cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9ldmVudHMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgUGx1Z2luIHtcbiAgaWQ/OiBzdHJpbmdcbiAgaW5zdGFsbCAoc2NvcGU6IFNjb3BlLCBvcHRpb25zPzogYW55KTogdm9pZFxuICBba2V5OiBzdHJpbmddOiBhbnlcbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnIHtcbiAgaW50ZXJmYWNlIFNjb3BlIHtcbiAgICBpbnRlcmFjdDogSW50ZXJhY3RTdGF0aWNcbiAgICBfcGx1Z2luczogUGx1Z2luW11cbiAgICBfcGx1Z2luTWFwOiB7IFtpZDogc3RyaW5nXTogUGx1Z2luIH1cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVyYWN0U3RhdGljIHtcbiAgKHRhcmdldDogSW50ZXJhY3QuVGFyZ2V0LCBvcHRpb25zPzogT3B0aW9ucyk6IEludGVyYWN0YWJsZVxuICBvbjogdHlwZW9mIG9uXG4gIHBvaW50ZXJNb3ZlVG9sZXJhbmNlOiB0eXBlb2YgcG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgc3RvcDogdHlwZW9mIHN0b3BcbiAgc3VwcG9ydHNQb2ludGVyRXZlbnQ6IHR5cGVvZiBzdXBwb3J0c1BvaW50ZXJFdmVudFxuICBzdXBwb3J0c1RvdWNoOiB0eXBlb2Ygc3VwcG9ydHNUb3VjaFxuICBkZWJ1ZzogdHlwZW9mIGRlYnVnXG4gIG9mZjogdHlwZW9mIG9mZlxuICBpc1NldDogdHlwZW9mIGlzU2V0XG4gIHVzZTogdHlwZW9mIHVzZVxuICBnZXRQb2ludGVyQXZlcmFnZTogdHlwZW9mIHV0aWxzLnBvaW50ZXIucG9pbnRlckF2ZXJhZ2VcbiAgZ2V0VG91Y2hCQm94OiB0eXBlb2YgdXRpbHMucG9pbnRlci50b3VjaEJCb3hcbiAgZ2V0VG91Y2hEaXN0YW5jZTogdHlwZW9mIHV0aWxzLnBvaW50ZXIudG91Y2hEaXN0YW5jZVxuICBnZXRUb3VjaEFuZ2xlOiB0eXBlb2YgdXRpbHMucG9pbnRlci50b3VjaEFuZ2xlXG4gIGdldEVsZW1lbnRSZWN0OiB0eXBlb2YgdXRpbHMuZG9tLmdldEVsZW1lbnRSZWN0XG4gIGdldEVsZW1lbnRDbGllbnRSZWN0OiB0eXBlb2YgdXRpbHMuZG9tLmdldEVsZW1lbnRDbGllbnRSZWN0XG4gIG1hdGNoZXNTZWxlY3RvcjogdHlwZW9mIHV0aWxzLmRvbS5tYXRjaGVzU2VsZWN0b3JcbiAgY2xvc2VzdDogdHlwZW9mIHV0aWxzLmRvbS5jbG9zZXN0XG4gIGFkZERvY3VtZW50OiB0eXBlb2Ygc2NvcGUuYWRkRG9jdW1lbnRcbiAgcmVtb3ZlRG9jdW1lbnQ6IHR5cGVvZiBzY29wZS5yZW1vdmVEb2N1bWVudFxuICB2ZXJzaW9uOiBzdHJpbmdcbn1cblxuY29uc3QgZ2xvYmFsRXZlbnRzOiBhbnkgPSB7fVxuY29uc3Qgc2NvcGUgPSBuZXcgU2NvcGUoKVxuXG4vKipcbiAqIGBgYGpzXG4gKiBpbnRlcmFjdCgnI2RyYWdnYWJsZScpLmRyYWdnYWJsZSh0cnVlKVxuICpcbiAqIHZhciByZWN0YWJsZXMgPSBpbnRlcmFjdCgncmVjdCcpXG4gKiByZWN0YWJsZXNcbiAqICAgLmdlc3R1cmFibGUodHJ1ZSlcbiAqICAgLm9uKCdnZXN0dXJlbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICogICAgICAgLy8gLi4uXG4gKiAgIH0pXG4gKiBgYGBcbiAqXG4gKiBUaGUgbWV0aG9kcyBvZiB0aGlzIHZhcmlhYmxlIGNhbiBiZSB1c2VkIHRvIHNldCBlbGVtZW50cyBhcyBpbnRlcmFjdGFibGVzXG4gKiBhbmQgYWxzbyB0byBjaGFuZ2UgdmFyaW91cyBkZWZhdWx0IHNldHRpbmdzLlxuICpcbiAqIENhbGxpbmcgaXQgYXMgYSBmdW5jdGlvbiBhbmQgcGFzc2luZyBhbiBlbGVtZW50IG9yIGEgdmFsaWQgQ1NTIHNlbGVjdG9yXG4gKiBzdHJpbmcgcmV0dXJucyBhbiBJbnRlcmFjdGFibGUgb2JqZWN0IHdoaWNoIGhhcyB2YXJpb3VzIG1ldGhvZHMgdG8gY29uZmlndXJlXG4gKiBpdC5cbiAqXG4gKiBAZ2xvYmFsXG4gKlxuICogQHBhcmFtIHtFbGVtZW50IHwgc3RyaW5nfSB0YXJnZXQgVGhlIEhUTUwgb3IgU1ZHIEVsZW1lbnQgdG8gaW50ZXJhY3Qgd2l0aFxuICogb3IgQ1NTIHNlbGVjdG9yXG4gKiBAcmV0dXJuIHtJbnRlcmFjdGFibGV9XG4gKi9cbmV4cG9ydCBjb25zdCBpbnRlcmFjdDogSW50ZXJhY3RTdGF0aWMgPSBmdW5jdGlvbiBpbnRlcmFjdCAodGFyZ2V0OiBJbnRlcmFjdC5UYXJnZXQsIG9wdGlvbnM/OiBhbnkpIHtcbiAgbGV0IGludGVyYWN0YWJsZSA9IHNjb3BlLmludGVyYWN0YWJsZXMuZ2V0KHRhcmdldCwgb3B0aW9ucylcblxuICBpZiAoIWludGVyYWN0YWJsZSkge1xuICAgIGludGVyYWN0YWJsZSA9IHNjb3BlLmludGVyYWN0YWJsZXMubmV3KHRhcmdldCwgb3B0aW9ucylcbiAgICBpbnRlcmFjdGFibGUuZXZlbnRzLmdsb2JhbCA9IGdsb2JhbEV2ZW50c1xuICB9XG5cbiAgcmV0dXJuIGludGVyYWN0YWJsZVxufSBhcyBJbnRlcmFjdFN0YXRpY1xuXG5zY29wZS5fcGx1Z2lucyA9IFtdXG5zY29wZS5fcGx1Z2luTWFwID0ge31cblxuZnVuY3Rpb24gcGx1Z2luSXNJbnN0YWxsZWQgKHBsdWdpbjogUGx1Z2luKSB7XG4gIHJldHVybiBzY29wZS5fcGx1Z2luTWFwW3BsdWdpbi5pZF0gfHwgc2NvcGUuX3BsdWdpbnMuaW5kZXhPZihwbHVnaW4pICE9PSAtMVxufVxuXG4vKipcbiAqIFVzZSBhIHBsdWdpblxuICpcbiAqIEBhbGlhcyBtb2R1bGU6aW50ZXJhY3QudXNlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBsdWdpblxuICogQHBhcmFtIHtmdW5jdGlvbn0gcGx1Z2luLmluc3RhbGxcbiAqIEByZXR1cm4ge2ludGVyYWN0fVxuICovXG5pbnRlcmFjdC51c2UgPSB1c2VcbmZ1bmN0aW9uIHVzZSAocGx1Z2luOiBQbHVnaW4sIG9wdGlvbnM/OiB7IFtrZXk6IHN0cmluZ106IGFueSB9KSB7XG4gIGlmIChwbHVnaW5Jc0luc3RhbGxlZChwbHVnaW4pKSB7XG4gICAgcmV0dXJuIGludGVyYWN0XG4gIH1cblxuICBwbHVnaW4uaW5zdGFsbChzY29wZSwgb3B0aW9ucylcbiAgc2NvcGUuX3BsdWdpbnMucHVzaChwbHVnaW4pXG5cbiAgaWYgKHBsdWdpbi5pZCkgeyBzY29wZS5fcGx1Z2luTWFwW3BsdWdpbi5pZF0gPSBwbHVnaW4gfVxuXG4gIHJldHVybiBpbnRlcmFjdFxufVxuXG4vKipcbiAqIENoZWNrIGlmIGFuIGVsZW1lbnQgb3Igc2VsZWN0b3IgaGFzIGJlZW4gc2V0IHdpdGggdGhlIHtAbGluayBpbnRlcmFjdH1cbiAqIGZ1bmN0aW9uXG4gKlxuICogQGFsaWFzIG1vZHVsZTppbnRlcmFjdC5pc1NldFxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgRWxlbWVudCBiZWluZyBzZWFyY2hlZCBmb3JcbiAqIEByZXR1cm4ge2Jvb2xlYW59IEluZGljYXRlcyBpZiB0aGUgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3Igd2FzIHByZXZpb3VzbHlcbiAqIHBhc3NlZCB0byBpbnRlcmFjdFxuICovXG5pbnRlcmFjdC5pc1NldCA9IGlzU2V0XG5mdW5jdGlvbiBpc1NldCAoZWxlbWVudDogRWxlbWVudCwgb3B0aW9ucz86IGFueSkge1xuICByZXR1cm4gc2NvcGUuaW50ZXJhY3RhYmxlcy5pbmRleE9mRWxlbWVudChlbGVtZW50LCBvcHRpb25zICYmIG9wdGlvbnMuY29udGV4dCkgIT09IC0xXG59XG5cbi8qKlxuICogQWRkIGEgZ2xvYmFsIGxpc3RlbmVyIGZvciBhbiBJbnRlcmFjdEV2ZW50IG9yIGFkZHMgYSBET00gZXZlbnQgdG8gYGRvY3VtZW50YFxuICpcbiAqIEBhbGlhcyBtb2R1bGU6aW50ZXJhY3Qub25cbiAqXG4gKiBAcGFyYW0ge3N0cmluZyB8IGFycmF5IHwgb2JqZWN0fSB0eXBlIFRoZSB0eXBlcyBvZiBldmVudHMgdG8gbGlzdGVuIGZvclxuICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXIgVGhlIGZ1bmN0aW9uIGV2ZW50IChzKVxuICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb2JqZWN0IG9yIHVzZUNhcHR1cmUgZmxhZyBmb3JcbiAqIGFkZEV2ZW50TGlzdGVuZXJcbiAqIEByZXR1cm4ge29iamVjdH0gaW50ZXJhY3RcbiAqL1xuaW50ZXJhY3Qub24gPSBvblxuZnVuY3Rpb24gb24gKHR5cGU6IHN0cmluZyB8IEludGVyYWN0LkV2ZW50VHlwZXMsIGxpc3RlbmVyOiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/KSB7XG4gIGlmICh1dGlscy5pcy5zdHJpbmcodHlwZSkgJiYgdHlwZS5zZWFyY2goJyAnKSAhPT0gLTEpIHtcbiAgICB0eXBlID0gdHlwZS50cmltKCkuc3BsaXQoLyArLylcbiAgfVxuXG4gIGlmICh1dGlscy5pcy5hcnJheSh0eXBlKSkge1xuICAgIGZvciAoY29uc3QgZXZlbnRUeXBlIG9mICh0eXBlIGFzIGFueVtdKSkge1xuICAgICAgaW50ZXJhY3Qub24oZXZlbnRUeXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJhY3RcbiAgfVxuXG4gIGlmICh1dGlscy5pcy5vYmplY3QodHlwZSkpIHtcbiAgICBmb3IgKGNvbnN0IHByb3AgaW4gdHlwZSkge1xuICAgICAgaW50ZXJhY3Qub24ocHJvcCwgKHR5cGUgYXMgSW50ZXJhY3QuRXZlbnRUeXBlcylbcHJvcF0sIGxpc3RlbmVyKVxuICAgIH1cblxuICAgIHJldHVybiBpbnRlcmFjdFxuICB9XG5cbiAgLy8gaWYgaXQgaXMgYW4gSW50ZXJhY3RFdmVudCB0eXBlLCBhZGQgbGlzdGVuZXIgdG8gZ2xvYmFsRXZlbnRzXG4gIGlmICh1dGlscy5hcnIuY29udGFpbnMoc2NvcGUuYWN0aW9ucy5ldmVudFR5cGVzLCB0eXBlKSkge1xuICAgIC8vIGlmIHRoaXMgdHlwZSBvZiBldmVudCB3YXMgbmV2ZXIgYm91bmRcbiAgICBpZiAoIWdsb2JhbEV2ZW50c1t0eXBlXSkge1xuICAgICAgZ2xvYmFsRXZlbnRzW3R5cGVdID0gW2xpc3RlbmVyXVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGdsb2JhbEV2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKVxuICAgIH1cbiAgfVxuICAvLyBJZiBub24gSW50ZXJhY3RFdmVudCB0eXBlLCBhZGRFdmVudExpc3RlbmVyIHRvIGRvY3VtZW50XG4gIGVsc2Uge1xuICAgIGV2ZW50cy5hZGQoc2NvcGUuZG9jdW1lbnQsIHR5cGUsIGxpc3RlbmVyIGFzIEludGVyYWN0Lkxpc3RlbmVyLCB7IG9wdGlvbnMgfSlcbiAgfVxuXG4gIHJldHVybiBpbnRlcmFjdFxufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBnbG9iYWwgSW50ZXJhY3RFdmVudCBsaXN0ZW5lciBvciBET00gZXZlbnQgZnJvbSBgZG9jdW1lbnRgXG4gKlxuICogQGFsaWFzIG1vZHVsZTppbnRlcmFjdC5vZmZcbiAqXG4gKiBAcGFyYW0ge3N0cmluZyB8IGFycmF5IHwgb2JqZWN0fSB0eXBlIFRoZSB0eXBlcyBvZiBldmVudHMgdGhhdCB3ZXJlIGxpc3RlbmVkXG4gKiBmb3JcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byBiZSByZW1vdmVkXG4gKiBAcGFyYW0ge29iamVjdCB8IGJvb2xlYW59IG9wdGlvbnMgW29wdGlvbnNdIG9iamVjdCBvciB1c2VDYXB0dXJlIGZsYWcgZm9yXG4gKiByZW1vdmVFdmVudExpc3RlbmVyXG4gKiBAcmV0dXJuIHtvYmplY3R9IGludGVyYWN0XG4gKi9cbmludGVyYWN0Lm9mZiA9IG9mZlxuZnVuY3Rpb24gb2ZmICh0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucykge1xuICBpZiAodXRpbHMuaXMuc3RyaW5nKHR5cGUpICYmIHR5cGUuc2VhcmNoKCcgJykgIT09IC0xKSB7XG4gICAgdHlwZSA9IHR5cGUudHJpbSgpLnNwbGl0KC8gKy8pXG4gIH1cblxuICBpZiAodXRpbHMuaXMuYXJyYXkodHlwZSkpIHtcbiAgICBmb3IgKGNvbnN0IGV2ZW50VHlwZSBvZiB0eXBlKSB7XG4gICAgICBpbnRlcmFjdC5vZmYoZXZlbnRUeXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJhY3RcbiAgfVxuXG4gIGlmICh1dGlscy5pcy5vYmplY3QodHlwZSkpIHtcbiAgICBmb3IgKGNvbnN0IHByb3AgaW4gdHlwZSkge1xuICAgICAgaW50ZXJhY3Qub2ZmKHByb3AsIHR5cGVbcHJvcF0sIGxpc3RlbmVyKVxuICAgIH1cblxuICAgIHJldHVybiBpbnRlcmFjdFxuICB9XG5cbiAgaWYgKCF1dGlscy5hcnIuY29udGFpbnMoc2NvcGUuYWN0aW9ucy5ldmVudFR5cGVzLCB0eXBlKSkge1xuICAgIGV2ZW50cy5yZW1vdmUoc2NvcGUuZG9jdW1lbnQsIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKVxuICB9XG4gIGVsc2Uge1xuICAgIGxldCBpbmRleFxuXG4gICAgaWYgKHR5cGUgaW4gZ2xvYmFsRXZlbnRzICYmXG4gICAgICAgIChpbmRleCA9IGdsb2JhbEV2ZW50c1t0eXBlXS5pbmRleE9mKGxpc3RlbmVyKSkgIT09IC0xKSB7XG4gICAgICBnbG9iYWxFdmVudHNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbnRlcmFjdFxufVxuXG4vKipcbiAqIFJldHVybnMgYW4gb2JqZWN0IHdoaWNoIGV4cG9zZXMgaW50ZXJuYWwgZGF0YVxuICogQGFsaWFzIG1vZHVsZTppbnRlcmFjdC5kZWJ1Z1xuICpcbiAqIEByZXR1cm4ge29iamVjdH0gQW4gb2JqZWN0IHdpdGggcHJvcGVydGllcyB0aGF0IG91dGxpbmUgdGhlIGN1cnJlbnQgc3RhdGVcbiAqIGFuZCBleHBvc2UgaW50ZXJuYWwgZnVuY3Rpb25zIGFuZCB2YXJpYWJsZXNcbiAqL1xuaW50ZXJhY3QuZGVidWcgPSBkZWJ1Z1xuZnVuY3Rpb24gZGVidWcgKCkge1xuICByZXR1cm4gc2NvcGVcbn1cblxuLy8gZXhwb3NlIHRoZSBmdW5jdGlvbnMgdXNlZCB0byBjYWxjdWxhdGUgbXVsdGktdG91Y2ggcHJvcGVydGllc1xuaW50ZXJhY3QuZ2V0UG9pbnRlckF2ZXJhZ2UgID0gdXRpbHMucG9pbnRlci5wb2ludGVyQXZlcmFnZVxuaW50ZXJhY3QuZ2V0VG91Y2hCQm94ICAgICAgID0gdXRpbHMucG9pbnRlci50b3VjaEJCb3hcbmludGVyYWN0LmdldFRvdWNoRGlzdGFuY2UgICA9IHV0aWxzLnBvaW50ZXIudG91Y2hEaXN0YW5jZVxuaW50ZXJhY3QuZ2V0VG91Y2hBbmdsZSAgICAgID0gdXRpbHMucG9pbnRlci50b3VjaEFuZ2xlXG5cbmludGVyYWN0LmdldEVsZW1lbnRSZWN0ICAgICAgID0gdXRpbHMuZG9tLmdldEVsZW1lbnRSZWN0XG5pbnRlcmFjdC5nZXRFbGVtZW50Q2xpZW50UmVjdCA9IHV0aWxzLmRvbS5nZXRFbGVtZW50Q2xpZW50UmVjdFxuaW50ZXJhY3QubWF0Y2hlc1NlbGVjdG9yICAgICAgPSB1dGlscy5kb20ubWF0Y2hlc1NlbGVjdG9yXG5pbnRlcmFjdC5jbG9zZXN0ICAgICAgICAgICAgICA9IHV0aWxzLmRvbS5jbG9zZXN0XG5cbi8qKlxuICogQGFsaWFzIG1vZHVsZTppbnRlcmFjdC5zdXBwb3J0c1RvdWNoXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIGJyb3dzZXIgc3VwcG9ydHMgdG91Y2ggaW5wdXRcbiAqL1xuaW50ZXJhY3Quc3VwcG9ydHNUb3VjaCA9IHN1cHBvcnRzVG91Y2hcbmZ1bmN0aW9uIHN1cHBvcnRzVG91Y2ggKCkge1xuICByZXR1cm4gYnJvd3Nlci5zdXBwb3J0c1RvdWNoXG59XG5cbi8qKlxuICogQGFsaWFzIG1vZHVsZTppbnRlcmFjdC5zdXBwb3J0c1BvaW50ZXJFdmVudFxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgb3Igbm90IHRoZSBicm93c2VyIHN1cHBvcnRzIFBvaW50ZXJFdmVudHNcbiAqL1xuaW50ZXJhY3Quc3VwcG9ydHNQb2ludGVyRXZlbnQgPSBzdXBwb3J0c1BvaW50ZXJFdmVudFxuZnVuY3Rpb24gc3VwcG9ydHNQb2ludGVyRXZlbnQgKCkge1xuICByZXR1cm4gYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudFxufVxuXG4vKipcbiAqIENhbmNlbHMgYWxsIGludGVyYWN0aW9ucyAoZW5kIGV2ZW50cyBhcmUgbm90IGZpcmVkKVxuICpcbiAqIEBhbGlhcyBtb2R1bGU6aW50ZXJhY3Quc3RvcFxuICpcbiAqIEByZXR1cm4ge29iamVjdH0gaW50ZXJhY3RcbiAqL1xuaW50ZXJhY3Quc3RvcCA9IHN0b3BcbmZ1bmN0aW9uIHN0b3AgKCkge1xuICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgaW50ZXJhY3Rpb24uc3RvcCgpXG4gIH1cblxuICByZXR1cm4gaW50ZXJhY3Rcbn1cblxuLyoqXG4gKiBSZXR1cm5zIG9yIHNldHMgdGhlIGRpc3RhbmNlIHRoZSBwb2ludGVyIG11c3QgYmUgbW92ZWQgYmVmb3JlIGFuIGFjdGlvblxuICogc2VxdWVuY2Ugb2NjdXJzLiBUaGlzIGFsc28gYWZmZWN0cyB0b2xlcmFuY2UgZm9yIHRhcCBldmVudHMuXG4gKlxuICogQGFsaWFzIG1vZHVsZTppbnRlcmFjdC5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBbbmV3VmFsdWVdIFRoZSBtb3ZlbWVudCBmcm9tIHRoZSBzdGFydCBwb3NpdGlvbiBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB0aGlzIHZhbHVlXG4gKiBAcmV0dXJuIHtpbnRlcmFjdCB8IG51bWJlcn1cbiAqL1xuaW50ZXJhY3QucG9pbnRlck1vdmVUb2xlcmFuY2UgPSBwb2ludGVyTW92ZVRvbGVyYW5jZVxuZnVuY3Rpb24gcG9pbnRlck1vdmVUb2xlcmFuY2UgKG5ld1ZhbHVlKSB7XG4gIGlmICh1dGlscy5pcy5udW1iZXIobmV3VmFsdWUpKSB7XG4gICAgc2NvcGUuaW50ZXJhY3Rpb25zLnBvaW50ZXJNb3ZlVG9sZXJhbmNlID0gbmV3VmFsdWVcblxuICAgIHJldHVybiBpbnRlcmFjdFxuICB9XG5cbiAgcmV0dXJuIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZVxufVxuXG5zY29wZS5pbnRlcmFjdGFibGVzLnNpZ25hbHMub24oJ3Vuc2V0JywgKHsgaW50ZXJhY3RhYmxlIH0pID0+IHtcbiAgc2NvcGUuaW50ZXJhY3RhYmxlcy5saXN0LnNwbGljZShzY29wZS5pbnRlcmFjdGFibGVzLmxpc3QuaW5kZXhPZihpbnRlcmFjdGFibGUpLCAxKVxuXG4gIC8vIFN0b3AgcmVsYXRlZCBpbnRlcmFjdGlvbnMgd2hlbiBhbiBJbnRlcmFjdGFibGUgaXMgdW5zZXRcbiAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgIGlmIChpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUgPT09IGludGVyYWN0YWJsZSAmJiBpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpICYmIGludGVyYWN0aW9uLl9lbmRpbmcpIHtcbiAgICAgIGludGVyYWN0aW9uLnN0b3AoKVxuICAgIH1cbiAgfVxufSlcblxuaW50ZXJhY3QuYWRkRG9jdW1lbnQgPSAoZG9jLCBvcHRpb25zKSA9PiBzY29wZS5hZGREb2N1bWVudChkb2MsIG9wdGlvbnMpXG5pbnRlcmFjdC5yZW1vdmVEb2N1bWVudCA9IChkb2MpID0+IHNjb3BlLnJlbW92ZURvY3VtZW50KGRvYylcblxuc2NvcGUuaW50ZXJhY3QgPSBpbnRlcmFjdFxuXG5leHBvcnQgeyBzY29wZSB9XG5leHBvcnQgZGVmYXVsdCBpbnRlcmFjdFxuIl19