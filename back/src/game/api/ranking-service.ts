import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GameRankingResponse } from "./ranking-dto";

@Injectable()
export class RankingService {
    constructor(
        private prisma: PrismaService
    ) { }

    async getLeaderBoardRanking(): Promise<GameRankingResponse> {
        
        return null;
    }
}