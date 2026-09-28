import 'dotenv/config'
const required = ['DATABASE_URL', 'JWT_SECRET']
if (process.env.NODE_ENV !== 'test') required.forEach((key) => { if (!process.env[key]) console.warn(`[config] Falta ${key}; revisa backend/.env`) })
export const env = { nodeEnv: process.env.NODE_ENV || 'development', port: Number(process.env.PORT || 8080), databaseUrl: process.env.DATABASE_URL, frontendUrl: process.env.FRONTEND_URL || 'http://127.0.0.1:5174', jwtSecret: process.env.JWT_SECRET || 'development-only-secret', jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h', cookieName: process.env.COOKIE_NAME || 'justiturno_session', timezone: process.env.APP_TIMEZONE || 'America/Bogota' }
