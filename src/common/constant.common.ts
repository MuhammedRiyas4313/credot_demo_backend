export const ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;
export type ROLES_TYPE = keyof typeof ROLES;

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
} as const;
export type USER_STATUS_TYPE = keyof typeof USER_STATUS;

export const COUPON_TYPE = {
  PERCENTAGE: "PERCENTAGE",
  FLAT: "FLAT",
} as const;
export type COUPON_TYPE_TYPE = keyof typeof COUPON_TYPE;

export const COUPON_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type COUPON_STATUS_TYPE = keyof typeof COUPON_STATUS;

export const SORT_ORDER = {
  ASCE: "asce",
  DESC: "desc",
} as const;
export type SORT_ORDER_TYPE = keyof typeof SORT_ORDER;
