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

export const STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type STATUS_TYPE = keyof typeof STATUS;

export const SORT_ORDER = {
  ASCE: "asce",
  DESC: "desc",
} as const;
export type SORT_ORDER_TYPE = keyof typeof SORT_ORDER;

export const PRODUCT_STATUS = {
  AVAILABLE: "AVAILABLE",
  UN_AVAILABLE: "UN_AVAILABLE",
} as const;
export type PRODUCT_STATUS_TYPE = keyof typeof PRODUCT_STATUS;

export const ORDER_STATUS = {
  INITIATED: "INITIATED",
  PROCESSING: "PROCESSING",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED", //can cancel before delivered, if it is delivered then only can returned.
  RETURNED_INITIATED: "RETURNED_INITIATED",
  RETURNED_DELIVERED: "RETURNED_DELIVERED",
} as const;
export type ORDER_STATUS_TYPE = keyof typeof ORDER_STATUS;
