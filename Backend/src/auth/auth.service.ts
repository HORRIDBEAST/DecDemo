// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { SupabaseService } from '../supabase/supabase.service';
// import { UsersService } from '../users/users.service';

// @Injectable()
// export class AuthService {
//   constructor(
//     private supabaseService: SupabaseService,
//     private usersService: UsersService,
//   ) {}

//   async validateSupabaseToken(token: string) {
//     try {
//       const { user } = await this.supabaseService.verifyToken(token);
      
//       if (!user) {
//         throw new UnauthorizedException('Invalid token');
//       }

//       // Get or create user in our database
//       let dbUser = await this.usersService.findById(user.id);
//       if (!dbUser) {
//         dbUser = await this.usersService.create({
//           id: user.id,
//           email: user.email || '',
//           displayName: user.user_metadata?.full_name || user.user_metadata?.name || '',
//         });
//       }

//       return { user: dbUser, supabaseUser: user };
//     } catch (error) {
//       throw new UnauthorizedException('Invalid Supabase token');
//     }
//   }

//   async login(token: string) {
//     const { user } = await this.validateSupabaseToken(token);
//     return {
//       user,
//       message: 'Login successful',
//     };
//   }
// }

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { User } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private usersService: UsersService,
  ) {}

  // <-- FIX: Renamed 'user' to 'supabaseUser' for clarity and removed incorrect destructuring.
  async validateSupabaseToken(token: string): Promise<{ user: any; supabaseUser: User }> {
    try {
      const supabaseUser = await this.supabaseService.verifyToken(token);
      
      let dbUser = await this.usersService.findById(supabaseUser.id);
      if (!dbUser) {
        dbUser = await this.usersService.create({
          id: supabaseUser.id,
          email: supabaseUser.email ?? 'no-email@example.com',
          displayName: supabaseUser.user_metadata?.displayName ?? supabaseUser.user_metadata?.name,
        });
      }
      return { user: dbUser, supabaseUser };
    } catch (error) {
      throw new UnauthorizedException(`Invalid Supabase token: ${error.message}`);
    }
  }

  async login(token: string) {
    const { user } = await this.validateSupabaseToken(token);
    return {
      user,
      message: 'Login successful',
    };
  }
}