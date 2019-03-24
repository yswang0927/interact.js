import * as utils from '@interactjs/utils';
import PointerEvent from './PointerEvent';
const signals = new utils.Signals();
const simpleSignals = ['down', 'up', 'cancel'];
const simpleEvents = ['down', 'up', 'cancel'];
const pointerEvents = {
    id: 'pointer-events/base',
    install,
    signals,
    PointerEvent,
    fire,
    collectEventTargets,
    createSignalListener,
    defaults: {
        holdDuration: 600,
        ignoreFrom: null,
        allowFrom: null,
        origin: { x: 0, y: 0 },
    },
    types: [
        'down',
        'move',
        'up',
        'cancel',
        'tap',
        'doubletap',
        'hold',
    ],
};
function fire(arg) {
    const { interaction, pointer, event, eventTarget, type = arg.pointerEvent.type, targets = collectEventTargets(arg), } = arg;
    const { pointerEvent = new PointerEvent(type, pointer, event, eventTarget, interaction), } = arg;
    const signalArg = {
        interaction,
        pointer,
        event,
        eventTarget,
        targets,
        type,
        pointerEvent,
    };
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        for (const prop in target.props || {}) {
            pointerEvent[prop] = target.props[prop];
        }
        const origin = utils.getOriginXY(target.eventable, target.element);
        pointerEvent.subtractOrigin(origin);
        pointerEvent.eventable = target.eventable;
        pointerEvent.currentTarget = target.element;
        target.eventable.fire(pointerEvent);
        pointerEvent.addOrigin(origin);
        if (pointerEvent.immediatePropagationStopped ||
            (pointerEvent.propagationStopped &&
                (i + 1) < targets.length && targets[i + 1].element !== pointerEvent.currentTarget)) {
            break;
        }
    }
    signals.fire('fired', signalArg);
    if (type === 'tap') {
        // if pointerEvent should make a double tap, create and fire a doubletap
        // PointerEvent and use that as the prevTap
        const prevTap = pointerEvent.double
            ? fire({
                interaction,
                pointer,
                event,
                eventTarget,
                type: 'doubletap',
            })
            : pointerEvent;
        interaction.prevTap = prevTap;
        interaction.tapTime = prevTap.timeStamp;
    }
    return pointerEvent;
}
function collectEventTargets({ interaction, pointer, event, eventTarget, type }) {
    const pointerIndex = interaction.getPointerIndex(pointer);
    const pointerInfo = interaction.pointers[pointerIndex];
    // do not fire a tap event if the pointer was moved before being lifted
    if (type === 'tap' && (interaction.pointerWasMoved ||
        // or if the pointerup target is different to the pointerdown target
        !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
        return [];
    }
    const path = utils.dom.getPath(eventTarget);
    const signalArg = {
        interaction,
        pointer,
        event,
        eventTarget,
        type,
        path,
        targets: [],
        element: null,
    };
    for (const element of path) {
        signalArg.element = element;
        signals.fire('collect-targets', signalArg);
    }
    if (type === 'hold') {
        signalArg.targets = signalArg.targets.filter((target) => target.eventable.options.holdDuration === interaction.pointers[pointerIndex].hold.duration);
    }
    return signalArg.targets;
}
function install(scope) {
    const { interactions, } = scope;
    scope.pointerEvents = pointerEvents;
    scope.defaults.actions.pointerEvents = pointerEvents.defaults;
    interactions.signals.on('new', ({ interaction }) => {
        interaction.prevTap = null; // the most recent tap event on this interaction
        interaction.tapTime = 0; // time of the most recent tap event
    });
    interactions.signals.on('update-pointer', ({ down, pointerInfo }) => {
        if (!down && pointerInfo.hold) {
            return;
        }
        pointerInfo.hold = { duration: Infinity, timeout: null };
    });
    interactions.signals.on('move', ({ interaction, pointer, event, eventTarget, duplicateMove }) => {
        const pointerIndex = interaction.getPointerIndex(pointer);
        if (!duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
            if (interaction.pointerIsDown) {
                clearTimeout(interaction.pointers[pointerIndex].hold.timeout);
            }
            fire({
                interaction,
                pointer,
                event,
                eventTarget,
                type: 'move',
            });
        }
    });
    interactions.signals.on('down', ({ interaction, pointer, event, eventTarget, pointerIndex }) => {
        const timer = interaction.pointers[pointerIndex].hold;
        const path = utils.dom.getPath(eventTarget);
        const signalArg = {
            interaction,
            pointer,
            event,
            eventTarget,
            type: 'hold',
            targets: [],
            path,
            element: null,
        };
        for (const element of path) {
            signalArg.element = element;
            signals.fire('collect-targets', signalArg);
        }
        if (!signalArg.targets.length) {
            return;
        }
        let minDuration = Infinity;
        for (const target of signalArg.targets) {
            const holdDuration = target.eventable.options.holdDuration;
            if (holdDuration < minDuration) {
                minDuration = holdDuration;
            }
        }
        timer.duration = minDuration;
        timer.timeout = setTimeout(() => {
            fire({
                interaction,
                eventTarget,
                pointer,
                event,
                type: 'hold',
            });
        }, minDuration);
    });
    for (const signalName of ['up', 'cancel']) {
        interactions.signals.on(signalName, ({ interaction, pointerIndex }) => {
            if (interaction.pointers[pointerIndex].hold) {
                clearTimeout(interaction.pointers[pointerIndex].hold.timeout);
            }
        });
    }
    for (let i = 0; i < simpleSignals.length; i++) {
        interactions.signals.on(simpleSignals[i], createSignalListener(simpleEvents[i]));
    }
    interactions.signals.on('up', ({ interaction, pointer, event, eventTarget }) => {
        if (!interaction.pointerWasMoved) {
            fire({ interaction, eventTarget, pointer, event, type: 'tap' });
        }
    });
}
function createSignalListener(type) {
    return function ({ interaction, pointer, event, eventTarget }) {
        fire({ interaction, eventTarget, pointer, event, type });
    };
}
export default pointerEvents;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsT0FBTyxLQUFLLEtBQUssTUFBTSxtQkFBbUIsQ0FBQTtBQUMxQyxPQUFPLFlBQVksTUFBTSxnQkFBZ0IsQ0FBQTtBQW9DekMsTUFBTSxPQUFPLEdBQVMsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDekMsTUFBTSxhQUFhLEdBQUcsQ0FBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBRSxDQUFBO0FBQ2hELE1BQU0sWUFBWSxHQUFJLENBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUUsQ0FBQTtBQUVoRCxNQUFNLGFBQWEsR0FBRztJQUNwQixFQUFFLEVBQUUscUJBQXFCO0lBQ3pCLE9BQU87SUFDUCxPQUFPO0lBQ1AsWUFBWTtJQUNaLElBQUk7SUFDSixtQkFBbUI7SUFDbkIsb0JBQW9CO0lBQ3BCLFFBQVEsRUFBRTtRQUNSLFlBQVksRUFBRSxHQUFHO1FBQ2pCLFVBQVUsRUFBSSxJQUFJO1FBQ2xCLFNBQVMsRUFBSyxJQUFJO1FBQ2xCLE1BQU0sRUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtLQUM3QjtJQUNELEtBQUssRUFBRTtRQUNMLE1BQU07UUFDTixNQUFNO1FBQ04sSUFBSTtRQUNKLFFBQVE7UUFDUixLQUFLO1FBQ0wsV0FBVztRQUNYLE1BQU07S0FDUDtDQUNGLENBQUE7QUFFRCxTQUFTLElBQUksQ0FBb0IsR0FRaEM7SUFDQyxNQUFNLEVBQ0osV0FBVyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUN4QyxJQUFJLEdBQUksR0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQ3JDLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsR0FDbkMsR0FBRyxHQUFHLENBQUE7SUFFUCxNQUFNLEVBQ0osWUFBWSxHQUFHLElBQUksWUFB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RXZlbnRhYmxlIGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvRXZlbnRhYmxlJ1xuaW1wb3J0IEludGVyYWN0aW9uIGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCBQb2ludGVyRXZlbnQgZnJvbSAnLi9Qb2ludGVyRXZlbnQnXG5cbnR5cGUgRXZlbnRUYXJnZXRMaXN0ID0gQXJyYXk8e1xuICBldmVudGFibGU6IEV2ZW50YWJsZSxcbiAgZWxlbWVudDogSW50ZXJhY3QuRXZlbnRUYXJnZXQsXG4gIHByb3BzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9LFxufT5cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnIHtcbiAgaW50ZXJmYWNlIFNjb3BlIHtcbiAgICBwb2ludGVyRXZlbnRzOiB0eXBlb2YgcG9pbnRlckV2ZW50c1xuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGlvbiB7XG4gICAgcHJldlRhcD86IFBvaW50ZXJFdmVudDxzdHJpbmc+XG4gICAgdGFwVGltZT86IG51bWJlclxuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL1BvaW50ZXJJbmZvJyB7XG4gIGludGVyZmFjZSBQb2ludGVySW5mbyB7XG4gICAgaG9sZD86IHtcbiAgICAgIGR1cmF0aW9uOiBudW1iZXJcbiAgICAgIHRpbWVvdXQ6IGFueVxuICAgIH1cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9kZWZhdWx0T3B0aW9ucycge1xuICBpbnRlcmZhY2UgQWN0aW9uRGVmYXVsdHMge1xuICAgIHBvaW50ZXJFdmVudHM6IEludGVyYWN0Lk9wdGlvbnNcbiAgfVxufVxuXG5jb25zdCBzaWduYWxzICAgICAgID0gbmV3IHV0aWxzLlNpZ25hbHMoKVxuY29uc3Qgc2ltcGxlU2lnbmFscyA9IFsgJ2Rvd24nLCAndXAnLCAnY2FuY2VsJyBdXG5jb25zdCBzaW1wbGVFdmVudHMgID0gWyAnZG93bicsICd1cCcsICdjYW5jZWwnIF1cblxuY29uc3QgcG9pbnRlckV2ZW50cyA9IHtcbiAgaWQ6ICdwb2ludGVyLWV2ZW50cy9iYXNlJyxcbiAgaW5zdGFsbCxcbiAgc2lnbmFscyxcbiAgUG9pbnRlckV2ZW50LFxuICBmaXJlLFxuICBjb2xsZWN0RXZlbnRUYXJnZXRzLFxuICBjcmVhdGVTaWduYWxMaXN0ZW5lcixcbiAgZGVmYXVsdHM6IHtcbiAgICBob2xkRHVyYXRpb246IDYwMCxcbiAgICBpZ25vcmVGcm9tICA6IG51bGwsXG4gICAgYWxsb3dGcm9tICAgOiBudWxsLFxuICAgIG9yaWdpbiAgICAgIDogeyB4OiAwLCB5OiAwIH0sXG4gIH0sXG4gIHR5cGVzOiBbXG4gICAgJ2Rvd24nLFxuICAgICdtb3ZlJyxcbiAgICAndXAnLFxuICAgICdjYW5jZWwnLFxuICAgICd0YXAnLFxuICAgICdkb3VibGV0YXAnLFxuICAgICdob2xkJyxcbiAgXSxcbn1cblxuZnVuY3Rpb24gZmlyZTxUIGV4dGVuZHMgc3RyaW5nPiAoYXJnOiB7XG4gIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbixcbiAgcG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsXG4gIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLFxuICBldmVudFRhcmdldDogRXZlbnRUYXJnZXQsXG4gIHRhcmdldHM/OiBFdmVudFRhcmdldExpc3QsXG4gIHBvaW50ZXJFdmVudD86IFBvaW50ZXJFdmVudDxUPixcbiAgdHlwZTogVFxufSkge1xuICBjb25zdCB7XG4gICAgaW50ZXJhY3Rpb24sIHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCxcbiAgICB0eXBlID0gKGFyZyBhcyBhbnkpLnBvaW50ZXJFdmVudC50eXBlLFxuICAgIHRhcmdldHMgPSBjb2xsZWN0RXZlbnRUYXJnZXRzKGFyZyksXG4gIH0gPSBhcmdcblxuICBjb25zdCB7XG4gICAgcG9pbnRlckV2ZW50ID0gbmV3IFBvaW50ZXJFdmVudCh0eXBlLCBwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGludGVyYWN0aW9uKSxcbiAgfSA9IGFyZ1xuXG4gIGNvbnN0IHNpZ25hbEFyZyA9IHtcbiAgICBpbnRlcmFjdGlvbixcbiAgICBwb2ludGVyLFxuICAgIGV2ZW50LFxuICAgIGV2ZW50VGFyZ2V0LFxuICAgIHRhcmdldHMsXG4gICAgdHlwZSxcbiAgICBwb2ludGVyRXZlbnQsXG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRhcmdldHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0YXJnZXQgPSB0YXJnZXRzW2ldXG5cbiAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGFyZ2V0LnByb3BzIHx8IHt9KSB7XG4gICAgICAocG9pbnRlckV2ZW50IGFzIGFueSlbcHJvcF0gPSB0YXJnZXQucHJvcHNbcHJvcF1cbiAgICB9XG5cbiAgICBjb25zdCBvcmlnaW4gPSB1dGlscy5nZXRPcmlnaW5YWSh0YXJnZXQuZXZlbnRhYmxlLCB0YXJnZXQuZWxlbWVudClcblxuICAgIHBvaW50ZXJFdmVudC5zdWJ0cmFjdE9yaWdpbihvcmlnaW4pXG4gICAgcG9pbnRlckV2ZW50LmV2ZW50YWJsZSA9IHRhcmdldC5ldmVudGFibGVcbiAgICBwb2ludGVyRXZlbnQuY3VycmVudFRhcmdldCA9IHRhcmdldC5lbGVtZW50XG5cbiAgICB0YXJnZXQuZXZlbnRhYmxlLmZpcmUocG9pbnRlckV2ZW50KVxuXG4gICAgcG9pbnRlckV2ZW50LmFkZE9yaWdpbihvcmlnaW4pXG5cbiAgICBpZiAocG9pbnRlckV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCB8fFxuICAgICAgICAocG9pbnRlckV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCAmJlxuICAgICAgICAgICAgKGkgKyAxKSA8IHRhcmdldHMubGVuZ3RoICYmIHRhcmdldHNbaSArIDFdLmVsZW1lbnQgIT09IHBvaW50ZXJFdmVudC5jdXJyZW50VGFyZ2V0KSkge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBzaWduYWxzLmZpcmUoJ2ZpcmVkJywgc2lnbmFsQXJnKVxuXG4gIGlmICh0eXBlID09PSAndGFwJykge1xuICAgIC8vIGlmIHBvaW50ZXJFdmVudCBzaG91bGQgbWFrZSBhIGRvdWJsZSB0YXAsIGNyZWF0ZSBhbmQgZmlyZSBhIGRvdWJsZXRhcFxuICAgIC8vIFBvaW50ZXJFdmVudCBhbmQgdXNlIHRoYXQgYXMgdGhlIHByZXZUYXBcbiAgICBjb25zdCBwcmV2VGFwID0gcG9pbnRlckV2ZW50LmRvdWJsZVxuICAgICAgPyBmaXJlKHtcbiAgICAgICAgaW50ZXJhY3Rpb24sXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBldmVudFRhcmdldCxcbiAgICAgICAgdHlwZTogJ2RvdWJsZXRhcCcsXG4gICAgICB9KVxuICAgICAgOiBwb2ludGVyRXZlbnRcblxuICAgIGludGVyYWN0aW9uLnByZXZUYXAgPSBwcmV2VGFwXG4gICAgaW50ZXJhY3Rpb24udGFwVGltZSA9IHByZXZUYXAudGltZVN0YW1wXG4gIH1cblxuICByZXR1cm4gcG9pbnRlckV2ZW50XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RFdmVudFRhcmdldHM8VCBleHRlbmRzIHN0cmluZz4gKHsgaW50ZXJhY3Rpb24sIHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgdHlwZSB9OiB7XG4gIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbixcbiAgcG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsXG4gIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLFxuICBldmVudFRhcmdldDogRXZlbnRUYXJnZXQsXG4gIHR5cGU6IFRcbn0pIHtcbiAgY29uc3QgcG9pbnRlckluZGV4ID0gaW50ZXJhY3Rpb24uZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG4gIGNvbnN0IHBvaW50ZXJJbmZvID0gaW50ZXJhY3Rpb24ucG9pbnRlcnNbcG9pbnRlckluZGV4XVxuXG4gIC8vIGRvIG5vdCBmaXJlIGEgdGFwIGV2ZW50IGlmIHRoZSBwb2ludGVyIHdhcyBtb3ZlZCBiZWZvcmUgYmVpbmcgbGlmdGVkXG4gIGlmICh0eXBlID09PSAndGFwJyAmJiAoaW50ZXJhY3Rpb24ucG9pbnRlcldhc01vdmVkIHx8XG4gICAgICAvLyBvciBpZiB0aGUgcG9pbnRlcnVwIHRhcmdldCBpcyBkaWZmZXJlbnQgdG8gdGhlIHBvaW50ZXJkb3duIHRhcmdldFxuICAgICAgIShwb2ludGVySW5mbyAmJiBwb2ludGVySW5mby5kb3duVGFyZ2V0ID09PSBldmVudFRhcmdldCkpKSB7XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICBjb25zdCBwYXRoID0gdXRpbHMuZG9tLmdldFBhdGgoZXZlbnRUYXJnZXQpXG4gIGNvbnN0IHNpZ25hbEFyZyA9IHtcbiAgICBpbnRlcmFjdGlvbixcbiAgICBwb2ludGVyLFxuICAgIGV2ZW50LFxuICAgIGV2ZW50VGFyZ2V0LFxuICAgIHR5cGUsXG4gICAgcGF0aCxcbiAgICB0YXJnZXRzOiBbXSBhcyBFdmVudFRhcmdldExpc3QsXG4gICAgZWxlbWVudDogbnVsbCxcbiAgfVxuXG4gIGZvciAoY29uc3QgZWxlbWVudCBvZiBwYXRoKSB7XG4gICAgc2lnbmFsQXJnLmVsZW1lbnQgPSBlbGVtZW50XG5cbiAgICBzaWduYWxzLmZpcmUoJ2NvbGxlY3QtdGFyZ2V0cycsIHNpZ25hbEFyZylcbiAgfVxuXG4gIGlmICh0eXBlID09PSAnaG9sZCcpIHtcbiAgICBzaWduYWxBcmcudGFyZ2V0cyA9IHNpZ25hbEFyZy50YXJnZXRzLmZpbHRlcigodGFyZ2V0KSA9PlxuICAgICAgdGFyZ2V0LmV2ZW50YWJsZS5vcHRpb25zLmhvbGREdXJhdGlvbiA9PT0gaW50ZXJhY3Rpb24ucG9pbnRlcnNbcG9pbnRlckluZGV4XS5ob2xkLmR1cmF0aW9uKVxuICB9XG5cbiAgcmV0dXJuIHNpZ25hbEFyZy50YXJnZXRzXG59XG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBjb25zdCB7XG4gICAgaW50ZXJhY3Rpb25zLFxuICB9ID0gc2NvcGVcblxuICBzY29wZS5wb2ludGVyRXZlbnRzID0gcG9pbnRlckV2ZW50c1xuICBzY29wZS5kZWZhdWx0cy5hY3Rpb25zLnBvaW50ZXJFdmVudHMgPSBwb2ludGVyRXZlbnRzLmRlZmF1bHRzXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ25ldycsICh7IGludGVyYWN0aW9uIH0pID0+IHtcbiAgICBpbnRlcmFjdGlvbi5wcmV2VGFwICAgID0gbnVsbCAgLy8gdGhlIG1vc3QgcmVjZW50IHRhcCBldmVudCBvbiB0aGlzIGludGVyYWN0aW9uXG4gICAgaW50ZXJhY3Rpb24udGFwVGltZSAgICA9IDAgICAgIC8vIHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRhcCBldmVudFxuICB9KVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCd1cGRhdGUtcG9pbnRlcicsICh7IGRvd24sIHBvaW50ZXJJbmZvIH0pID0+IHtcbiAgICBpZiAoIWRvd24gJiYgcG9pbnRlckluZm8uaG9sZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgcG9pbnRlckluZm8uaG9sZCA9IHsgZHVyYXRpb246IEluZmluaXR5LCB0aW1lb3V0OiBudWxsIH1cbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignbW92ZScsICh7IGludGVyYWN0aW9uLCBwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGR1cGxpY2F0ZU1vdmUgfSkgPT4ge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IGludGVyYWN0aW9uLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuXG4gICAgaWYgKCFkdXBsaWNhdGVNb3ZlICYmICghaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93biB8fCBpbnRlcmFjdGlvbi5wb2ludGVyV2FzTW92ZWQpKSB7XG4gICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93bikge1xuICAgICAgICBjbGVhclRpbWVvdXQoaW50ZXJhY3Rpb24ucG9pbnRlcnNbcG9pbnRlckluZGV4XS5ob2xkLnRpbWVvdXQpXG4gICAgICB9XG5cbiAgICAgIGZpcmUoe1xuICAgICAgICBpbnRlcmFjdGlvbixcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgICB0eXBlOiAnbW92ZScsXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignZG93bicsICh7IGludGVyYWN0aW9uLCBwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHBvaW50ZXJJbmRleCB9KSA9PiB7XG4gICAgY29uc3QgdGltZXIgPSBpbnRlcmFjdGlvbi5wb2ludGVyc1twb2ludGVySW5kZXhdLmhvbGRcbiAgICBjb25zdCBwYXRoID0gdXRpbHMuZG9tLmdldFBhdGgoZXZlbnRUYXJnZXQpXG4gICAgY29uc3Qgc2lnbmFsQXJnID0ge1xuICAgICAgaW50ZXJhY3Rpb24sXG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIHR5cGU6ICdob2xkJyxcbiAgICAgIHRhcmdldHM6IFtdIGFzIEV2ZW50VGFyZ2V0TGlzdCxcbiAgICAgIHBhdGgsXG4gICAgICBlbGVtZW50OiBudWxsLFxuICAgIH1cblxuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBwYXRoKSB7XG4gICAgICBzaWduYWxBcmcuZWxlbWVudCA9IGVsZW1lbnRcblxuICAgICAgc2lnbmFscy5maXJlKCdjb2xsZWN0LXRhcmdldHMnLCBzaWduYWxBcmcpXG4gICAgfVxuXG4gICAgaWYgKCFzaWduYWxBcmcudGFyZ2V0cy5sZW5ndGgpIHsgcmV0dXJuIH1cblxuICAgIGxldCBtaW5EdXJhdGlvbiA9IEluZmluaXR5XG5cbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBzaWduYWxBcmcudGFyZ2V0cykge1xuICAgICAgY29uc3QgaG9sZER1cmF0aW9uID0gdGFyZ2V0LmV2ZW50YWJsZS5vcHRpb25zLmhvbGREdXJhdGlvblxuXG4gICAgICBpZiAoaG9sZER1cmF0aW9uIDwgbWluRHVyYXRpb24pIHtcbiAgICAgICAgbWluRHVyYXRpb24gPSBob2xkRHVyYXRpb25cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aW1lci5kdXJhdGlvbiA9IG1pbkR1cmF0aW9uXG4gICAgdGltZXIudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZmlyZSh7XG4gICAgICAgIGludGVyYWN0aW9uLFxuICAgICAgICBldmVudFRhcmdldCxcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIHR5cGU6ICdob2xkJyxcbiAgICAgIH0pXG4gICAgfSwgbWluRHVyYXRpb24pXG4gIH0pXG5cbiAgZm9yIChjb25zdCBzaWduYWxOYW1lIG9mIFsndXAnLCAnY2FuY2VsJ10pIHtcbiAgICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbihzaWduYWxOYW1lLCAoeyBpbnRlcmFjdGlvbiwgcG9pbnRlckluZGV4IH0pID0+IHtcbiAgICAgIGlmIChpbnRlcmFjdGlvbi5wb2ludGVyc1twb2ludGVySW5kZXhdLmhvbGQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGludGVyYWN0aW9uLnBvaW50ZXJzW3BvaW50ZXJJbmRleF0uaG9sZC50aW1lb3V0KVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNpbXBsZVNpZ25hbHMubGVuZ3RoOyBpKyspIHtcbiAgICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbihzaW1wbGVTaWduYWxzW2ldLCBjcmVhdGVTaWduYWxMaXN0ZW5lcihzaW1wbGVFdmVudHNbaV0pKVxuICB9XG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ3VwJywgKHsgaW50ZXJhY3Rpb24sIHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCB9KSA9PiB7XG4gICAgaWYgKCFpbnRlcmFjdGlvbi5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgIGZpcmUoeyBpbnRlcmFjdGlvbiwgZXZlbnRUYXJnZXQsIHBvaW50ZXIsIGV2ZW50LCB0eXBlOiAndGFwJyB9KVxuICAgIH1cbiAgfSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2lnbmFsTGlzdGVuZXIgKHR5cGU6IHN0cmluZykge1xuICByZXR1cm4gZnVuY3Rpb24gKHsgaW50ZXJhY3Rpb24sIHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCB9OiBhbnkpIHtcbiAgICBmaXJlKHsgaW50ZXJhY3Rpb24sIGV2ZW50VGFyZ2V0LCBwb2ludGVyLCBldmVudCwgdHlwZSB9KVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHBvaW50ZXJFdmVudHNcbiJdfQ==