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
                role: 'user',
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
async createReview(userId: string, rating: number, comment: string, claimId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // ✅ Optional: Check if user already reviewed this claim
    if (claimId) {
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('claim_id', claimId)
        .single();
      
      if (existingReview) {
        throw new Error('You have already reviewed this claim');
      }
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({ 
        user_id: userId, 
        rating, 
        comment, 
        claim_id: claimId, // ✅ Save the claim ID
        is_public: true // Auto-approve for demo purposes
      }) 
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  }

 async getPublicReviews() {
    const supabase = this.supabaseService.getAdminClient();
    
    // Attempt simpler join syntax first
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users!user_id(display_name)') // !user_id explicitly tells PostgREST which FK to use
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
        this.logger.error("Failed to fetch reviews:", error);
        // Fallback: If join fails, just return reviews without user names to prevent crashing
        const { data: rawData } = await supabase
            .from('reviews')
            .select('*')
            .eq('is_public', true)
            .limit(10);
        return rawData || [];
    }
    
    // Map the result if necessary (PostgREST returns it as a nested object)
    // The frontend expects: review.users.display_name
    return data || [];
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
  async markNotificationRead(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    return { success: true };
  }
  async getNotifications(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data;
  }

  async updateWalletAddress(userId: string, walletAddress: string) {
    // Fix: Use camelCase property name to match DTO
    return this.update(userId, { walletAddress });
  }
}