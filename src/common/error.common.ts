export const ERROR = {
  INVALID_FIELD: (fieldsArr: string[]) =>
    fieldsArr.length === 1
      ? `${fieldsArr[0]} is undefined`
      : `The following fields are undefined: ${fieldsArr.join(", ")}`,
  ROLE: {
    NOT_FOUND: "Role is not defined.",
    INSUFFICIENT_PERMISSION: "403 Forbidden: Insufficient permissions. Your role lacks the required scope.",
  },
  USER: {
    INVALID_CREDENTIAL: "Invalid credential.",
    EMAIL_BEING_USED: "This email is already being used.",
    NOT_FOUND: "Can't find your account. Please check your credentials or create a new account.",
    INVALID_USER_ID: "User id is not valid.",
    CAN_NOT_FOUND: "Can't find User account.",
  },
  BRAND: {
    EXIST: "Brand in this name is already exists!",
    EXIST_WITH_PRIORITY: "Brand with this priority is already exists!",
    NOT_FOUND: "Brand not found!",
    INVALID_ID: "Brand id is not valid!",
  },
  CATEGORY: {
    EXIST: "Category in this name is already exists.",
    NOT_FOUND: "Can't find the Category.",
    INVALID_ID: "Category id is not valid",
  },
  PRODUCT: {
    EXIST: "Product in this name is already exists.",
    EXIST_SKU_CODE: "Product with this SKU Code is already exists.",
    NOT_FOUND: "Can't find the Product.",
    INVALID_ID: "Product id is not valid",
    MRP_GT_PRICE: "Product price is greater than MRP!",
  },
  CART: {
    NO_ITEMS_IN_CART_FOR_ORDER: "Cart is empty, cannot place the order",
  },
} as const;
export type ERROR_TYPE = keyof typeof ERROR;
