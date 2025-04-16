import { Injectable } from '@angular/core';
import { User, Relation } from '../../models/game';
import { GraphData, GraphLayoutSettings } from '@tomaszatoo/graph-viewer';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private settings: GraphLayoutSettings = {
      adjustSizes: true,
      barnesHutOptimize: false,
      barnesHutTheta: 0.5,
      edgeWeightInfluence: 1,
      gravity: 13,
      linLogMode: true,
      outboundAttractionDistribution: true,
      scalingRatio: 50,
      slowDown: 3,
      strongGravityMode: false // very effective
    }

  get layoutSettings(): GraphLayoutSettings {
    return this.settings;
  }

  constructor() { }

  buildGraph(users: User[], edges: Relation[], maxEdgesPerNode: number = 5): GraphData | undefined {
    if  (!users || users.length === 0) return undefined;  
    const graphData: GraphData = {
      nodes: [],
      edges: []
    }
    for (const user of users) {
      graphData.nodes.push({
        id: user.uuid, attributes: {
          label: `${user.name} ${user.surname}`,
          type: 'user',
          image: user.profile_picture
        }
      });
    }
    // if no edges, generate
    if (edges.length) {
      for (const edge of edges) {
        graphData.edges.push({
          source: edge.source,
          target: edge.target,
          attributes: {
            label: edge.label
          }
        });
      }
    } else {
      console.log('NO RELATIONSHIPS, CREATE THEM');
      const connectionExist = (connection: {source: string, target: string}) => {
        for (const c of graphData.edges) {
          if (c.source === connection.source && c.target === connection.target) return true;
        }
        return false;
      }
      for (const user of users) {
        const numberOfConnections = this.randomIntFromInterval(1, maxEdgesPerNode);
        for (let i = 0; i < numberOfConnections; i++) {
          // pick random user, not self
          let connection = users[this.randomIntFromInterval(0, users.length - 1)];
          while(
            connection.uuid === user.uuid || // avoid loop
            connectionExist({source: user.uuid, target: connection.uuid}) // avoid multi connections
          ) {
            connection = users[this.randomIntFromInterval(0, users.length - 1)];
          }
          // console.log('possible connection', connection ? connection : "NOOOOO!");
          graphData.edges.push({
            source: user.uuid,
            target: connection.uuid,
            attributes: {
              label: "follow"
            }
          });
        }
      }
    }
    return graphData;
  }

  private randomIntFromInterval(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
