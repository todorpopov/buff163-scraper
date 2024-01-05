import { Body, Res, Controller, Post, HttpCode, HttpStatus, Param } from '@nestjs/common';
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
  async signIn(@Body() signInDto: Record<string, any>, @Res({ passthrough: true }) response: Response) {
    const token = await this.authService.signIn(signInDto.username, signInDto.password)
    response.cookie('token', token, { maxAge: 60 * 60 * 1 })
    console.log("\n\nToken saved to cookies: " + token)
    return {msg: 'Logged in'}
  }

  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // async testingEndpoint(@Res({ passthrough: true }) response: Response) {
  //   const token = await this.authService.signIn("admin", "admin")
  //   response.cookie('token', token)
  //   console.log("\n\nSaved to cookies: " + token)
  //   return {msg: 'Logged in'}
  // }
}