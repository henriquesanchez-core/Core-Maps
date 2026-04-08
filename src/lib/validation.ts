import { z } from 'zod'
import { ALL_TAB_IDS, MAX_AUDIO_UPLOAD_BYTES } from '@/lib/constants'

export const GenerateRequestSchema = z.object({
  companyName: z.string().trim().min(2).max(100),
  niche: z.string().trim().min(2).max(100),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .min(1)
    .max(20),
  painPoints: z
    .array(z.string().trim().min(1).max(200))
    .min(1)
    .max(10),
}).passthrough()

export const LoginRequestSchema = z.object({
  password: z.string().min(8).max(128),
}).passthrough()

export const TabIdSchema = z.enum(ALL_TAB_IDS)

export const AudioUploadSchema = z.object({
  tab: TabIdSchema,
  file: z
    .custom<File>(
      (value) => typeof File !== 'undefined' && value instanceof File,
      { message: 'Arquivo obrigatório' }
    )
    .refine((file) => file.size <= MAX_AUDIO_UPLOAD_BYTES, {
      message: 'Arquivo deve ter no máximo 10MB',
    }),
})
