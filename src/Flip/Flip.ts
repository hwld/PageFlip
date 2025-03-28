import { PageRect, Point } from '../BasicTypes';
import { Helper } from '../Helper';
import { Page, PageDensity } from '../Page/Page';
import { PageFlip } from '../PageFlip';
import { Orientation, Render } from '../Render/Render';
import { FlipCalculation } from './FlipCalculation';

/**
 * Flipping direction
 */
export const enum FlipDirection {
    FORWARD,
    BACK,
}

/**
 * Active corner when flipping
 */
export const enum FlipCorner {
    TOP = 'top',
    BOTTOM = 'bottom',
}

/**
 * State of the book
 */
export const enum FlippingState {
    /** The user folding the page */
    USER_FOLD = 'user_fold',

    /** Mouse over active corners */
    FOLD_CORNER = 'fold_corner',

    /** During flipping animation */
    FLIPPING = 'flipping',

    /** Base state */
    READ = 'read',
}

/**
 * Class representing the flipping process
 */
export class Flip {
    private readonly render: Render;
    private readonly app: PageFlip;

    private currentPage: Page;
    private flippingPage: Page = null;
    private bottomPage: Page = null;

    private calc: FlipCalculation = null;

    private state: FlippingState = FlippingState.READ;

    constructor(render: Render, app: PageFlip) {
        this.render = render;
        this.app = app;
    }

    /**
     * Called when the page folding (User drags page corner)
     *
     * @param globalPos - Touch Point Coordinates (relative window)
     */
    public fold(globalPos: Point): void {
        let didStart = this.calc !== null;

        // If the process has not started yet
        if (this.calc === null) {
            didStart = this.start(globalPos);
        }

        // Only start the folding if we indeed have a calc
        if (didStart) {
            this.setState(FlippingState.USER_FOLD, false);
            
            // Process the touch position
            this.do(this.render.convertToPage(globalPos));
            
            // No need for additional updateState here since do() now handles it
        }
    }

    /**
     * Page turning with animation
     *
     * @param globalPos - Touch Point Coordinates (relative window)
     */
    public flip(globalPos: Point): void {
        if (this.app.getSettings().disableFlipByClick && !this.isPointOnCorners(globalPos)) return;

        // the flipiing process is already running
        if (this.calc !== null) this.render.finishAnimation();

        if (!this.start(globalPos)) return;

        const rect = this.getBoundsRect();

        this.setState(FlippingState.FLIPPING, false);
        // Set initial progress to 0 at the start of animation
        this.app.updateState(FlippingState.FLIPPING, 0);

        // Margin from top to start flipping
        const topMargins = rect.height / 10;

        // Defining animation start points
        const yStart =
            this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height - topMargins : topMargins;

        const yDest = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;

        // Сalculations for these points
        this.calc.calc({ x: rect.pageWidth - topMargins, y: yStart });

        // Run flipping animation
        this.animateFlippingTo(
            { x: rect.pageWidth - topMargins, y: yStart },
            { x: -rect.pageWidth, y: yDest },
            true
        );
    }

