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
} 