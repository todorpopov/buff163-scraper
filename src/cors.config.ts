import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://scraperfe.vercel.app',
      'http://localhost:3000',
    ];

    const allowedOriginsPattern =
      /^https:\/\/scraperfe-git-[a-zA-Z0-9-]+-ai-software\.vercel\.app$/;

    if (!origin) {
      callback(null, true);
    } else if (
      allowedOrigins.includes(origin) ||
      allowedOriginsPattern.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
