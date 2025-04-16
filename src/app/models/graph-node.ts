import { NodeWrapper, GraphColors, GraphNodeAttributes, Point } from "@tomaszatoo/graph-viewer";
import { Text, Graphics, Texture, Sprite } from 'pixi.js';

interface ExtendedGraphNodeAttributes extends GraphNodeAttributes {
    image?: Texture | undefined
    type?: string
}

export class GraphNode extends NodeWrapper {

    private profilePicture!: Sprite;
    private type: string = '';

    private customColors: GraphColors = {
        fill: 0xff0000,
        stroke: 0x000000,
        label: 0xffffff,
        selection: 0x2DC9DC,
        highlight: 0x30D973
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

    override initLabelGraphics(t: Text): void {
        // console.log('initLabelGraphics in custom renderer');
        t.text = this.attributes.label && this.attributes.label ? this.attributes.label : '';
        t.style = {
            fontSize: 24,
            fontFamily: 'Arial',
            fill: this.select ? this.defaultNodeColors.selection : (this.highlight ? this.defaultNodeColors.highlight : this.defaultNodeColors.label),
            align: 'center'
        }
    }

    override initNodeGraphics(g: Graphics): void {
        // console.log('node type', this.type);
        if (this.type && this.type === 'user') {
            g.circle(0, 0, this.radius())
                .stroke({
                    color: this.select ? this.defaultNodeColors.selection : (this.highlight ? this.defaultNodeColors.highlight : this.defaultNodeColors.stroke),
                    width: this.attributes && this.attributes.strokeWidth ? this.attributes.strokeWidth : 10
                });
            if (this.profilePicture) {
                this.profilePicture.width = (this.radius() * 2) + 10;
                this.profilePicture.height = (this.radius() * 2) + 10;
                this.profilePicture.x = (this.radius() + 5) * (-1);
                this.profilePicture.y = (this.radius() + 5) * (-1);
                // this.profilePicture.position = {x: this.profilePicture.x - this.profilePicture.width / 2, y: this.profilePicture.y - this.profilePicture.height / 2}
                g.parent.addChild(this.profilePicture);
                const mask = new Graphics();
                mask.circle(0, 0, this.radius() + 5)
                    .fill({
                        color: this.defaultNodeColors.fill
                    });
                g.parent.addChild(mask);
                g.parent.mask = mask;
            }
        }
        // TODO: type comment
        // ...
    }

    private radius(): number {
        const size = this.attributes.radius ? this.attributes.radius : 10;
        const result = this.highlight ? (size + (size * .2)) : size;
        return result /* + (result * .8) */;
    }
}