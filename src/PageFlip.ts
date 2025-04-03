import { PageRect, Point } from './BasicTypes';
import { HTMLPageCollection } from './Collection/HTMLPageCollection';
import { PageCollection } from './Collection/PageCollection';
import { EventObject } from './Event/EventObject';
import { StateChangeEventData } from './Event/StateChangeEvent';
import { Flip, FlipCorner, FlippingState } from './Flip/Flip';
import { Helper } from './Helper';
import { Page } from './Page/Page';
import { HTMLRender } from './Render/HTMLRender';
import { Orientation, Render } from './Render/Render';
import { FlipSetting, Settings } from './Settings';
import { HTMLUI } from './UI/HTMLUI';
import { UI } from './UI/UI';

/**
 * Class representing a main PageFlip object
 *
 * @extends EventObject
 */
export class PageFlip extends EventObject {
    private mousePosition: Point;
    private isUserTouch = false;
    private isUserMove = false;
    private interactiveMode = true; // Add a flag to track interactive mode
    private flipHintTimer: number = null; // Timer for flip hint animation
    private lastInteractionTime = 0; // Track last user interaction time
    private cooldownUntil = 0; // Track cooldown period end time
    private animationFrameId: number = null; // Track animation frame ID for cancellation

    private readonly setting: FlipSetting = null;
    private readonly block: HTMLElement; // Root HTML Element

    private pages: PageCollection = null;
    private flipController: Flip;
    private render: Render;

    private ui: UI;
    
    // For tracking state changes
    private previousState: FlippingState = FlippingState.READ;

    /**
     * Create a new PageFlip instance
     *
     * @constructor
     * @param {HTMLElement} inBlock - Root HTML Element
     * @param {Object} setting - Configuration object
     */
    constructor(inBlock: HTMLElement, setting: Partial<FlipSetting>) {
        super();

        this.setting = new Settings().getSettings(setting);
        this.block = inBlock;
        
        // Initialize last interaction time to now
        this.lastInteractionTime = Date.now();
    }

    /**
     * Destructor. Remove a root HTML element and all event handlers
     */
    public destroy(): void {
        this.ui.destroy();
        this.block.remove();
        
        // Clear any active hint timer and animation
        this.clearFlipHintTimer();
        this.cancelHintAnimation();
    }
    
    /**
     * Clear the flip hint timer if it exists
     */
    private clearFlipHintTimer(): void {
        if (this.flipHintTimer !== null) {
            clearTimeout(this.flipHintTimer);
            this.flipHintTimer = null;
        }
    }
    
