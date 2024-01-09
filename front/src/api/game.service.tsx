import axios from 'axios';

export interface Game {
    id: string;
}


export class GameService {

    static async createOrJoinGame(): Promise<Game> {
        try {
            const res =  await axios.post('http://localhost:3333/game/classic');
            return { id: res.data.roomName };
        }
        catch (err) {
            console.log("error createOrJoinGame", err);
            throw new Error('Error creating game');
        }
    }

    static async createPrivateGame( 
        ySpeed: number, 
        xSpeed: number, 
        ballRadius: number, 
        victoryPoint : number, 
        paddleHeight: number, 
        paddleWidth: number): Promise<Game> {
        try {
            const res =  await axios.post('http://localhost:3333/game/private', {
                ySpeed: ySpeed,
                xSpeed: xSpeed,
                ballRadius: ballRadius,
                victoryPoint: victoryPoint,
                paddleHeight: paddleHeight,
                paddleWidth: paddleWidth,
            });
            return { id: res.data.roomName };
        }
        catch (err) {
            console.log("error createPrivateGame", err);
            throw new Error('Error creating private game');
        }

    }
}
