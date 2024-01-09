import { v4 as uuidv4 } from 'uuid';
import { RoomStoreService } from '../store/room-store.service';


interface Room {
    name: string;
}

export class CreatePublicGame {

    constructor(private roomStoreService: RoomStoreService) { }

    async handle(): Promise<Room> {
        // on regarde si i a déjà une partie ouvert

        const roomNames = Array.from(this.roomStoreService.getMapPong().keys())
        let roomAvailable: string | null = null;
        roomNames.forEach((roomName) => {
            const hasOnePlayer = this.roomStoreService.getMapPong().get(roomName).players.length != 2;
            if (hasOnePlayer) {
                roomAvailable = roomName;
                return;
            }
        })

        if (roomAvailable !== null) {
            return { name: roomAvailable };
        }

        const uuid = this.generateUuid();
        this.roomStoreService.getMapPong().set(uuid, {
            "map": new Map(), "players": [], "game": {
                scoreLeft: 0,
                scoreRight: 0,
                xBall: 200,
                yBall: 200,
                xSpeed: 3,
                ySpeed: 3,
                canvasWidth: 800,
                canvasHeight: 400,
                paddleWidth: 3,
                paddleHeight: 100,
                leftPaddlePositionY: 100,
                rightPaddlePositionY: 100,
                victoryPoints: 5,
                ballRadius: 10,
                intervalId: null,
                private: false
            }
        })

        return { name: uuid };
    }

    generateUuid(): string {
        return uuidv4();
    }
}