import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async signIn(username: string, pass: string) {
        const user = await this.usersService.findOne(username);
        if(!user){
            throw new Error("User does not exist!")
        }

        if (user.password !== pass) {
            throw new UnauthorizedException();
        }
        
        const payload = { username: user.username };
        return await this.jwtService.signAsync(payload)
    }
}