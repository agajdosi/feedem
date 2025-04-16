import { EdgeWrapper, EdgePosition, GraphEdgeAttributes } from "@tomaszatoo/graph-viewer";

export class GraphEdge extends EdgeWrapper {

    constructor(
        edgePosition: EdgePosition,
        attributes?: GraphEdgeAttributes,
        targetSize?: number,
        selfloop: boolean = false
    ){
        super(edgePosition, attributes, targetSize, selfloop);

        // console.log('edge attributes', attributes);
    }
}