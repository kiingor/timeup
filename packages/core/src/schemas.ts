/**
 * Shared Zod schemas. Used by react-hook-form on the client AND re-validated on the
 * server (server actions). Never trust the client — always parse server-side too.
 */
import { z } from "zod";
import { ALLOWED_RADII, HEX_COLOR_REGEX } from "./theme";

export const hexColor = z.string().regex(HEX_COLOR_REGEX, "Cor inválida (use #RRGGBB)");

export const slug = z
  .string()
  .min(2, "Mínimo 2 caracteres")
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen");

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const themeSchema = z.object({
  mode: z.enum(["light", "dark"]).default("light"),
  brand: hexColor,
  brandForeground: hexColor,
  accent: hexColor,
  sidebar: hexColor,
  radius: z.enum(ALLOWED_RADII as [string, ...string[]]),
  logoUrl: z.string().url().nullable().optional(),
  logoDarkUrl: z.string().url().nullable().optional(),
});
export type ThemeInput = z.infer<typeof themeSchema>;

export const createTenantSchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa").max(120),
  slug,
  theme: themeSchema,
  adminName: z.string().min(2, "Informe o nome do admin").max(120),
  adminEmail: z.string().email("E-mail inválido"),
  adminPassword: z.string().min(8, "Mínimo 8 caracteres"),
  /** Optional: paste a Softcom device/add URL to provision integration immediately. */
  softcomDeviceUrl: z.string().url().optional().or(z.literal("")),
});
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(120),
  status: z.enum(["active", "suspended"]),
});

export const colaboradorSchema = z.object({
  /** which empresa (loja) this colaborador belongs to */
  empresaId: z.string().uuid("Selecione a empresa"),
  name: z.string().min(2, "Informe o nome").max(120),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  active: z.boolean().default(true),
  /** link to the Softcom vendedor — filled by the picker; the code is locked once set */
  softcomVendedorId: z.string().max(40).optional().or(z.literal("")),
  softcomVendedorNome: z.string().max(120).optional().or(z.literal("")),
  /** optional login provisioning */
  createLogin: z.boolean().default(false),
  loginPassword: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
});
export type ColaboradorInput = z.infer<typeof colaboradorSchema>;

export const metaTierSchema = z.object({
  name: z.string().min(1, "Informe o nome do nível").max(40),
  orderIndex: z.number().int().min(0),
  color: hexColor.nullable().optional(),
  active: z.boolean().default(true),
});
export type MetaTierInput = z.infer<typeof metaTierSchema>;

export const periodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const storeGoalSchema = periodSchema.extend({
  targetBrl: z.number().nonnegative("Valor inválido"),
});
export type StoreGoalInput = z.infer<typeof storeGoalSchema>;

/** A single tier target for a colaborador in a given month. */
export const colaboradorGoalTierSchema = z.object({
  metaTierId: z.string().uuid(),
  targetBrl: z.number().nonnegative(),
  /** optional prize earned on reaching this tier (R$); 0/undefined = no prize */
  bonusBrl: z.number().nonnegative().nullable().optional(),
});

export const colaboradorGoalsSchema = periodSchema.extend({
  colaboradorId: z.string().uuid(),
  tiers: z.array(colaboradorGoalTierSchema).min(1, "Defina ao menos um nível"),
});
export type ColaboradorGoalsInput = z.infer<typeof colaboradorGoalsSchema>;

/** The Softcom device/add URL the user pastes to provision the integration. */
export const deviceProvisionSchema = z.object({
  deviceUrl: z
    .string()
    .url("Cole a URL completa do device/add")
    .refine((u) => /\/device\/add(\?|$)/i.test(u), "A URL deve conter /device/add"),
});
export type DeviceProvisionInput = z.infer<typeof deviceProvisionSchema>;

export const notificationSchema = z.object({
  title: z.string().min(1, "Informe o título").max(120),
  body: z.string().min(1, "Informe a mensagem").max(1000),
  /** null = enviar para todos os colaboradores */
  colaboradorId: z.string().uuid().nullable(),
});
export type NotificationInput = z.infer<typeof notificationSchema>;

export const releaseRankingSchema = periodSchema.extend({
  released: z.boolean(),
});
