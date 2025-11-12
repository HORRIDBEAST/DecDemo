// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { PassportStrategy } from '@nestjs/passport';
// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
// /*************  ✨ Windsurf Command ⭐  *************/
//   /**
//    * Constructor for JwtStrategy.
//    * @param {ConfigService} configService - Injected ConfigService.
//    * JWT_SECRET is used to sign and verify JWT tokens.
//    * If JWT_SECRET is not set in .env, 'secretKey' is used as default.
//    */
// /*******  df0e2efb-5ec4-403a-bfa6-a676de41b871  *******/  constructor(configService: ConfigService) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: configService.get('JWT_SECRET') || 'secretKey', // Add JWT_SECRET to .env if using JWT
//     });
//   }

//   async validate(payload: any) {
//     // Validate payload and return user
//     return { userId: payload.sub, email: payload.email };
//   }
// }