import { z } from "zod";

/**
 * Schémas Zod v4 — Validation côté client (miroir de la validation Laravel).
 */

// ─── Step 1 : Informations de base ─────────────────────────
export const stepInfoSchema = z.object({
  title: z
    .string()
    .min(5, "Le titre doit faire au moins 5 caractères")
    .max(255, "Le titre ne peut pas dépasser 255 caractères"),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .optional()
    .or(z.literal("")),
  budget: z
    .number({ error: "Le budget doit être un nombre" })
    .min(50, "Le budget minimum est de 50€")
    .max(5000, "Le budget maximum est de 5000€"),
  rooms_count: z
    .number({ error: "Nombre de chambres invalide" })
    .min(1, "Au moins 1 chambre")
    .max(20, "20 chambres maximum"),
  surface: z
    .number()
    .min(5, "Surface minimum 5m²")
    .max(500, "Surface maximum 500m²")
    .optional(),
  is_furnished: z.boolean(),
  amenities: z.array(z.string()).optional(),
  availability: z.string().optional().or(z.literal("")),
});

// ─── Step 2 : Localisation ──────────────────────────────────
export const stepLocationSchema = z.object({
  latitude: z
    .number({ error: "Latitude invalide" })
    .min(-90)
    .max(90),
  longitude: z
    .number({ error: "Longitude invalide" })
    .min(-180)
    .max(180),
  street: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "La ville est obligatoire"),
  zip_code: z.string().min(1, "Le code postal est obligatoire"),
});

// ─── Step 3 : Photos ────────────────────────────────────────
export const stepPhotosSchema = z.object({
  images: z
    .array(z.string().url("URL d'image invalide"))
    .max(5, "Maximum 5 photos"),
});

// ─── Schéma complet (assemblage des 3 steps) ────────────────
export const publishRoomSchema = stepInfoSchema
  .merge(stepLocationSchema)
  .merge(stepPhotosSchema);

export type StepInfoData = z.infer<typeof stepInfoSchema>;
export type StepLocationData = z.infer<typeof stepLocationSchema>;
export type StepPhotosData = z.infer<typeof stepPhotosSchema>;
export type PublishRoomData = z.infer<typeof publishRoomSchema>;
