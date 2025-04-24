import { Injectable } from '@angular/core';
import { User, Relation, Post, Game } from '../../models/game';
import { GraphNode } from '../../models/graph-node';
import { GraphData, GraphLayoutSettings } from '@tomaszatoo/graph-viewer';
import { Assets } from 'pixi.js';
import Graph from 'graphology';
import { singleSourceLength } from 'graphology-shortest-path/unweighted';

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

  async buildGraph(game: Game, onlyUsers: boolean = false, maxEdgesPerNode: number = 5): Promise<GraphData | undefined> {
    if  (!game.users || game.users.length === 0) return undefined;  
    const graphData: GraphData = {
      nodes: [],
      edges: []
    }
    // users
    for (const user of game.users) {
      const texture = await Assets.load(`${user.profile_picture}`);
      graphData.nodes.push({
        id: user.uuid,
        attributes: {
          label: `${user.name} ${user.surname}`,
          type: 'user',
          image: texture,
          // radius: 150
        }
      });
    }
    // posts
    for (const post of game.posts) {
      graphData.nodes.push({
        id: post.uuid,
        attributes: {
          type: 'post'
        }
      });
    }
    // comments
    for (const comment of game.comments) {
      graphData.nodes.push({
        id: comment.uuid,
        attributes: {
          type: 'comment'
        }
      })
    }
    // if edges, create else generate new
    if (game.relations.length) {
      for (const edge of game.relations) {
        // console.log('existing relation', edge);
        if (onlyUsers) {
          // console.log('should by only social graph');
          if (edge.label === 'follow') {
            graphData.edges.push({
              source: edge.source,
              target: edge.target,
              attributes: {
                label: edge.label,
                strokeWidth: 1,
                colors: {
                  stroke: 0xdddddd,
                  label: 0xdddddd,
                  highlight: 0xdddddd,
                  selection: 0xffffff
                } 
              }
            });
          }
        } else {
          graphData.edges.push({
            source: edge.source,
            target: edge.target,
            attributes: {
              label: edge.label,
              strokeWidth: 1,
              colors: {
                stroke: 0xdddddd,
                label: 0xdddddd,
                highlight: 0xdddddd,
                selection: 0xffffff
              } 
            }
          });
        }
        
      }
    } else {
      console.log('NO RELATIONS, CREATE THEM');
      const connectionExist = (connection: {source: string, target: string}) => {
        for (const c of graphData.edges) {
          if (c.source === connection.source && c.target === connection.target) return true;
        }
        return false;
      }
      for (const user of game.users) {
        const numberOfConnections = this.randomIntFromInterval(1, maxEdgesPerNode);
        for (let i = 0; i < numberOfConnections; i++) {
          // pick random user, not self
          let connection = game.users[this.randomIntFromInterval(0, game.users.length - 1)];
          while(
            connection.uuid === user.uuid || // avoid loop
            connectionExist({source: user.uuid, target: connection.uuid}) // avoid multi connections
          ) {
            connection = game.users[this.randomIntFromInterval(0, game.users.length - 1)];
          }
          // console.log('possible connection', connection ? connection : "NOOOOO!");
          graphData.edges.push({
            source: user.uuid,
            target: connection.uuid,
            attributes: {
              label: "follow",
              strokeWidth: 1,
              colors: {
                stroke: 0xdddddd,
                label: 0xdddddd,
                highlight: 0xdddddd,
                selection: 0xffffff
              } 
            }
          });
        }
      }
    }
    return graphData;
  }


  getUserPaths(graph: Graph, userId: string): any {
    console.log('paths of user', userId);
    const paths = singleSourceLength(graph, userId);
    console.log('paths', paths);
  }

  private randomIntFromInterval(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
