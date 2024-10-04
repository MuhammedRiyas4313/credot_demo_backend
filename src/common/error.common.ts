export const ERROR = {
  INVALID_FIELD: (fieldsArr: string[]) =>
    fieldsArr.length === 1
      ? `${fieldsArr[0]} is undefined`
      : `The following fields are undefined: ${fieldsArr.join(", ")}`,
  ROLE: {
    NOT_FOUND: "Role is not defined.",
    INSUFFICIENT_PERMISSION: "403 Forbidden: Insufficient permissions. Your role lacks the required scope.",
  },
  BANNER: {
    NO_ACTIVE_BANNERS: "Can't find any active banners!",
    NOT_FOUND: "Banner not found!",
  },
  REMARK: {
    REQUIRED: "Remark is required!",
  },
  USER: {
    INVALID_CREDENTIAL: "Invalid credential.",
    EMAIL_BEING_USED: "This email is already being used.",
    NOT_FOUND: "Can't find your account. Please check your credentials or create a new account.",
    INVALID_USER_ID: "User id is not valid.",
    CAN_NOT_FOUND: "Can't find User account.",
    ACCOUNT_BLOCKED: "Your account has been blocked. Please contact support for further assistance.",
  },
  BRAND: {
    EXIST: "Brand in this name is already exists!",
    EXIST_WITH_PRIORITY: "Brand with this priority is already exists!",
    NOT_FOUND: "Brand not found!",
    INVALID_ID: "Brand id is not valid!",
  },
  ADDRESS: {
    NOT_FOUND: "Address not found!",
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
    VARIANT_NOT_FOUND: "Product variant is currently unavailable! ",
    OUT_OF_STOCK: "Product is currently out of stock!",
    NO_MORE_STOCK: (stock: number) => `Product current stock is ${stock}!`,
    PRODUCT_OUT_OF_STOCK: (productName: string) => `${productName} is currently out of stock!`,
    MAX_ITEM_COUNT: (n: number) => `You can buy only up to ${n} unit(s) of this product`,
  },
  CART: {
    NO_ITEMS_IN_CART_FOR_ORDER: "Cart is empty, cannot place the order",
  },
  STATUS: {
    NOT_DEFINED: "Invalid status value. Please provide a valid status.",
  },
  TOKEN: {
    INVALID: "Invalid Token!",
    TRY_AGAIN: "Please Login And Try Again",
    FORBIDDEN: "forbidden!",
  },
} as const;
export type ERROR_TYPE = keyof typeof ERROR;
