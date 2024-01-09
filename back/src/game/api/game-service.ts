import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { v4 as uuidv4 } from 'uuid';

export interface StatsByUser {
    gamesPlayed: number;
    gamesWin: number;
    username: string;
}

export interface UserHistoric {
    utcDate: string;
    win: boolean;
    opponentId: number;
    opponentUsername: string;
    score_winner: number;
    score_looser: number;
}

@Injectable()
export class GameService {
    constructor(
        private prisma: PrismaService
    ) { }

    async Insert(usernameWinner: string, usernameLooser: string, scoreWinner: number, scoreLooser: number) {
        const userIdWinner = await this.findUserIdByUsername(usernameWinner);
        const userIdLooser = await this.findUserIdByUsername(usernameLooser);
        console.log("user by id")
        console.log(userIdWinner)
        console.log(userIdLooser)
        // const userIdWinner = 1;
        // const userIdLooser = 2;
        const isoString = this.getDateInISOString();
        const uuid = this.generateUuid();
        await this.prisma.game.create({
            data: {
                id: uuid,
                winner_id: userIdWinner,
                looser_id: userIdLooser,
                score_winner: scoreWinner,
                score_looser: scoreLooser,
                end_timestamp: isoString
            },
        });

        const userDb = await this.prisma.user.findFirst({ where: { fortytwo_id: userIdWinner } })
        await this.prisma.user.update({
            where: { fortytwo_id: userIdWinner },
            data: { win: userDb.win + 1 }
        })

    }

    async GetStatByUserId(id: number): Promise<StatsByUser> {
        // const userId = await this.findUserIdByUsername(username);
        const userId = id
        const username = "john"
        const games = await this.findGamesWonByUser(userId);
        if (games === null) {
            return {
                gamesPlayed: 0,
                gamesWin: 0,
                username
            }
        }
        const gamePlayed = await this.findGamesPlayed(userId);
        if (gamePlayed === null) {
            return {
                gamesPlayed: 0,
                gamesWin: games.length,
                username
            }
        }
        return {
            gamesPlayed: gamePlayed.length,
            gamesWin: games.length,
            username
        }
    }

    private async findGamesWonByUser(winnerId: number): Promise<{
        id: string;
        winner_id: number;
        looser_id: number;
        end_timestamp: Date;
        score_winner: number;
        score_looser: number;
    }[] | null> {
        try {
            const games = await this.prisma.game.findMany({
                where: {
                    winner_id: winnerId
                }
            });

            return games;
        } catch (error) {
            console.error("Error fetching games:", error);
            return null;
        }
    }


    private async findGamesPlayed(userId: number): Promise<{
        id: string;
        winner_id: number;
        looser_id: number;
        end_timestamp: Date;
        score_winner: number;
        score_looser: number;
    }[] | null> {
        try {
            const games = await this.prisma.game.findMany({
                where: {
                    OR: [
                        { winner_id: userId },
                        { looser_id: userId }
                    ]
                },
                orderBy: {
                    end_timestamp: 'desc'
                }
            });

            return games;
        } catch (error) {
            console.error("Error fetching games:", error);
            return null;
        }
    }

    async GetUserHistoric(id: number): Promise<UserHistoric[]> {
        try {
            const games = await this.findGamesPlayed(id)
            const looserIds = games.map(game => game.looser_id)
            const winnerIds = games.map(game => game.winner_id)

            const ids = new Set<number>([...looserIds, ...winnerIds])

            const users = await this.prisma.user.findMany({
                where: {
                    fortytwo_id: {
                        in: [...ids]
                    }
                }
            })
            const result = games.map((game) => {
                const opponentId = game.winner_id === id ? game.looser_id : game.winner_id;
                const user = users.find((user) => user.fortytwo_id === opponentId)
                return {
                    utcDate: game.end_timestamp.toISOString(),
                    win: game.winner_id === id,
                    opponentId: opponentId,
                    opponentUsername: user.pseudo,
                    score_winner: game.score_winner,
                    score_looser: game.score_looser
                }
            })

            return result;
        } catch (error) {
            console.error("Error fetching games:", error);
            return [];
        }
    }

    private async findUserIdByUsername(username: string): Promise<number | null> {
        try {
            const user = await this.prisma.user.findFirst({
                where: {
                    pseudo: username
                },
                select: {
                    fortytwo_id: true
                }
            });

            if (user) {
                return user.fortytwo_id;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    }

    getDateInISOString(): string {
        const now = new Date();
        const timeOffsetInMinutes = now.getTimezoneOffset();

        const utcDate = new Date(now.getTime() - timeOffsetInMinutes * 60000);

        return new Date(utcDate.getTime()).toISOString();
    }

    generateUuid(): string {
        return uuidv4();
    }

}