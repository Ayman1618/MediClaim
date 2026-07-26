/**
 * Application configuration factory.
 *
 * Maps environment variables to a typed configuration object.
 * Loaded once at startup via ConfigModule.forRoot({ load: [configuration] }).
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/mediclaim',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'insecure_fallback_secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  uploads: {
    directory: process.env.UPLOAD_DIRECTORY ?? './uploads',
    maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  },
});
