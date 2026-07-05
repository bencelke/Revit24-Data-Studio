import { USER_ROLES } from "@/lib/types";

export const userRoleSchema = {
  parse(value: unknown) {
    if (typeof value !== "string" || !USER_ROLES.includes(value as (typeof USER_ROLES)[number])) {
      throw new Error("Invalid user role.");
    }
    return value as (typeof USER_ROLES)[number];
  },
};

export const emailSchema = {
  parse(value: unknown) {
    if (typeof value !== "string" || !value.includes("@")) {
      throw new Error("Invalid email address.");
    }
    return value.trim().toLowerCase();
  },
};
