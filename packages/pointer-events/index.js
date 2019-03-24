import pointerEvents from './base';
import holdRepeat from './holdRepeat';
import interactableTargets from './interactableTargets';
function install(scope) {
    pointerEvents.install(scope);
    holdRepeat.install(scope);
    interactableTargets.install(scope);
}
const id = 'pointer-events';
export { id, pointerEvents, holdRepeat, interactableTargets, install };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLGFBQWEsTUFBTSxRQUFRLENBQUE7QUFDbEMsT0FBTyxVQUFVLE1BQU0sY0FBYyxDQUFBO0FBQ3JDLE9BQU8sbUJBQW1CLE1BQU0sdUJBQXVCLENBQUE7QUFFdkQsU0FBUyxPQUFPLENBQUUsS0FBSztJQUNyQixhQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzVCLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDekIsbUJBQW1CLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3BDLENBQUM7QUFFRCxNQUFNLEVBQUUsR0FBRyxnQkFBZ0IsQ0FBQTtBQUUzQixPQUFPLEVBQUUsRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxFQUFFLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcG9pbnRlckV2ZW50cyBmcm9tICcuL2Jhc2UnXG5pbXBvcnQgaG9sZFJlcGVhdCBmcm9tICcuL2hvbGRSZXBlYXQnXG5pbXBvcnQgaW50ZXJhY3RhYmxlVGFyZ2V0cyBmcm9tICcuL2ludGVyYWN0YWJsZVRhcmdldHMnXG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlKSB7XG4gIHBvaW50ZXJFdmVudHMuaW5zdGFsbChzY29wZSlcbiAgaG9sZFJlcGVhdC5pbnN0YWxsKHNjb3BlKVxuICBpbnRlcmFjdGFibGVUYXJnZXRzLmluc3RhbGwoc2NvcGUpXG59XG5cbmNvbnN0IGlkID0gJ3BvaW50ZXItZXZlbnRzJ1xuXG5leHBvcnQgeyBpZCwgcG9pbnRlckV2ZW50cywgaG9sZFJlcGVhdCwgaW50ZXJhY3RhYmxlVGFyZ2V0cywgaW5zdGFsbCB9XG4iXX0=