    /**
     * Cancel any running hint animation
     */
    private cancelHintAnimation(): void {
        // Cancel the animation frame if it exists
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            
            // Hide the corner fold
            this.flipController.showCorner({ x: -100, y: -100 });
        }
    }
    
    /**
     * Setup or restart the page flip hint timer
     */
    private setupFlipHintTimer(): void {
        // Only proceed if hints are enabled and we're in landscape mode
        if (!this.setting.showFlipHint) {
            return;
        }
        
        if (this.render.getOrientation() !== Orientation.LANDSCAPE) {
            return;
        }
        
        // Only show hints when in read state
        if (this.getState() !== FlippingState.READ) {
            // Important: Set up a check to try again when we return to READ state
            // This ensures hints restart after page turns or user interactions
            setTimeout(() => {
                if (this.getState() === FlippingState.READ) {
                    this.setupFlipHintTimer();
                } else {
                    // If still not in READ state, try again later
                    this.setupFlipHintTimer();
                }
            }, 1000); // Check again in 1 second
            
            return;
        }
        
        // Check if we're in cooldown period
        const now = Date.now();
        if (now < this.cooldownUntil) {
            const remainingCooldown = this.cooldownUntil - now;
            
            // Only set a new timer if there isn't one already
            if (this.flipHintTimer === null) {
                // Schedule timer to restart after cooldown ends
                this.flipHintTimer = window.setTimeout(() => {
                    this.setupFlipHintTimer();
                }, remainingCooldown);
            }
            
            return;
        }
        
        // Now we're actually going to set a new timer, so clear any existing one
        this.clearFlipHintTimer();
        
        // Get the hint interval (default to 5 seconds if not set)
        const interval = this.setting.flipHintInterval || 5000;
        
        // Set up the timer
        this.flipHintTimer = window.setTimeout(() => {
            // Only show hint if enough time has passed since last interaction
            const timeSinceLastInteraction = Date.now() - this.lastInteractionTime;
            
            if (timeSinceLastInteraction < interval) {
                // Not enough idle time has passed, reschedule
                this.setupFlipHintTimer();
                return;
            }
            
            // Make sure we're still in READ state before showing hint
            if (this.getState() === FlippingState.READ) {
                // Show the hint animation
                this.showFlipHint();
            }
            
            // Always reschedule the next hint, even if we didn't show one this time
            // This ensures the timer continues working
            this.setupFlipHintTimer();
        }, interval);
    }
    
    /**
     * Display the page flip hint animation
     */
    private showFlipHint(): void {
        // Only cancel existing animation if one is actually running
        // This avoids creating an unnecessary cancellation point
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Only proceed if we're in the READ state
        if (this.getState() !== FlippingState.READ) {
            return;
        }
        
        // Only show the hint if we're in landscape mode with multiple pages
        if (this.render.getOrientation() !== Orientation.LANDSCAPE) {
            return;
        }
        
        // We need to find the rightmost page in the current spread
        const currentSpreadIndex = this.pages.getCurrentSpreadIndex();
        const pageIndexes = this.getPageIndexesForSpread(currentSpreadIndex);
        
        // In landscape mode with multiple pages per spread, we want the rightmost page
        if (pageIndexes.length <= 1) {
            return; // No hint for single-page spreads
        }
        
        // Get the rightmost page's index (the highest index)
        const rightPageIndex = Math.max(...pageIndexes);
        
        // Only show hint if this isn't the last page
        if (rightPageIndex >= this.getPageCount() - 1) {
            return; // No hint for the last page
        }
        
        // Get the book dimensions to calculate corner position
        const rect = this.getBoundsRect();
        
        // Initial position - this is the corner of the page
        const cornerPos: Point = {
            x: rect.pageWidth * 2 - 10, // 10px from the right edge of the right page
            y: rect.height - 10 // 10px from the bottom edge
        };
        
        // Maximum fold depth - make this much deeper (now 150px)
        const maxFoldDepth = 150;
        
        // Animation durations
        const foldInDuration = 600;  // ms to fold in
        const holdDuration = 800;    // ms to hold at maximum
        const foldOutDuration = 600; // ms to fold out
        
        // EaseInOut function to make animation smooth
        const easeInOut = (t: number): number => {
            return t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        // Store animation start time
        const startTime = performance.now();
        let animationPhase = 0; // 0: fold in, 1: hold, 2: fold out, 3: done
        
        // Animation function using requestAnimationFrame for smooth animation
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            
            // Determine which phase of the animation we're in
            if (animationPhase === 0 && elapsed >= foldInDuration) {
                animationPhase = 1; // Switch to hold phase
            } else if (animationPhase === 1 && elapsed >= foldInDuration + holdDuration) {
                animationPhase = 2; // Switch to fold out phase
            } else if (animationPhase === 2 && elapsed >= foldInDuration + holdDuration + foldOutDuration) {
                animationPhase = 3; // Animation complete
            }
            
            // Calculate the fold depth based on the animation phase
            let foldDepth = 0;
            
            if (animationPhase === 0) {
                // Fold in phase - apply easeInOut
                const t = elapsed / foldInDuration; // Normalized time (0-1)
                foldDepth = maxFoldDepth * easeInOut(t);
            } else if (animationPhase === 1) {
                // Hold phase - keep at maximum
                foldDepth = maxFoldDepth;
            } else if (animationPhase === 2) {
                // Fold out phase - apply easeInOut in reverse
                const t = (elapsed - foldInDuration - holdDuration) / foldOutDuration; // Normalized time (0-1)
                foldDepth = maxFoldDepth * (1 - easeInOut(t));
            }
            
            // Apply the fold by updating corner position
            if (animationPhase < 3) {
                // Calculate new position with the current fold depth
                const pos: Point = {
                    x: cornerPos.x - foldDepth,
                    y: cornerPos.y - foldDepth
                };
                
                // Apply the fold
                this.flipController.showCorner(pos);
                
                // Continue animation
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                // Animation complete - reset position
                this.flipController.showCorner({ x: -100, y: -100 });
                
                // Clear animation frame ID
                this.animationFrameId = null;
            }
        };
        
        // Start the animation
        this.animationFrameId = requestAnimationFrame(animate);
    }

    /**
     * Update the render area. Re-show current page.
     */
    public update(): void {
        this.render.update();
        this.pages.show();
        
        // Restart the flip hint timer
        if (this.setting.showFlipHint) {
            this.setupFlipHintTimer();
        }
    }

    /**
     * Load pages from HTML elements on the HTML mode
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    public loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
        this.ui = new HTMLUI(this.block, this, this.setting, items);

        this.render = new HTMLRender(this, this.setting, this.ui.getDistElement());

        this.flipController = new Flip(this.render, this);

        this.pages = new HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);
        this.pages.load();

        this.render.start();

        this.pages.show(this.setting.startPage);

        // safari fix
        setTimeout(() => {
            this.ui.update();
            this.trigger('init', this, {
                page: this.setting.startPage,
                mode: this.render.getOrientation(),
            });
            
            // Emit initial changeState event with READ state and current spread info
            this.emitInitialState();
            
            // Set up flip hint timer
            if (this.setting.showFlipHint) {
                this.setupFlipHintTimer();
            }
        }, 1);
    }
    
    /**
     * Emit the initial changeState event with the current spread information
     * This will notify listeners about the initial state and visible pages
     */
    private emitInitialState(): void {
        const currentSpreadIndex = this.pages.getCurrentSpreadIndex();
        const currentPageIndex = this.pages.getCurrentPageIndex();
        
        // Get the affected pages in the current spread
        const currentPageIndexes = this.getPageIndexesForSpread(currentSpreadIndex);
        
        // Create the initial state event data
        const eventData: StateChangeEventData = {
            state: FlippingState.READ,
            previousState: FlippingState.READ, // Initial state has same previous state
            currentPageIndex,
            currentSpreadIndex,
            currentPageIndexes,
            targetSpreadIndex: currentSpreadIndex,
            targetPageIndexes: currentPageIndexes,
            flipProgressRatio: 1.0,  // Initial state is fully visible (100% progress)
            stateDidChange: true     // Mark as a state change for initial setup
        };
        
        // Trigger the enhanced changeState event with initial state
        this.trigger('changeState', this, eventData);
    }

    /**
     * Update current pages from HTML
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    public updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
        const current = this.pages.getCurrentPageIndex();

        this.pages.destroy();
        this.pages = new HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);
        this.pages.load();
        (this.ui as HTMLUI).updateItems(items);
        this.render.reload();

        this.pages.show(current);
        this.trigger('update', this, {
            page: current,
            mode: this.render.getOrientation(),
        });
        
        // Emit changeState event after update as well
        this.emitInitialState();
    }

    /**
     * Clear pages from HTML (remove to initinalState)
     */
    public clear(): void {
        this.pages.destroy();
        (this.ui as HTMLUI).clear();
    }

    /**
     * Turn to the previous page (without animation)
     */
    public turnToPrevPage(): void {
        this.pages.showPrev();
    }

    /**
     * Turn to the next page (without animation)
     */
    public turnToNextPage(): void {
        this.pages.showNext();
    }

    /**
     * Turn to the specified page number (without animation)
     *
     * @param {number} page - New page number
     */
    public turnToPage(page: number): void {
        this.pages.show(page);
    }

    /**
     * Turn to the next page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipNext(corner: FlipCorner = FlipCorner.TOP): void {
        this.flipController.flipNext(corner);
    }

    /**
     * Turn to the prev page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipPrev(corner: FlipCorner = FlipCorner.TOP): void {
        this.flipController.flipPrev(corner);
    }

    /**
     * Turn to the specified page number (with animation)
     *
     * @param {number} page - New page number
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flip(page: number, corner: FlipCorner = FlipCorner.TOP): void {
        this.flipController.flipToPage(page, corner);
    }

    /**
     * Called by Flip when the flipping state is changed
     *
     * @param {FlippingState} newState - New state of the object
     * @param {number} [progress] - Optional progress ratio (0.0 to 1.0) of the page flip
     */
    public updateState(newState: FlippingState, progress: number = null): void {
        // Check if we're updating state or just progress
        const stateDidChange = this.previousState !== newState;
        const shouldFireEvent = stateDidChange || progress !== null;
        
        if (shouldFireEvent) {
            const currentSpreadIndex = this.pages.getCurrentSpreadIndex();
            const currentPageIndex = this.pages.getCurrentPageIndex();
            
            // Get the affected pages in the current spread
            const affectedPageIndexes = this.getPageIndexesForSpread(currentSpreadIndex);
            
            // Get the target spread based on the state and direction
            let targetSpreadIndex = currentSpreadIndex;
            let targetPageIndexes = affectedPageIndexes;
            
            // Always get the flip direction for target spread calculation, even for progress updates
            const flipCalc = this.flipController.getCalculation();
            if (flipCalc && typeof flipCalc.getDirection === 'function') {
                const direction = flipCalc.getDirection();
                
                // Calculate target spread index based on direction
                if (direction === 0) { // FORWARD
                    targetSpreadIndex = currentSpreadIndex + 1;
                } else if (direction === 1) { // BACK
                    targetSpreadIndex = Math.max(0, currentSpreadIndex - 1);
                }
                
                // Get page indexes for the target spread
                targetPageIndexes = this.getPageIndexesForSpread(targetSpreadIndex);
            }
            
            // Handle transition from FOLD_CORNER to READ
            if (newState === FlippingState.READ && this.previousState === FlippingState.FOLD_CORNER) {
                // Get flip direction from the flip controller for corner fold
                const flipData = this.flipController.getCalculation();
                if (flipData && flipData.getDirection() !== undefined) {
                    const direction = flipData.getDirection();
                    // Calculate target spread index based on direction
                    if (direction === 0) { // FORWARD
                        targetSpreadIndex = currentSpreadIndex + 1;
                    } else if (direction === 1) { // BACK
                        targetSpreadIndex = currentSpreadIndex - 1;
                    }
                    // Get page indexes for the target spread that was being previewed
                    targetPageIndexes = this.getPageIndexesForSpread(targetSpreadIndex);
                }
            }
            // Regular state transition handling for flipping/folding
            else if ((newState === FlippingState.FLIPPING || 
                 newState === FlippingState.USER_FOLD || 
                 newState === FlippingState.FOLD_CORNER) && 
                (this.previousState === FlippingState.READ || this.previousState === FlippingState.FOLD_CORNER)) {
                
                // Get flip direction from the flip controller
                const direction = this.flipController.getCalculation()?.getDirection();
                
                // Calculate target spread index based on direction
                if (direction === 0) { // FORWARD
                    targetSpreadIndex = currentSpreadIndex + 1;
                } else if (direction === 1) { // BACK
                    targetSpreadIndex = currentSpreadIndex - 1;
                }
                
                // Get page indexes for the target spread
                targetPageIndexes = this.getPageIndexesForSpread(targetSpreadIndex);
            }
            
            // Handle progress value
            let flipProgressRatio = 1.0; // Default to 1.0 for instant flips
            
            if (progress !== null) {
                // Use provided progress if available
                flipProgressRatio = progress;
            } else if (newState === FlippingState.FLIPPING) {
                // For flipping animations, start at 0
                flipProgressRatio = 0.0;
            } else if (newState === FlippingState.FOLD_CORNER) {
                // For corner folding, use the progress if reportHoverProgress is true
                if (this.setting.reportHoverProgress) {
                    // Get the calculation object to extract the progress
                    const calc = this.flipController.getCalculation();
                    if (calc) {
                        // Get basic progress from the calculation
                        const calcProgress = calc.getFlippingProgress() / 100;
                        
                        // Use the progress value (0-1) for corner folding
                        flipProgressRatio = calcProgress;
                    } else {
                        flipProgressRatio = 0.0;
                    }
                } else {
                    // If hover progress reporting is disabled, always use 0
                    flipProgressRatio = 0.0;
                }
            } else if (newState === FlippingState.USER_FOLD) {
                // For user dragging, calculate progress from the flip controller
                const calc = this.flipController.getCalculation();
                if (calc) {
                    flipProgressRatio = calc.getFlippingProgress() / 100;
                }
            }
            
            // Create the enhanced event data
            const eventData: StateChangeEventData = {
                state: newState,
                previousState: this.previousState, // Include the previous state
                currentPageIndex,
                currentSpreadIndex,
                currentPageIndexes: affectedPageIndexes,
                targetSpreadIndex,
                targetPageIndexes,
                flipProgressRatio,
                stateDidChange // Add the flag indicating whether state actually changed
            };
            
            // Set data-flipstate attribute on parent element
            const parentElement = this.block.querySelector('.stf__parent') || this.block;
            if (newState === FlippingState.FLIPPING) {
                parentElement.setAttribute('data-flipstate', 'flipping');
            } else if (newState === FlippingState.USER_FOLD || newState === FlippingState.FOLD_CORNER) {
                parentElement.setAttribute('data-flipstate', 'folding');
            } else {
                parentElement.removeAttribute('data-flipstate');
            }
            
            // Always trigger the event when progress changes
            this.trigger('changeState', this, eventData);
            
            // Only update previous state if it actually changed
            if (stateDidChange) {
                this.previousState = newState;
            }
        }
    }
    
    /**
     * Get page indexes for a specific spread
     * 
     * @param spreadIndex The spread index
     * @returns Array of page indexes in the spread
     */
    private getPageIndexesForSpread(spreadIndex: number): number[] {
        if (spreadIndex < 0) {
            return [];
        }
        
        try {
            const orientation = this.render.getOrientation();
            const pageCount = this.getPageCount();
            
            if (orientation === Orientation.LANDSCAPE) {
                if (this.setting.showCover) {
                    // First spread is cover only
                    if (spreadIndex === 0) {
                        return [0];
                    } else {
                        // Calculate page indexes based on spread index with cover
                        const startPage = (spreadIndex - 1) * 2 + 1;
                        if (startPage + 1 < pageCount) {
                            return [startPage, startPage + 1];
                        } else {
                            return [startPage];
                        }
                    }
                } else {
                    // Calculate page indexes based on spread index with no cover
                    const startPage = spreadIndex * 2;
                    if (startPage + 1 < pageCount) {
                        return [startPage, startPage + 1];
                    } else {
                        return [startPage];
                    }
                }
            } else {
                // In portrait mode, one spread = one page
                return [spreadIndex];
            }
        } catch (e) {
            return [];
        }
    }

    /**
     * Call a page number change event trigger
     *
     * @param {number} newPage - New page Number
     */
    public updatePageIndex(newPage: number): void {
        this.trigger('flip', this, newPage);
    }

    /**
     * Call a page orientation change event trigger. Update UI and rendering area
     *
     * @param {Orientation} newOrientation - New page orientation (portrait, landscape)
     */
    public updateOrientation(newOrientation: Orientation): void {
        this.ui.setOrientationStyle(newOrientation);
        this.update();
        this.trigger('changeOrientation', this, newOrientation);
    }

    /**
     * Get the total number of pages in a book
     *
     * @returns {number}
     */
    public getPageCount(): number {
        return this.pages.getPageCount();
    }

    /**
     * Get the index of the current page in the page list (starts at 0)
     *
     * @returns {number}
     */
    public getCurrentPageIndex(): number {
        return this.pages.getCurrentPageIndex();
    }

    /**
     * Get page from collection by number
     *
     * @param {number} pageIndex
     * @returns {Page}
     */
    public getPage(pageIndex: number): Page {
        return this.pages.getPage(pageIndex);
    }

    /**
     * Get the current rendering object
     *
     * @returns {Render}
     */
    public getRender(): Render {
        return this.render;
    }

    /**
     * Get current object responsible for flipping
     *
     * @returns {Flip}
     */
    public getFlipController(): Flip {
        return this.flipController;
    }

    /**
     * Get current page orientation
     *
     * @returns {Orientation} Сurrent orientation: portrait or landscape
     */
    public getOrientation(): Orientation {
        return this.render.getOrientation();
    }

    /**
     * Get current book sizes and position
     *
     * @returns {PageRect}
     */
    public getBoundsRect(): PageRect {
        return this.render.getRect();
    }

    /**
     * Get configuration object
     *
     * @returns {FlipSetting}
     */
    public getSettings(): FlipSetting {
        return this.setting;
    }

    /**
     * Get UI object
     *
     * @returns {UI}
     */
    public getUI(): UI {
        return this.ui;
    }

    /**
     * Get current flipping state
     *
     * @returns {FlippingState}
     */
    public getState(): FlippingState {
        return this.flipController.getState();
    }

    /**
     * Get page collection
     *
     * @returns {PageCollection}
     */
    public getPageCollection(): PageCollection {
        return this.pages;
    }

    /**
     * Enable or disable interactivity for the book
     * 
     * @param {boolean} interactive - If false, all interactions will be disabled (flipping, corner lifting, etc.)
     */
    public setInteractive(interactive: boolean): void {
        this.interactiveMode = interactive;
        
        const parentElement = this.block.querySelector('.stf__parent') || this.block;
        
        // Add/remove class for CSS-based interaction disabling
        if (!interactive) {
            parentElement.classList.add('disable-element-interactions');
        } else {
            parentElement.classList.remove('disable-element-interactions');
        }
        
        // Disable/enable page flipping functionality
        this.setting.disableFlipByClick = !interactive;
        
        // Disable/enable corner lifting on hover
        this.setting.showPageCorners = interactive;
        
        // Update the UI to reflect these changes
        if (this.ui) {
            this.ui.update();
        }
    }

    /**
     * Start page turning. Called when a user clicks or touches
     *
     * @param {Point} pos - Touch position in coordinates relative to the book
     */
    public startUserTouch(pos: Point): void {
        // If interactivity is disabled, don't process any touch start events
        if (!this.interactiveMode) return;

        // Only update lastInteractionTime if touching near the corner
        // This has nothing to do with hint cancellation, so we don't cancel the hint here
        const rect = this.getBoundsRect();
        const distFromCorner = Helper.GetDistanceBetweenTwoPoint(
            pos, 
            {
                x: rect.pageWidth * 2, // Right edge of book
                y: rect.height // Bottom edge of book
            }
        );
        
        // Only update lastInteractionTime if touching near the corner
        if (distFromCorner < 150) {
            this.lastInteractionTime = Date.now();
        }

        this.mousePosition = pos; // Save touch position
        this.isUserTouch = true;
        this.isUserMove = false;
    }

    /**
     * Called when a finger / mouse moves
     *
     * @param {Point} pos - Touch position in coordinates relative to the book
     * @param {boolean} isTouch - True if there was a touch event, not a mouse click
     */
    public userMove(pos: Point, isTouch: boolean): void {
        // If interactivity is disabled, don't process any movements
        if (!this.interactiveMode) return;
        
        // Check if the user is interacting with the corner
        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;
        
        // Calculate using the EXACT SAME method as isPointOnCorners in Flip.ts
        // This ensures we use the same threshold as the native corner folding
        const operatingDistance = Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;
        
        // Convert global position to book position
        const bookPos = this.render.convertToBook(pos);
        
        // Check if point is on corners using the same logic as the Flip class
        const isOnCorners = 
            bookPos.x > 0 &&
            bookPos.y > 0 &&
            bookPos.x < rect.width &&
            bookPos.y < rect.height &&
            (bookPos.x < operatingDistance || bookPos.x > rect.width - operatingDistance) &&
            (bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance);
        
        // Store previous state before potential corner folding
        const previousState = this.flipController.getState();
        const wasInCornerState = previousState === FlippingState.FOLD_CORNER;
        
        // IMPORTANT: There are two cases to handle:
        // 1. When animation is running - we want to let corner hover cancel it
        // 2. For non-corner areas - ignore mouse moves during animation
        
        if (isOnCorners) {
            // We're on a corner - always allow corner interaction
            if (!this.isUserTouch && !isTouch && this.setting.showPageCorners) {
                // This is just mouse hover near corner - apply corner fold visually
                this.flipController.showCorner(pos);
                
                // Always update interaction time and reset timers for corner hover,
                // regardless of animation state
                this.lastInteractionTime = Date.now();
                
                // Set cooldown period (same as for actual page flips)
                this.cooldownUntil = Date.now() + (this.setting.flipHintCooldown || 60000);
                
                // Cancel any running animation
                if (this.animationFrameId !== null) {
                    this.cancelHintAnimation();
                }
                
                // Always clear and restart the timer for corner hover
                this.clearFlipHintTimer();
                this.setupFlipHintTimer();
            } else if (this.isUserTouch) {
                // Touch interaction near corner
                if (Helper.GetDistanceBetweenTwoPoint(this.mousePosition, pos) > 5) {
                    this.isUserMove = true;
                    this.flipController.fold(pos);
                    
                    // Touch dragging should update the interaction time
                    this.lastInteractionTime = Date.now();
                    
                    // Cancel animation for touch drag
                    if (this.animationFrameId !== null) {
                        this.cancelHintAnimation();
                    }
                }
            }
        } else if (this.animationFrameId === null) {
            // Not on corner and no animation - process normal mouse moves/touch
            if (!this.isUserTouch && !isTouch && this.setting.showPageCorners) {
                // Regular mouse movement away from corner
                this.flipController.showCorner(pos);
            } else if (this.isUserTouch) {
                if (Helper.GetDistanceBetweenTwoPoint(this.mousePosition, pos) > 5) {
                    this.isUserMove = true;
                    this.flipController.fold(pos);
                    
                    // Touch dragging should update the interaction time
                    this.lastInteractionTime = Date.now();
                }
            }
        } else if (this.isUserTouch) {
            // Animation running, not on corner, but user is touching - still process drag
            if (Helper.GetDistanceBetweenTwoPoint(this.mousePosition, pos) > 5) {
                this.isUserMove = true;
                this.flipController.fold(pos);
                
                // Touch dragging should update the interaction time
                this.lastInteractionTime = Date.now();
                
                // Cancel animation for touch drag anywhere
                this.cancelHintAnimation();
            }
        }
        
        // Now check if state changed due to user interaction with corner
        const currentState = this.flipController.getState();
        const isNowInCornerState = currentState === FlippingState.FOLD_CORNER;
        
        // SPECIFIC CANCELLATION POINT #1:
        // Cancel hint ONLY if the corner is being lifted by actual user touch (not just hover)
        // This requires the state to change to FOLD_CORNER AND the user is actively touching
        if (!wasInCornerState && isNowInCornerState && isOnCorners && this.isUserTouch) {
            // User has interacted with the corner - update interaction time
            this.lastInteractionTime = Date.now();
            
            // Cancel any current hint animation
            this.cancelHintAnimation();
            
            // Set cooldown period
            this.cooldownUntil = Date.now() + (this.setting.flipHintCooldown || 60000);
            
            // Restart timer with cooldown
            this.clearFlipHintTimer();
            this.setupFlipHintTimer();
        }
    }

    /**
     * Сalled when the user has stopped touching
     *
     * @param {Point} pos - Touch end position in coordinates relative to the book
     * @param {boolean} isSwipe - true if there was a mobile swipe event
     */
    public userStop(pos: Point, isSwipe = false): void {
        // If interactivity is disabled, don't process any touch end events
        if (!this.interactiveMode) return;

        if (this.isUserTouch) {
            this.isUserTouch = false;

            if (!isSwipe) {
                if (!this.isUserMove) {
                    // About to flip a page - check state BEFORE flip
                    const stateBeforeFlip = this.getState();
                    
                    // Perform the flip
                    this.flipController.flip(pos);
                    
                    // Check state AFTER flip to see if it actually flipped
                    const stateAfterFlip = this.getState();
                    
                    // SPECIFIC CANCELLATION POINT #2:
                    // Cancel hint ONLY if a page flip was actually initiated
                    if (stateBeforeFlip !== FlippingState.FLIPPING && 
                        stateAfterFlip === FlippingState.FLIPPING) {
                        // Update interaction time when flipping pages
                        this.lastInteractionTime = Date.now();
                        
                        // Cancel any current animation
                        this.cancelHintAnimation();
                        
                        // Set cooldown period
                        this.cooldownUntil = Date.now() + (this.setting.flipHintCooldown || 60000);
                        
                        // Restart timer with cooldown
                        this.clearFlipHintTimer();
                        this.setupFlipHintTimer();
                    }
                }
                else this.flipController.stopMove();
            }
        }
    }

    /**
     * Get debug information about the flip hint system.
     * This can be called from the browser console to help diagnose issues.
     */
    public debugHint(): object {
        return {
            hintEnabled: this.setting.showFlipHint,
            intervalMs: this.setting.flipHintInterval,
            cooldownMs: this.setting.flipHintCooldown,
            lastInteractionTime: new Date(this.lastInteractionTime).toISOString(),
            cooldownUntil: new Date(this.cooldownUntil).toISOString(),
            inCooldown: Date.now() < this.cooldownUntil,
            cooldownRemaining: Math.max(0, this.cooldownUntil - Date.now()),
            timerActive: this.flipHintTimer !== null,
            animationActive: this.animationFrameId !== null,
            currentState: this.getState(),
        };
    }
}
