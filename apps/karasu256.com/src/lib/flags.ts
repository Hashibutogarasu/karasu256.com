import { z } from 'zod';

export const appFlagsSchema = z.object({
  testFlag: z.boolean(),
});

export type AppFlags = z.infer<typeof appFlagsSchema>;
