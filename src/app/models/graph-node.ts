import { NodeWrapper, GraphColors, GraphNodeAttributes, Point } from "@tomaszatoo/graph-viewer";
import { Text, Graphics, Texture, Sprite, Container } from 'pixi.js';
import { GrayscaleFilter } from 'pixi-filters';

interface ExtendedGraphNodeAttributes extends GraphNodeAttributes {
    image?: Texture | undefined
    type?: string
}

export class GraphNode extends NodeWrapper {

    private profilePicture!: Sprite;
    private type: string = '';


    private userNodeInitialised: boolean = false;
    private userNodeContainer: Container = new Container();
    private userNodeMask: Graphics = new Graphics();
    private postNodeSvg: Graphics = new Graphics();// .svg(`<?xml version="1.0" encoding="UTF-8"?><svg id="a" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.86 19.86"><path d="M9.93,5.58l4.35,4.35-4.35,4.35-4.35-4.35,4.35-4.35M9.93.9L.9,9.94l9.03,9.03,9.03-9.03L9.93.9h0Z" style="fill:#e3e3e3; stroke-width:0px;"/></svg>`);
    private postNodeInitialised: boolean = false;
    private commentNodeSvg: Graphics = new Graphics();// .svg(`<?xml version="1.0" encoding="UTF-8"?><svg id="a" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.86 19.86"><path d="M9.93,5.58l4.35,4.35-4.35,4.35-4.35-4.35,4.35-4.35M9.93.9L.9,9.94l9.03,9.03,9.03-9.03L9.93.9h0Z" style="fill:#ddd; stroke-width:0px;"/></svg>`);
    private commentNodeInitialised: boolean = false;

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
        // console.log('type', this.type);
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
        // USER
        if (this.type && this.type === 'user') {
            g.circle(0, 0, this.radius())
                .stroke({
                    color: 0xdddddd, // this.select ? this.defaultNodeColors.selection : (this.highlight ? this.defaultNodeColors.highlight : this.defaultNodeColors.stroke),
                    width: this.select || this.highlight ? 10 : 10, // this.attributes && this.attributes.strokeWidth ? this.attributes.strokeWidth : 10
                });
            if (this.highlight || this.select) {
                g.parent.scale = 1.5;
            } else {
                g.parent.scale = 1;
            }
            if (this.profilePicture) {
                // const grayscale = new GrayscaleFilter();
                // this.profilePicture.filters = this.select || this.highlight ? [] : [grayscale];
                if (!this.userNodeInitialised) {
                    this.userNodeContainer.width = g.parent.width;
                    this.userNodeContainer.height = g.parent.height;
                    this.profilePicture.width = (this.radius() * 2) + 10;
                    this.profilePicture.height = (this.radius() * 2) + 10;
                    this.profilePicture.x = (this.radius() + 5) * (-1);
                    this.profilePicture.y = (this.radius() + 5) * (-1);
                    g.parent.addChild(this.userNodeContainer);
                    this.userNodeContainer.addChild(this.profilePicture);
                    this.userNodeContainer.addChild(this.userNodeMask);
                    this.userNodeContainer.mask = this.userNodeMask;
                    this.userNodeMask.circle(0, 0, this.radius() + 5)
                    .fill({
                        color: this.defaultNodeColors.fill
                    });
                    this.userNodeInitialised = true; 
                }
            }
        }
        // TODO: type comment, post
        // ...
        // POST
        if (this.type && this.type === 'post') {
            g.circle(0, 0, this.radius())
                .fill({
                    color: 0x000000,
                });
            if (!this.postNodeInitialised) {

                g.parent.addChild(this.postNodeSvg);
                this.postNodeSvg.rect(0, 0, this.radius() / .9, this.radius() / .9)
                .fill(0xdddddd);
                // this.postNodeSvg.rotation = this.degrees_to_radians(45);
                // this.postNodeSvg.y = g.y; 
                this.postNodeSvg.pivot = {x: this.postNodeSvg.width / 2, y: this.postNodeSvg.height / 2}
                // this.postNodeSvg.pivot = {x: g.x - g.width / 2, y: g.y - g.height / 2}
                
                // this.postNodeSvg.x -=1;
                // this.postNodeSvg.y -=1;

                this.postNodeInitialised = true;
            }
            // this.postNodeSvg.x = g.x - (g.width / 4);
            // this.postNodeSvg.y = g.y - (g.height / 4);
            // this.postNodeSvg.scale = .9;
        }
        // COMMENT
        if (this.type && this.type === 'comment') {
            g.circle(0, 0, this.radius())
                .fill({
                    color: 0x000000,
                });
            if (!this.commentNodeInitialised) {
                g.parent.addChild(this.commentNodeSvg);
                this.commentNodeSvg.rect(0, 0, this.radius() / 1.5, this.radius() / 1.5)
                .fill(0xdddddd);
                this.commentNodeSvg.rotation = this.degrees_to_radians(45);
                this.commentNodeSvg.pivot = {x: this.commentNodeSvg.width / 2, y: this.commentNodeSvg.height / 2}
                
                // this.commentNodeSvg.x -=1;
                // this.commentNodeSvg.y -=1;

                this.commentNodeInitialised = true;
            }
            // this.commentNodeSvg.x = g.x - (g.width / 4);
            // this.commentNodeSvg.y = g.y - (g.height / 4);
            // this.commentNodeSvg.scale = .9;
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
        // console.log('nodeContainer', nodeContainer);
        // if (nodeContainer) {
        t.x = this.attributes.radius ? (this.attributes.radius + 20) : 10;
        t.y = -(t.height / 2);
        // }
        
    }

    private radius(): number {
        const size = this.attributes.radius ? this.attributes.radius : 10;
        const result = this.highlight || this.select ? (size + (size * .2)) : size;
        return result /* + (result * .8) */;
    }

    private degrees_to_radians(degrees: number)
    {
      // Store the value of pi.
      var pi = Math.PI;
      // Multiply degrees by pi divided by 180 to convert to radians.
      return degrees * (pi/180);
    }
}