import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TeamGeneratorModule } from './team-generator/team-generator.module';
import { MulterModule } from '@nestjs/platform-express';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    CommonModule,
    TeamGeneratorModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
