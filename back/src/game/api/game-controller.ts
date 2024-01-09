

import { Body, Controller, Get, Param, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { GameDto, GameResponse } from './game-dto';
import { CreatePublicGame } from './create-public-game';
import { CreatePrivateGame } from './create-private-game';
import { RoomStoreService } from '../store/room-store.service';
import { GameRankingResponse } from './ranking-dto';
import { RankingService } from './ranking-service';
import { GameService, StatsByUser, UserHistoric } from './game-service';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';

@Controller('game')
export class GameController {

    constructor(private roomStoreService: RoomStoreService, private rankingService: RankingService, private gameService: GameService) { }

    @Post('classic')
    @UsePipes(new ValidationPipe())
    async classicGame(): Promise<GameResponse> {
        const createPublicGame = new CreatePublicGame(this.roomStoreService);
        const roomName = await createPublicGame.handle();
        //console.log(this.roomStoreService.getMapPlayer());
        return { roomName: roomName.name };
    }

    @Post('private')
    @UsePipes(new ValidationPipe())
    async privateGame(@Body() gameDto: GameDto): Promise<GameResponse> {
        const createPrivateGame = new CreatePrivateGame(this.roomStoreService);
        const roomName = await createPrivateGame.handle(gameDto);
        return { roomName: roomName.name };
    }


    @Get('ranking')
    @UsePipes(new ValidationPipe())
    async getGameRanking(@Body() gameDto: GameDto): Promise<GameRankingResponse> {

        const leaderBoard = await this.rankingService.getLeaderBoardRanking();
        return { leaderbord: leaderBoard.leaderbord };
    }

    // @Get('users/:id')
    // @UsePipes(new ValidationPipe())
    // async getStatByUser(@Param('id') userId: string): Promise<StatsByUser> {
    //     const id = Number(userId)
    //     const stats = await this.gameService.GetStatByUserId(id);
    //     return stats;
    // }

    @Get('users/me')
    @UseGuards(JwtGuard)
    @UsePipes(new ValidationPipe())
    async getUserHistoric(@Param('id') userId: string, @GetUser() user: User): Promise<UserHistoric[]> {
        // const id = Number(userId)
        const historic = await this.gameService.GetUserHistoric(user.fortytwo_id);
        return historic;
    }

}
