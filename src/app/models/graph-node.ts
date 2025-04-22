import { NodeWrapper, GraphColors, GraphNodeAttributes, Point } from "@tomaszatoo/graph-viewer";
import { Text, Graphics, Texture, Sprite, Container } from 'pixi.js';

interface ExtendedGraphNodeAttributes extends GraphNodeAttributes {
    image?: Texture | undefined
    type?: string
}

export class GraphNode extends NodeWrapper {

    private profilePicture!: Sprite;
    private type: string = '';

    private nodeInitialised: boolean = false;

    private customColors: GraphColors = {
        fill: 0xdddddd,
        stroke: 0xdddddd,
        label: 0xdddddd,
        selection: 0xffffff,
        highlight: 0xdddddd
    }

    constructor(
        nodePosition: Point,
        attributes?: Partial<ExtendedGraphNodeAttributes>
    ) {
        super(nodePosition, attributes);
        this.defaultNodeColors = this.customColors;
        // console.log('attributes', attributes);
        if (attributes && attributes.image) {
            this.loadTexture();
        }
        if (attributes && attributes.type) {
            this.type = attributes.type;
        }
        console.log('type', this.type);
        this.draw();
    }


    private async loadTexture(): Promise<any> {
        // return Assets.load(url);
        // console.log('attributes', this.attributes);
        const attrs: ExtendedGraphNodeAttributes = this.attributes as ExtendedGraphNodeAttributes;
        if (attrs.image) {
            this.profilePicture = new Sprite(attrs.image);
        }
    }

    

    /* TODO: CORRECT GRAPH-VIEWER -> IN THIS WAY, EVERY INTERACTION ADD A NEW OBJECT TO PARENT G */
    override initNodeGraphics(g: Graphics): void {
        // console.log('node type', this.type);
        if(this.select || this.highlight) {
            this.container.zIndex = 99999999;
        } else {
            this.container.zIndex = 0;
        }
        if (this.type && this.type === 'user') {
            g.circle(0, 0, this.radius())
                .stroke({
                    color: this.select ? this.defaultNodeColors.selection : (this.highlight ? this.defaultNodeColors.highlight : this.defaultNodeColors.stroke),
                    width: this.attributes && this.attributes.strokeWidth ? this.attributes.strokeWidth : 10
                });
            if (this.highlight || this.select) {
                g.parent.scale = 1.5;
            } else {
                g.parent.scale = 1;
            }
            if (this.profilePicture && !this.nodeInitialised) {
                this.profilePicture.width = (this.radius() * 2) + 10;
                this.profilePicture.height = (this.radius() * 2) + 10;
                this.profilePicture.x = (this.radius() + 5) * (-1);
                this.profilePicture.y = (this.radius() + 5) * (-1);
                // this.profilePicture.position = {x: this.profilePicture.x - this.profilePicture.width / 2, y: this.profilePicture.y - this.profilePicture.height / 2}
                const container = new Container();
                container.width = g.parent.width;
                container.height = g.parent.height;
                g.parent.addChild(container);
                
                container.addChild(this.profilePicture);
                const mask = new Graphics();
                mask.circle(0, 0, this.radius() + 5)
                    .fill({
                        color: this.defaultNodeColors.fill
                    });
                container.addChild(mask);
                container.mask = mask;
                this.nodeInitialised = true; 
                // console.log('only once this should appear for', g);
            }
        }
        // TODO: type comment, post
        // ...
        if (this.type && this.type === 'post') {
            g.circle(0, 0, this.radius() / 2)
                .fill({
                    color: 0xff0000,
                });
        }
    }

    override initLabelGraphics(t: Text): void {
        // console.log('label?', this.attributes.label);
        t.text = this.attributes.label && this.attributes.label ? this.attributes.label : '';
        t.style = {
            fontSize: 20,
            fontFamily: 'Arial',
            fill: this.select ? this.defaultNodeColors.selection : (this.highlight ? this.defaultNodeColors.highlight : this.defaultNodeColors.label),
            align: 'center'
        }
        const nodeContainer = t.parent.parent;
        // console.log('nodeContainer', nodeContainer);
        // if (nodeContainer) {
        t.x = this.attributes.radius ? (this.attributes.radius + 20) : 10;
        t.y = -(t.height / 2);
        // }
        
    }

    private radius(): number {
        const size = this.attributes.radius ? this.attributes.radius : 10;
        const result = this.highlight ? (size + (size * .2)) : size;
        return result /* + (result * .8) */;
    }
}