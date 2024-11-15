import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  followers: z.array(z.string()),
  preferences: z.object({
    language: z.enum(['en', 'jp']),
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
    }),
  }),
  bio: z.string().nullish(),
});
