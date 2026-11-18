import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './index';
import { prisma } from '../services/prisma.service';

if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google OAuth profile'), false);
          }

          const googleId = profile.id;
          const name = profile.displayName || email.split('@')[0];
          const avatar = profile.photos?.[0]?.value || null;

          
          let user = await prisma.user.findFirst({
            where: {
              OR: [{ googleId }, { email }],
            },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                googleId,
                email,
                name,
                avatar,
              },
            });
          } else if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId, avatar: avatar || user.avatar },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error, false);
        }
      }
    )
  );
} else {
  console.warn('[Passport] Google OAuth credentials not configured in environment variables. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
