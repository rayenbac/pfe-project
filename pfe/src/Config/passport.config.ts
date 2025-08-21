import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { User } from '../Models/user';
import { UserRole } from '../Constants/enums';
import { Request } from 'express';

// No need for additional User interface declaration here
// The AuthenticatedUser interface in auth.d.ts handles this

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: 'http://localhost:3000/api/auth/google/callback',
  passReqToCallback: true
}, async (
  req: Request,
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: VerifyCallback
) => {
  try {
    let user = await User.findOne({ email: profile.emails?.[0].value });
    if (!user) {
      user = await User.create({
        firstName: profile.name?.givenName || 'Google',
        lastName: profile.name?.familyName || 'User',
        email: profile.emails?.[0].value,
        password: 'google-oauth', // or a random string
        phone: '0000000000', // or prompt later
        isVerified: true,
        role: UserRole.USER
      });
    }
    return done(null, user as any);
  } catch (err) {
    return done(err as Error, undefined);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user as any);
  } catch (err) {
    done(err as Error, null);
  }
}); 