    /**
     * Start the flipping process. Find direction and corner of flipping. Creating an object for calculation.
     *
     * @param {Point} globalPos - Touch Point Coordinates (relative window)
     *
     * @returns {boolean} True if flipping is possible, false otherwise
     */
    public start(globalPos: Point): boolean {
        this.reset();

        const bookPos = this.render.convertToBook(globalPos);
        const rect = this.getBoundsRect();

        // Find the direction of flipping
        const direction = this.getDirectionByPoint(bookPos);

        // Find the active corner
        const flipCorner = bookPos.y >= rect.height / 2 ? FlipCorner.BOTTOM : FlipCorner.TOP;

        if (!this.checkDirection(direction)) return false;

        try {
            this.currentPage = this.app.getPageCollection().getCurrentPage(direction);
            this.flippingPage = this.app.getPageCollection().getFlippingPage(direction);
            this.bottomPage = this.app.getPageCollection().getBottomPage(direction);

            // In landscape mode, needed to set the density  of the next page to the same as that of the flipped
            if (this.render.getOrientation() === Orientation.LANDSCAPE) {
                if (direction === FlipDirection.BACK) {
                    const nextPage = this.app.getPageCollection().nextBy(this.flippingPage);

                    if (nextPage !== null) {
                        if (this.flippingPage.getDensity() !== nextPage.getDensity()) {
                            this.flippingPage.setDrawingDensity(PageDensity.HARD);
                            nextPage.setDrawingDensity(PageDensity.HARD);
                        }
                    }
                } else {
                    const prevPage = this.app.getPageCollection().prevBy(this.flippingPage);

                    if (prevPage !== null) {
                        if (this.flippingPage.getDensity() !== prevPage.getDensity()) {
                            this.flippingPage.setDrawingDensity(PageDensity.HARD);
                            prevPage.setDrawingDensity(PageDensity.HARD);
                        }
                    }
                }
            }

            this.render.setDirection(direction);
            this.calc = new FlipCalculation(
                direction,
                flipCorner,
                rect.pageWidth.toString(10), // fix bug with type casting
                rect.height.toString(10) // fix bug with type casting
            );

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Perform calculations for the current page position. Pass data to render object
     *
     * @param {Point} pagePos - Touch Point Coordinates (relative active page)
     */
    private do(pagePos: Point): void {
        if (this.calc === null) return; // Flipping process not started

        // Ensure pagePos is valid
        if (!pagePos || typeof pagePos.x !== 'number' || typeof pagePos.y !== 'number') {
            return;
        }

        if (this.calc.calc(pagePos)) {
            // Perform calculations for a specific position
            const progress = this.calc.getFlippingProgress();
            const progressRatio = progress / 100; // Convert to 0-1 range

            this.currentPage.setArea(this.calc.getCurrentClipArea());
            this.currentPage.setPosition(this.calc.getBottomPagePosition());
            this.currentPage.setAngle(0);
            this.currentPage.setHardAngle(0);

            this.bottomPage.setArea(this.calc.getBottomClipArea());
            this.bottomPage.setPosition(this.calc.getBottomPagePosition());
            this.bottomPage.setAngle(0);
            this.bottomPage.setHardAngle(0);

            this.flippingPage.setArea(this.calc.getFlippingClipArea());
            this.flippingPage.setPosition(this.calc.getActiveCorner());
            this.flippingPage.setAngle(this.calc.getAngle());

            if (this.calc.getDirection() === FlipDirection.FORWARD) {
                this.flippingPage.setHardAngle((90 * (200 - progress * 2)) / 100);
            } else {
                this.flippingPage.setHardAngle((-90 * (200 - progress * 2)) / 100);
            }

            this.render.setPageRect(this.calc.getRect());

            this.render.setBottomPage(this.bottomPage);
            this.render.setFlippingPage(this.flippingPage);

            this.render.setShadowData(
                this.calc.getShadowStartPoint(),
                this.calc.getShadowAngle(),
                progress,
                this.calc.getDirection()
            );
            
            // Continuously update state with progress on each position change
            // Pass the current state with new progress
            this.app.updateState(this.state, progressRatio);
        }
    }

    /**
     * Turn to the specified page number (with animation)
     *
     * @param {number} page - New page number
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipToPage(page: number, corner: FlipCorner): void {
        const current = this.app.getPageCollection().getCurrentSpreadIndex();
        const next = this.app.getPageCollection().getSpreadIndexByPage(page);

        try {
            if (next > current) {
                this.app.getPageCollection().setCurrentSpreadIndex(next - 1);
                this.flipNext(corner);
            }
            if (next < current) {
                this.app.getPageCollection().setCurrentSpreadIndex(next + 1);
                this.flipPrev(corner);
            }
        } catch (e) {
            //
        }
    }

    /**
     * Turn to the next page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipNext(corner: FlipCorner): void {
        this.flip({
            x: this.render.getRect().left + this.render.getRect().pageWidth * 2 - 10,
            y: corner === FlipCorner.TOP ? 1 : this.render.getRect().height - 2,
        });
    }

    /**
     * Turn to the prev page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipPrev(corner: FlipCorner): void {
        this.flip({
            x: 10,
            y: corner === FlipCorner.TOP ? 1 : this.render.getRect().height - 2,
        });
    }

    /**
     * Called when the user has stopped flipping
     */
    public stopMove(): void {
        if (this.calc === null) return;

        const pos = this.calc.getPosition();
        const rect = this.getBoundsRect();

        const y = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;

        // Check if we're in FOLD_CORNER state (peek interaction)
        if (this.state === FlippingState.FOLD_CORNER) {
            // Notify app that we're changing state
            this.app.updateState(FlippingState.READ);
            this.state = FlippingState.READ;
        }
        
        if (pos.x <= 0) this.animateFlippingTo(pos, { x: -rect.pageWidth, y }, true);
        else this.animateFlippingTo(pos, { x: rect.pageWidth, y }, false);
    }

    /**
     * Fold the corners of the book when the mouse pointer is over them.
     * Called when the mouse pointer is over the book without clicking
     *
     * @param globalPos
     */
    public showCorner(globalPos: Point): void {
        try {
            if (!this.checkState(FlippingState.READ, FlippingState.FOLD_CORNER)) return;

            const rect = this.getBoundsRect();
            const pageWidth = rect.pageWidth;

            if (this.isPointOnCorners(globalPos)) {
                if (this.calc === null) {
                    if (!this.start(globalPos)) return;

                    this.setState(FlippingState.FOLD_CORNER, false);

                    this.calc.calc({ x: pageWidth - 1, y: 1 });

                    const fixedCornerSize = 50;
                    const yStart = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height - 1 : 1;

                    const yDest =
                        this.calc.getCorner() === FlipCorner.BOTTOM
                            ? rect.height - fixedCornerSize
                            : fixedCornerSize;

                    // Get progress safely
                    let progress = 0;
                    try {
                        progress = this.calc.getFlippingProgress() / 100;
                    } catch (e) {
                        console.warn("Error calculating initial corner fold progress:", e);
                    }
                    
                    // Initial corner fold progress
                    this.app.updateState(FlippingState.FOLD_CORNER, progress);

                    this.animateFlippingTo(
                        { x: pageWidth - 1, y: yStart },
                        { x: pageWidth - fixedCornerSize, y: yDest },
                        false,
                        false
                    );
                } else {
                    // Process the hover position - will trigger progress update through do()
                    this.do(this.render.convertToPage(globalPos));
                }
            } else {
                // Mouse is outside corner area - check if we need to exit fold_corner state
                const wasInCornerState = this.state === FlippingState.FOLD_CORNER;
                const targetSpreadData = wasInCornerState ? this.getTargetSpreadData() : null;
                
                // Set state to READ *after* capturing the target spread data
                this.setState(FlippingState.READ);
                this.render.finishAnimation();

                this.stopMove();
            }
        } catch (error) {
            console.warn("Error in showCorner:", error);
            // Attempt to recover by resetting to READ state
            this.setState(FlippingState.READ);
        }
    }

    /**
     * Get data about the target spread when in FOLD_CORNER state
     * This is needed to properly handle the corner fold animation end
     */
    private getTargetSpreadData(): any {
        // Only calculate if we have a calculation object
        if (!this.calc) return null;
        
        // Get the direction from the calculation
        const direction = this.calc.getDirection();
        
        // If we have app reference
        if (this.app) {
            try {
                const currentSpreadIndex = this.app.getPageCollection().getCurrentSpreadIndex();
                
                // Calculate target spread index based on direction
                let targetSpreadIndex = currentSpreadIndex;
                if (direction === 0) { // FORWARD
                    targetSpreadIndex = currentSpreadIndex + 1;
                } else if (direction === 1) { // BACK
                    targetSpreadIndex = currentSpreadIndex - 1;
                }
                
                // We need to access this data more carefully
                // Rather than accessing private methods, let's pass the necessary data
                return {
                    currentSpreadIndex,
                    targetSpreadIndex,
                    direction
                };
            } catch (e) {
                return null;
            }
        }
        
        return null;
    }

    /**
     * Starting the flipping animation process
     *
     * @param {Point} start - animation start point
     * @param {Point} dest - animation end point
     * @param {boolean} isTurned - will the page turn over, or just bring it back
     * @param {boolean} needReset - reset the flipping process at the end of the animation
     */
    private animateFlippingTo(
        start: Point,
        dest: Point,
        isTurned: boolean,
        needReset = true
    ): void {
        // Get a denser set of points for smoother animation
        // Use at least 60 points for a smooth animation (matching 60fps)
        const numPoints = Math.max(60, Helper.GetDistanceBetweenTwoPoint(start, dest) * 3);
        const points = Helper.GetCordsFromTwoPoint(start, dest, numPoints);

        // Create frames
        const frames = [];
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            
            // Calculate progress for each frame (0 to 1)
            const progress = i / (points.length - 1);
            
            // Wrap the frame function to include progress update
            frames.push(() => {
                this.do(p);
                
                // Update state with current progress during animation
                // We do this here in addition to do() to ensure progress is updated
                // consistently during animations
                if (this.state === FlippingState.FLIPPING) {
                    this.app.updateState(FlippingState.FLIPPING, progress);
                }
            });
        }

        const duration = this.getAnimationDuration(points.length);

        this.render.startAnimation(frames, duration, () => {
            // callback function
            if (!this.calc) return;

            if (isTurned) {
                if (this.calc.getDirection() === FlipDirection.BACK) this.app.turnToPrevPage();
                else this.app.turnToNextPage();
            }

            if (needReset) {
                this.render.setBottomPage(null);
                this.render.setFlippingPage(null);
                this.render.clearShadow();

                this.setState(FlippingState.READ);
                this.reset();
            }
        });
    }

    /**
     * Get current flipping state
     */
    public getState(): FlippingState {
        return this.state;
    }

    /**
     * Get the current calculation object
     * @returns The current FlipCalculation object or null
     */
    public getCalculation(): FlipCalculation | null {
        return this.calc;
    }

    /**
     * Set the flipping state and update the app if the state changes
     * 
     * @param newState - The new flipping state
     * @param updateApp - Whether to call app.updateState (default: true)
     */
    private setState(newState: FlippingState, updateApp: boolean = true): void {
        if (this.state !== newState) {
            // Only update the app state if requested (we might be doing it elsewhere with progress)
            if (updateApp) {
                this.app.updateState(newState);
            }
            this.state = newState;
        }
    }

    private getDirectionByPoint(touchPos: Point): FlipDirection {
        const rect = this.getBoundsRect();

        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            if (touchPos.x - rect.pageWidth <= rect.width / 5) {
                return FlipDirection.BACK;
            }
        } else if (touchPos.x < rect.width / 2) {
            return FlipDirection.BACK;
        }

        return FlipDirection.FORWARD;
    }

    private getAnimationDuration(size: number): number {
        const defaultTime = this.app.getSettings().flippingTime;

        if (size >= 1000) return defaultTime;

        return (size / 1000) * defaultTime;
    }

    private checkDirection(direction: FlipDirection): boolean {
        if (direction === FlipDirection.FORWARD)
            return this.app.getCurrentPageIndex() < this.app.getPageCount() - 1;

        return this.app.getCurrentPageIndex() >= 1;
    }

    private reset(): void {
        this.calc = null;
        this.flippingPage = null;
        this.bottomPage = null;
        this.currentPage = null;
    }

    private getBoundsRect(): PageRect {
        return this.render.getRect();
    }

    private checkState(...states: FlippingState[]): boolean {
        for (const state of states) {
            if (this.state === state) return true;
        }

        return false;
    }

    private isPointOnCorners(globalPos: Point): boolean {
        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;

        const operatingDistance = Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;

        const bookPos = this.render.convertToBook(globalPos);

        return (
            bookPos.x > 0 &&
            bookPos.y > 0 &&
            bookPos.x < rect.width &&
            bookPos.y < rect.height &&
            (bookPos.x < operatingDistance || bookPos.x > rect.width - operatingDistance) &&
            (bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance)
        );
    }
}
