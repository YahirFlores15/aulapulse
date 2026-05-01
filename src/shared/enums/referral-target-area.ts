import { z } from "zod";


export const REFERRAL_TARGET_AREA = {
    PEDAGOGY: "PEDAGOGY",
    PSYCHOLOGY: "PSYCHOLOGY",
} as const;

export const REFERRAL_TARGET_AREA_VALUES = [
    REFERRAL_TARGET_AREA.PEDAGOGY,
    REFERRAL_TARGET_AREA.PSYCHOLOGY,
] as const;

export const referralTargetAreaSchema = z.enum(REFERRAL_TARGET_AREA_VALUES);

export type ReferralTargetArea = z.infer<typeof referralTargetAreaSchema>;