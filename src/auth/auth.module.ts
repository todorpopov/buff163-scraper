import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule,
    UsersModule,
    JwtModule.register({
      global: true,
      secret: `TEST SECRET, NOT INTENDED TO STAY LIKE THIS IN PRODUCTION`,
      signOptions: { expiresIn: "1h" }
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
