import { Body, Res, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login endpoint. Username and password expected as a JSON in the body of the request.' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>, @Res({ passthrough: true }) response: Response) {
    const token = this.authService.signIn(signInDto.username, signInDto.password)
    response.cookie('jwt', token)
    return token
  }
}