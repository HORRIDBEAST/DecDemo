// import { Injectable, Logger } from '@nestjs/common';
// import { SupabaseService } from '../supabase/supabase.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

// @Injectable()
// export class UsersService {
//   private readonly logger = new Logger(UsersService.name);

//   constructor(private supabaseService: SupabaseService) {}

//   async create(createUserDto: CreateUserDto) {
//     const supabase = this.supabaseService.getAdminClient();
    
//     const { data, error } = await supabase
//       .from('users')
//       .insert([createUserDto])
//       .select()
//       .single();

//     if (error) {
//       this.logger.error('Error creating user:', error);
//       throw error;
//     }

//     return data;
//   }

//   async findById(id: string) {
//     const supabase = this.supabaseService.getAdminClient();
    
//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('id', id)
//       .single();

//     if (error && error.code !== 'PGRST116') { // Not found error
//       this.logger.error('Error finding user:', error);
//       throw error;
//     }

//     return data;
//   }

//   async update(id: string, updateUserDto: UpdateUserDto) {
//     const supabase = this.supabaseService.getAdminClient();
    
//     const { data, error } = await supabase
//       .from('users')
//       .update(updateUserDto)
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) {
//       this.logger.error('Error updating user:', error);
//       throw error;
//     }

//     return data;
//   }

//   async updateWalletAddress(userId: string, walletAddress: string) {
//     // Fix: Use camelCase property name to match DTO
//     return this.update(userId, { walletAddress });
//   }
// }
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

    constructor(private supabaseService: SupabaseService) {}

    async create(createUserDto: CreateUserDto) {
        const supabase = this.supabaseService.getAdminClient();
        
        // <-- FIX: Map DTO camelCase to database snake_case.
        const { data, error } = await supabase
            .from('users')
            .insert({
                id: createUserDto.id,
                email: createUserDto.email,
                display_name: createUserDto.displayName,
                wallet_address: createUserDto.walletAddress,
            })
            .select()
            .single();

        if (error) {
            this.logger.error('Error creating user:', error);
            throw new Error(error.message);
        }
        return data;
    }

  async findById(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      this.logger.error('Error finding user:', error);
      throw error;
    }

    return data;
  }

   async update(id: string, updateUserDto: UpdateUserDto) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Map camelCase to snake_case for database
    const updateData: any = {};
    if (updateUserDto.displayName !== undefined) updateData.display_name = updateUserDto.displayName;
    if (updateUserDto.walletAddress !== undefined) updateData.wallet_address = updateUserDto.walletAddress;
    if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }

    return data;
  }

  async updateWalletAddress(userId: string, walletAddress: string) {
    // Fix: Use camelCase property name to match DTO
    return this.update(userId, { walletAddress });
  }
}