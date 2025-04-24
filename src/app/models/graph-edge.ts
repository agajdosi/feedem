import { EdgeWrapper, EdgePosition, GraphEdgeAttributes } from "@tomaszatoo/graph-viewer";
import { Graphics } from "pixi.js";


export class GraphEdge extends EdgeWrapper {

    private lineInitialised: boolean = false;

    constructor(
        edgePosition: EdgePosition,
        attributes?: GraphEdgeAttributes,
        targetSize?: number,
        selfloop: boolean = false
    ){
        super(edgePosition, attributes, targetSize, selfloop);
    }

    protected override initEdgeLine(g: Graphics): void {
        // console.log(this.edgePosition);
        // if (!this.lineInitialised) {
            const pos = this.edgePosition;
            const strokeWidth = this.attributes && this.attributes.strokeWidth ? this. attributes.strokeWidth : 1;
            // console.log('highlight edge?', this.highlight);
            // g.clear();
            if (this.select || this.highlight) {
                g.moveTo(pos.source.x, pos.source.y)
                .lineTo(pos.target.x, pos.target.y)
                .stroke({
                    color: 0xffffff,
                    pixelLine: false,
                    width: strokeWidth * 2
                });
                // console.log('draw continous', '---------');
                
            } else {
                this.drawDash(g, pos.source.x, pos.source.y, pos.target.x, pos.target.y)
                .stroke({
                    color: 0x666666,
                    pixelLine: false,
                    width: strokeWidth
                });
                // console.log('draw dashed', '- - - - - - -')
            }
                  
    }

    protected override initEdgeArrow(g: Graphics): void {
        // Q: SHOULD WE DO?
    }

    private drawDash(target: Graphics, x1: number, y1: number, x2: number, y2: number, dashLength = 2, spaceLength = 2) {
        let x = x2 - x1;
        let y = y2 - y1;
        let hyp = Math.sqrt((x) * (x) + (y) * (y));
        let units = hyp / (dashLength + spaceLength);
        let dashSpaceRatio = dashLength / (dashLength + spaceLength);
        let dashX = (x / units) * dashSpaceRatio;
        let spaceX = (x / units) - dashX;
        let dashY = (y / units) * dashSpaceRatio;
        let spaceY = (y / units) - dashY;
      
        target.moveTo(x1, y1);
        
        while (hyp > 0) {
          x1 += dashX;
          y1 += dashY;
          hyp -= dashLength;
          if (hyp < 0) {
            x1 = x2;
            y1 = y2;
          }
          target.lineTo(x1, y1);
          x1 += spaceX;
          y1 += spaceY;
          target.moveTo(x1, y1);
          hyp -= spaceLength;
        }
        target.moveTo(x2, y2);
        return target;
      }
}