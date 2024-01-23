import { Body, Res, Controller, Post, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response , Request} from 'express'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @ApiOperation({ summary: 'Login endpoint. Username and password expected as a JSON in the body of the request.' })
    @Post('login')
    async signIn(@Body() signInDto: Record<string, any>, @Res({ passthrough: true }) response: Response) {
        const token = await this.authService.signIn(signInDto.username, signInDto.password)
        response.cookie('token', token, { 
            sameSite: "none",
            secure: true, 
        })
        return { username: signInDto.username }
    }

    @ApiOperation({ summary: 'Logout endpoint' })
    @Post('logout')
    async logout(@Res({ passthrough: true }) response: Response){
        
        response.clearCookie('token', { 
            sameSite: "none",
            secure: true, 
        })

        return { msg: "Logged out!" }
    }

    @ApiOperation({ summary: 'Return the current logged in user' })
    @Get('current_user')
    async currentUser(@Req() request: Request){
        const token = request.cookies.token
        if (token) {
            const tokenDetails = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            return { user: {username: tokenDetails.username} }
        }
        return { user: null }
    }
}