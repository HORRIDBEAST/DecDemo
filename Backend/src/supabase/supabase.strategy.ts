// // import { Injectable, UnauthorizedException } from '@nestjs/common';
// // import { PassportStrategy } from '@nestjs/passport';
// // import { Strategy } from 'passport-custom';
// // import { AuthService } from '../auth/auth.service';

// // @Injectable()
// // export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
// //   constructor(private authService: AuthService) {
// //     super();
// //   }

// //   async validate(req: any): Promise<any> {
// //     const token = req.headers.authorization?.replace('Bearer ', '');
// //     if (!token) {
// //       throw new UnauthorizedException('No token provided');
// //     }

// //     const { user } = await this.authService.validateSupabaseToken(token);
// //     return user;
// //   }
// // }

// import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// @Injectable()
// export class SupabaseService {
//     private readonly logger = new Logger(SupabaseService.name);
//     private adminSupabase: SupabaseClient;

//     constructor(private configService: ConfigService) {}

//     onModuleInit() {
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

//     async verifyToken(token: string): Promise<User> {
//         const { data: { user }, error } = await this.getAdminClient().auth.getUser(token);
//         if (error || !user) {
//             throw new BadRequestException(error?.message || 'Invalid token');
//         }
//         return user;
//     }

//     // <-- FIX: Corrected method signature and implementation for file uploads.
//     async uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string> {
//         const { error } = await this.getAdminClient().storage
//             .from(bucket)
//             .upload(path, file, { contentType, upsert: false });

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