import { Injectable } from '@nestjs/common';
import { LargeNumberLike } from 'crypto';

export interface User {
    pseudo: string;
    fortytwo_id: number;
}
export interface GamePlayer {
    name: string;
    side: string; 
    x: number;
    y: number;
    score: number;
    disconnected: boolean;
  }
  
  export interface BallMoveEvent {
    x: number;
    y: number;
  }
  
  export interface Game {
    scoreLeft: number;
    scoreRight: number;
    xBall: number; 
    yBall: number; 
    xSpeed: number; 
    ySpeed: number; 
    victoryPoints: number;
    ballRadius: number;
    canvasWidth: number;
    canvasHeight: number;
    paddleWidth: number;
    paddleHeight: number;
    leftPaddlePositionY: number;
    rightPaddlePositionY: number;
    intervalId: NodeJS.Timeout;
    private: Boolean
  }


@Injectable()
export class RoomStoreService {
    mapPlayer: Map<string, {
        "map": Map<string, GamePlayer>, 
        "players": string[], 
        "game": Game
      }> = new Map();
    //   mapPlayer["room1"] = {"map": ["Player1"] => {name: "Player1", x: 0, y: 112}, ["Player2"] => {name: "Player2", x: 800, y: 120}, {"players": ["Player1", "Player2"]}}

    getMapPong(): Map<string, {
        "map": Map<string, GamePlayer>, 
        "players": string[], 
        "game": Game
    }> {
        return this.mapPlayer;
    }

}