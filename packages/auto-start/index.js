import autoStart from './base';
import dragAxis from './dragAxis';
import hold from './hold';
function install(scope) {
    autoStart.install(scope);
    hold.install(scope);
    dragAxis.install(scope);
}
const id = 'auto-start';
export { id, install, autoStart, hold, dragAxis, };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVMsTUFBTSxRQUFRLENBQUE7QUFDOUIsT0FBTyxRQUFRLE1BQU0sWUFBWSxDQUFBO0FBQ2pDLE9BQU8sSUFBSSxNQUFNLFFBQVEsQ0FBQTtBQUV6QixTQUFTLE9BQU8sQ0FBRSxLQUFLO0lBQ3JCLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNuQixRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3pCLENBQUM7QUFFRCxNQUFNLEVBQUUsR0FBRyxZQUFZLENBQUE7QUFFdkIsT0FBTyxFQUNMLEVBQUUsRUFDRixPQUFPLEVBQ1AsU0FBUyxFQUNULElBQUksRUFDSixRQUFRLEdBQ1QsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhdXRvU3RhcnQgZnJvbSAnLi9iYXNlJ1xuaW1wb3J0IGRyYWdBeGlzIGZyb20gJy4vZHJhZ0F4aXMnXG5pbXBvcnQgaG9sZCBmcm9tICcuL2hvbGQnXG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlKSB7XG4gIGF1dG9TdGFydC5pbnN0YWxsKHNjb3BlKVxuICBob2xkLmluc3RhbGwoc2NvcGUpXG4gIGRyYWdBeGlzLmluc3RhbGwoc2NvcGUpXG59XG5cbmNvbnN0IGlkID0gJ2F1dG8tc3RhcnQnXG5cbmV4cG9ydCB7XG4gIGlkLFxuICBpbnN0YWxsLFxuICBhdXRvU3RhcnQsXG4gIGhvbGQsXG4gIGRyYWdBeGlzLFxufVxuIl19