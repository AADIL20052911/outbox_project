import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import passport from './config/passport';
import { config } from './config';
import authRoutes from './modules/auth/auth.routes';
import emailRoutes from './modules/emails/email.routes';
import slackRoutes from './modules/slack/slack.routes';
import devRoutes from './modules/dev/dev.routes';
import { serverAdapter } from './queue/email.queue';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

// Trust reverse proxy (Render, Heroku, etc.) so secure cookies work behind SSL terminators
app.set('trust proxy', 1);

// Normalize frontend URL and allow Vercel origins
const allowedFrontendUrl = config.frontendUrl.replace(/\/$/, '');

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);
      const cleanOrigin = requestOrigin.replace(/\/$/, '');
      if (
        cleanOrigin === allowedFrontendUrl ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

const sessionRedisClient = createClient({
  url: config.redisUrl,
});

sessionRedisClient.on('error', (err) => {
  console.error('[Session Redis] Error:', err);
});

sessionRedisClient.connect().catch((err) => {
  console.error('[Session Redis] Connection failed:', err);
});

const isHttps = config.nodeEnv === 'production' || config.frontendUrl.startsWith('https://');

app.use(
  session({
    store: new RedisStore({
      client: sessionRedisClient,
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());


app.use('/admin/queues', serverAdapter.getRouter());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ReachInbox Email Scheduler API is running',
    status: 'healthy',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'reachinbox-backend',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);


app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api/dev', devRoutes);


app.use(errorHandler);

export default app;
