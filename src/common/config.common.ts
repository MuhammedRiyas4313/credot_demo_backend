import * as dotenv from "dotenv";
import { parseEnv, port, z } from "znv";
dotenv.config({ override: true });

dotenv.config({ path: ".env.local", override: true });

export const CONFIG = parseEnv(process.env, {
  URL: z.string(),
  PORT: port().default(3000),
  MONGOURI: z.string(),
  JWT_ACCESS_TOKEN_SECRET: z.string(),
});

export const API_PATHS = [
  `./src/v1/routes/user.routes.ts`,
];
