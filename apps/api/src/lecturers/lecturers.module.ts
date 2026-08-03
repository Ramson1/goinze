import { Module } from '@nestjs/common';
import { LecturersMeService } from './lecturers-me.service';
import { LecturersMeController } from './lecturers-me.controller';

@Module({
  controllers: [LecturersMeController],
  providers: [LecturersMeService],
  exports: [LecturersMeService],
})
export class LecturersModule {}
