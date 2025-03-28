import { FlippingState } from "../Flip/Flip";

/**
 * Data structure for the changeState event
 * Contains information about the current and target spreads during page transitions
 */
export interface StateChangeEventData {
    /** Current state of the flipping process */
    state: FlippingState;
    
    /** Previous state before this state change */
    previousState: FlippingState;
    
    /** Index of the currently active page */
    currentPageIndex: number;
    
    /** Index of the currently visible spread */
    currentSpreadIndex: number;
    
    /** Array of page indexes visible in the current spread */
    currentPageIndexes: number[];
    
    /** Index of the target spread during transitions */
    targetSpreadIndex: number;
    
    /** Array of page indexes visible in the target spread */
    targetPageIndexes: number[];
    
    /** 
     * The progress ratio of the page flip (0.0 to 1.0).
     * - 0.0: No progress (just starting the flip)
     * - 1.0: Completed flip
     * - For animations, this updates continuously during the animation
     * - For corner hover, behavior is determined by reportHoverProgress setting
     */
    flipProgressRatio: number;
    
    /**
     * Indicates whether this event represents an actual state change.
     * - true: The state has changed from the previous state
     * - false: Only the progress has been updated, the state remains the same
     * 
     * This is useful for filtering events when you only want to respond to
     * actual state transitions rather than continuous progress updates.
     */
    stateDidChange: boolean;
} 