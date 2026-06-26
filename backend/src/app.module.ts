import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './clients/clients.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ClientsModule, OpportunitiesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
