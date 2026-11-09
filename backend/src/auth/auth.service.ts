import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
  const user = await this.usersService.findByUsername(username);
  
  if (!user) {
    return null; // no user found
  }

  const isPasswordValid  = await bcrypt.compare(password, user.password);
  // console.log("HERE1= ", isPasswordValid);

  if (user && isPasswordValid ) {
    const { password, ...result } = user;
    return result; // return a truthy value
  }
  return null; // triggers 401 Unauthorized
}

async register(dto: CreateUserDto) {
  const user = await this.usersService.create(dto);
  // console.log("HERE2= ", user);
  const payload = { username: user.username, sub: user.id };
  return {
    access_token: this.jwtService.sign(payload),
  };
}

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
