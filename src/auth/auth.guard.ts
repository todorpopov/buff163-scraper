import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Res,
    UnauthorizedException,
  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
  
  @Injectable()
  export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private configService: ConfigService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const token = await this.extractTokenFromCookies(request);

      console.log("\n\nToken taken from cookies: " + token)
      
      if (!token) {
        throw new UnauthorizedException("1");
      }

      try {
        const payload = await this.jwtService.verifyAsync(token)
        request['user'] = payload
      } catch {
        throw new UnauthorizedException("2");
      }

      return true;
    }
  
    private async extractTokenFromCookies(@Res() request: Request): Promise<string> | undefined {
      const token = request.cookies.token
      if (token) {
        return token;
      }
      return null;
    }
  }