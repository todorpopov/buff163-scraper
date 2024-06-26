import { Injectable } from '@nestjs/common';

export type User = {
  id: number,
  username: string,
  password: string
};

@Injectable()
export class UsersService {
  private readonly users = [
    {
      id: 1,
      username: 'admin',
      password: 'admin',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}