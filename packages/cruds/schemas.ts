import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  followers: z.array(z.string()).default([]),
  preferences: z.object({
    language: z.enum(['en', 'jp']).default('en'),
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(true),
    }),
  }),
  bio: z.string().nullish(),
});
