import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { Document } from './documents/document.entity';
import { ProfileController } from './auth/profile.controller';
import { DocumentsModule } from './documents/documents.module';
import { DocumentsController } from './documents/documents.controller';

@Module({
  controllers: [ProfileController, DocumentsController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [User, Document],
        synchronize: true, // for development only
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,  
    DocumentsModule,
  ],
})
export class AppModule {}