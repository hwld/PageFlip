import { HTMLPage } from '../Page/HTMLPage';
import { PageDensity } from '../Page/Page';
import { PageFlip } from '../PageFlip';
import { Render } from '../Render/Render';
import { PageCollection } from './PageCollection';

/**
 * Сlass representing a collection of pages as HTML Element
 */
export class HTMLPageCollection extends PageCollection {
    private readonly element: HTMLElement;
    private readonly pagesElement: NodeListOf<HTMLElement> | HTMLElement[];

    constructor(
        app: PageFlip,
        render: Render,
        element: HTMLElement,
        items: NodeListOf<HTMLElement> | HTMLElement[]
    ) {
        super(app, render);

        this.element = element;
        this.pagesElement = items;
    }

    public load(): void {
        // Convert to array to make TypeScript happy
        const pageElements = Array.isArray(this.pagesElement) 
            ? this.pagesElement
            : Array.from(this.pagesElement);
            
        for (const pageElement of pageElements) {
            const page = new HTMLPage(
                this.render,
                pageElement,
                pageElement.dataset['density'] === 'hard' ? PageDensity.HARD : PageDensity.SOFT
            );

            page.load();
            this.pages.push(page);
        }

        this.createSpread();
    }
}
