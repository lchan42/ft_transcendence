import { Module } from '@nestjs/common';
import { GameController } from './api/game-controller';
import { EventsGateway } from './event/events.gateway';
import { RoomStoreService } from './store/room-store.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GameService } from './api/game-service';
import { RankingService } from './api/ranking-service';
import { ChatModule } from 'src/chat/chat.module';
import { PrismaClient } from '@prisma/client';


@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [GameController],
  providers: [
    /*{
      provide: EventsGateway,
      useValue: new EventsGateway(new RoomStoreService(), 10, 60)
    },*/
    EventsGateway,
    RoomStoreService, GameService, PrismaClient, RankingService],
})
export class GameModule { }
