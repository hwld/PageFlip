import { PageRect, Point } from './BasicTypes';
import { HTMLPageCollection } from './Collection/HTMLPageCollection';
import { PageCollection } from './Collection/PageCollection';
import { EventObject } from './Event/EventObject';
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
    }

    /**
     * Destructor. Remove a root HTML element and all event handlers
     */
    public destroy(): void {
        this.ui.destroy();
        this.block.remove();
    }

    /**
     * Update the render area. Re-show current page.
     */
    public update(): void {
        this.render.update();
        this.pages.show();
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
        const eventData = {
            state: FlippingState.READ,
            currentPageIndex,
            currentSpreadIndex,
            currentPageIndexes,
            targetSpreadIndex: currentSpreadIndex,
            targetPageIndexes: currentPageIndexes
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
     * Call a state change event trigger
     *
     * @param {FlippingState} newState - New state of the object
     */
    public updateState(newState: FlippingState): void {
        // Only send event if the state actually changed
        if (this.previousState !== newState) {
            const currentSpreadIndex = this.pages.getCurrentSpreadIndex();
            const currentPageIndex = this.pages.getCurrentPageIndex();
            
            // Get the affected pages in the current spread
            const affectedPageIndexes = this.getPageIndexesForSpread(currentSpreadIndex);
            
            // Get the target spread based on the state and direction
            let targetSpreadIndex = currentSpreadIndex;
            let targetPageIndexes = affectedPageIndexes;
            
            // If we're starting to flip or folding a corner, determine the target spread
            if ((newState === FlippingState.FLIPPING || 
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
            
            // Create the enhanced event data
            const eventData = {
                state: newState,
                currentPageIndex,
                currentSpreadIndex,
                currentPageIndexes: affectedPageIndexes,
                targetSpreadIndex,
                targetPageIndexes
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
            
            // Trigger the enhanced changeState event
            this.trigger('changeState', this, eventData);
            
            // Update the previous state
            this.previousState = newState;
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
     * Start page turning. Called when a user clicks or touches
     *
     * @param {Point} pos - Touch position in coordinates relative to the book
     */
    public startUserTouch(pos: Point): void {
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
        if (!this.isUserTouch && !isTouch && this.setting.showPageCorners) {
            this.flipController.showCorner(pos); // fold Page Corner
        } else if (this.isUserTouch) {
            if (Helper.GetDistanceBetweenTwoPoint(this.mousePosition, pos) > 5) {
                this.isUserMove = true;
                this.flipController.fold(pos);
            }
        }
    }

    /**
     * Сalled when the user has stopped touching
     *
     * @param {Point} pos - Touch end position in coordinates relative to the book
     * @param {boolean} isSwipe - true if there was a mobile swipe event
     */
    public userStop(pos: Point, isSwipe = false): void {
        if (this.isUserTouch) {
            this.isUserTouch = false;

            if (!isSwipe) {
                if (!this.isUserMove) this.flipController.flip(pos);
                else this.flipController.stopMove();
            }
        }
    }
}
