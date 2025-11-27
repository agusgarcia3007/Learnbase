import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
