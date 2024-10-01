export const MESSAGE = {
  ORDER: {
    CREATED: "Thank you for your order! We've received it and it's being processed.",
    CANCELED: "Order cancellation confirmed. We've processed your request.",
    REMOVED: "Order removed successfully.",
    GOTBYID: "Order by id",
    UPDATED: "Order updated Successfully.",
    ALLORDERS: "Order List",
  },
  USER: {
    CREATED: "User added Successfully.",
    UPDATED: "User updated Successfully.",
    LOGGED_IN: "LogIn Successfully",
    GOTBYID: "User by id",
    GETCOUNT: "User Count",
    ALLUSERS: "Users List",
  },
  BRAND: {
    CREATED: "Brand added successfully!.",
    UPDATED: "Brand updated Successfully .",
    GOTBYID: "Brand by id",
    ALLBRANDS: "Brands List",
    REMOVED: "Brand removed successfully.",
  },
  CATEGORY: {
    CREATED: "Category added Successfully.",
    UPDATED: "Category updated Successfully.",
    GOTBYID: "Category by id",
    ALLCATEGORY: "Categories List",
    REMOVED: "Category removed successfully.",
  },
  PRODUCT: {
    CREATED: "Product added Successfully.",
    UPDATED: "Product updated Successfully.",
    GOTBYID: "Product by id",
    GOTBYSKU_CODE: "Product by SKU Code",
    ALLPRODUCTS: "Products List",
    REMOVED: "Product removed successfully.",
  },
} as const;
export type MESSAGE_TYPE = keyof typeof MESSAGE;
