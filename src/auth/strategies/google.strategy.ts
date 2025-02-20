// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy, Profile } from 'passport-google-oauth20';
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { AuthService } from '../auth.service';

// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
//   constructor(
//     private configService: ConfigService,
//     private authService: AuthService,
//   ) {
//     super({
//       clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
//       clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
//       callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
//       scope: ['email', 'profile'],
//     });
//   }

//   async validate(accessToken: string, refreshToken: string, profile: Profile) {
//     const user = await this.authService.validateOAuthUser({
//       // username: profile.,
//       // email: profile.emails[0].value,
//       // name: profile.displayName,
//       // picture: profile.photos[0].value,
//       // provider: profile.provider,
//       // providerId: profile.id,
//     });
//     return user;
//   }
// }
