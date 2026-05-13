import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { PrismaService } from '../shared/prisma.service';

@Module({
  controllers: [HabitsController],
  providers: [HabitsService, PrismaService],
  exports: [HabitsService],
})
export class HabitsModule {}