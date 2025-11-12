
// import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// interface FileUploadOptions {
//     contentType: string;
//     upsert?: boolean;
// }
// @Injectable()
// export class SupabaseService {
//     private readonly logger = new Logger(SupabaseService.name);
//     private adminSupabase: SupabaseClient;

//     constructor(private configService: ConfigService) {}

//     onModuleInit() {
//         // ... this part is correct and remains unchanged
//         const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
//         const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

//         if (!supabaseUrl || !supabaseServiceKey) {
//             throw new Error('Missing Supabase URL or Service Key.');
//         }

//         this.adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
//             auth: { autoRefreshToken: false, persistSession: false },
//         });
//         this.logger.log('Supabase admin client initialized.');
//     }

//     getAdminClient(): SupabaseClient {
//         return this.adminSupabase;
//     }

//     // <-- CRITICAL FIX: This function now correctly extracts and returns the User object.
//     async verifyToken(token: string): Promise<User> {
//         const { data: { user }, error } = await this.getAdminClient().auth.getUser(token);

//         if (error || !user) {
//             this.logger.error('Token verification error:', error);
//             throw new BadRequestException(error?.message || 'Invalid token');
//         }
//         return user; // Return the user object directly
//     }

//      async uploadFile(bucket: string, path: string, file: Buffer, options: FileUploadOptions): Promise<string> {
//         const { error } = await this.getAdminClient().storage
//             .from(bucket)
//             .upload(path, file, {
//                 contentType: options.contentType, // Use the contentType from the options
//                 upsert: options.upsert ?? false,
//             });

//         if (error) {
//             this.logger.error('File upload error:', error);
//             throw new BadRequestException(`File upload failed: ${error.message}`);
//         }
//         return this.getPublicUrl(bucket, path);
//     }

//     getPublicUrl(bucket: string, path: string): string {
//         const { data } = this.getAdminClient().storage.from(bucket).getPublicUrl(path);
//         return data.publicUrl;
//     }
// }

import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private adminSupabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase URL or Service Key.');
    }

    this.adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.logger.log('Supabase admin client initialized.');
  }

  getAdminClient(): SupabaseClient {
    return this.adminSupabase;
  }

  async verifyToken(token: string): Promise<User> {
    const { data: { user }, error } = await this.adminSupabase.auth.getUser(token);
    if (error || !user) {
      throw new BadRequestException(error?.message || 'Invalid token');
    }
    return user;
  }

  async uploadFile(bucket: string, path: string, file: Buffer, options: { contentType: string; upsert?: boolean }): Promise<string> {
    const { error } = await this.adminSupabase.storage
      .from(bucket)
      .upload(path, file, { 
        contentType: options.contentType, 
        upsert: options.upsert ?? false 
      });

    if (error) {
      this.logger.error('File upload error:', error);
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
    return this.getPublicUrl(bucket, path);
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.adminSupabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}