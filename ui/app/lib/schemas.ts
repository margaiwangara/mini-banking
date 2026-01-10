import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  currency: z.enum(['USD', 'EUR'], {
    required_error: 'Please select a currency',
  }),
});

export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, 'Please select source account'),
    toAccountId: z.string().min(1, 'Please select destination account'),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: 'Amount must be a positive number',
      }),
    description: z.string().optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Source and destination accounts must be different',
    path: ['toAccountId'],
  });

export const exchangeSchema = z
  .object({
    fromAccountId: z.string().min(1, 'Please select source account'),
    toAccountId: z.string().min(1, 'Please select destination account'),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: 'Amount must be a positive number',
      }),
    description: z.string().optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Source and destination accounts must be different',
    path: ['toAccountId'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateAccountFormData = z.infer<typeof createAccountSchema>;
export type TransferFormData = z.infer<typeof transferSchema>;
export type ExchangeFormData = z.infer<typeof exchangeSchema>;
