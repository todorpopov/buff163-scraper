import { Body, Res, Controller, Post, HttpCode, HttpStatus, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response , Request} from 'express'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @ApiOperation({ summary: 'Login endpoint. Username and password expected as a JSON in the body of the request.' })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(@Body() signInDto: Record<string, any>, @Res({ passthrough: true }) response: Response) {
        const token = await this.authService.signIn(signInDto.username, signInDto.password)
        response.cookie('token', token, { 
            sameSite: "none",
            secure: true, 
        })
        console.log("\n\nToken saved to cookies: " + token)
        return { username: signInDto.username }
    }

    // @ApiOperation({ summary: 'Login endpoint. Username and password expected as a JSON in the body of the request.' })
    // @HttpCode(HttpStatus.OK)
    // @Get('login')
    // async testSignIn(@Res({ passthrough: true }) response: Response) {
    //     const token = await this.authService.signIn('admin', 'admin')
    //     response.cookie('token', token)//, { maxAge: 60 * 60 * 1 })
    //     console.log("\n\nToken saved to cookies: " + token)
    //     return { username: 'admin' }
    // }

    @ApiOperation({ summary: 'Return the current logged in user' })
    @Get('current_user')
    async currentUser(@Req() request: Request){
        const token = request.cookies.token
        console.log("\n\nToken from cookies: " + token)
        if (token) {
            const userDetails = this.parseJwt(token)
            return { user: {username: userDetails.username} }
        }
        return { user: null }
    }



    private parseJwt(token: string) {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    }
}