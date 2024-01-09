import { v4 as uuidv4 } from 'uuid';
import { RoomStoreService } from '../store/room-store.service';
import { GameDto } from './game-dto';

interface Room {
    name: string;
}



export class CreatePrivateGame {

    constructor(private roomStoreService: RoomStoreService) { }

    async handle(dto: GameDto): Promise<Room> {
        const ballXSpeed = [1.5, 3, 4.5]
        const ballYSpeed = [1.5, 3, 4.5]
        
        const paddleWidth = [3, 6, 9]
        const paddleHeight = [50, 100, 150]

        const ballRadius = [10, 15, 20]

        const uuid = this.generateUuid();
        this.roomStoreService.getMapPong().set(uuid, {
            "map": new Map(), "players": [], "game": {
                scoreLeft: 0,
                scoreRight: 0,
                xBall: 200,
                yBall: 200,
                xSpeed: ballXSpeed[dto.xSpeed - 1],
                ySpeed: ballYSpeed[dto.ySpeed - 1],
                victoryPoints: dto.victoryPoint,
                ballRadius: ballRadius[dto.ballRadius - 1],
                canvasWidth: 800,
                canvasHeight: 400,
                paddleHeight: paddleHeight[dto.paddleHeight - 1],
                paddleWidth: paddleWidth[dto.paddleWidth - 1],
                leftPaddlePositionY: 100,
                rightPaddlePositionY: 100,
                intervalId: null,
                private: true
            }
        })
        return { name: uuid };
    }

    generateUuid(): string {
        return uuidv4();
    }
}