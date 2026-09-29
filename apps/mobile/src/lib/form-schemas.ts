import { z } from 'zod';

/**
 * Skema validasi form Profil dengan Zod.
 */
export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(30, 'Name must be at most 30 characters'),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  tint: z.string().min(1, 'Avatar color is required'),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

/**
 * Skema validasi form New Trip dengan Zod.
 */
export const newTripFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Trip name is required')
    .min(3, 'Trip name must be at least 3 characters')
    .max(50, 'Trip name must be at most 50 characters'),
  limitStr: z
    .string()
    .min(1, 'Limit is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 10, {
      message: 'Minimum limit is $10',
    })
    .refine((val) => !isNaN(Number(val)) && Number(val) <= 5000, {
      message: 'Maximum limit is $5,000',
    }),
  endsAt: z.date().refine((val) => val.getTime() > Date.now(), {
    message: 'End date must be in the future',
  }),
});

export type NewTripFormData = z.infer<typeof newTripFormSchema>;

/**
 * Skema validasi form Pembayaran dari Kas (Pay from pot) dengan Zod.
 */
export const createPaySchema = (potMax: number) =>
  z
    .object({
      amountStr: z
        .string()
        .min(1, 'Amount is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
          message: 'Enter an amount greater than $0',
        })
        .refine((val) => Number(val) <= potMax, {
          message: `Cannot exceed pot balance ($${potMax.toLocaleString()})`,
        }),
      split: z.enum(['equal', 'custom']),
      customShares: z.record(z.string(), z.string()),
      included: z.record(z.string(), z.boolean()),
    })
    .superRefine((data, ctx) => {
      const amt = Number(data.amountStr) || 0;
      const totalIncluded = Object.values(data.included).filter(Boolean).length;
      if (totalIncluded === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select at least 1 person to include',
          path: ['included'],
        });
      }
      if (data.split === 'custom') {
        let customSum = 0;
        for (const [id, isInc] of Object.entries(data.included)) {
          if (isInc) {
            customSum += parseInt(data.customShares[id] || '0', 10);
          }
        }
        if (customSum !== amt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Custom split total ($${customSum}) must equal $${amt}`,
            path: ['split'],
          });
        }
      }
    });

export type PayFormData = z.infer<ReturnType<typeof createPaySchema>>;
