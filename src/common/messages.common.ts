export const MESSAGE = {
  ORDER: {
    CREATED: "Thank you for your order! We've received it and it's being processed.",
    CANCELED: "Order cancellation confirmed. We've processed your request.",
    REMOVED: "Order removed successfully.",
    GOTBYID: "Order by id",
    UPDATED: "Successfully updated Order.",
    ALLORDERS: "Order List",
  },
  USER: {
    CREATED: "Successfully added new User.",
    UPDATED: "Successfully updated User.",
    LOGGED_IN: "LogIn Successfully",
    GOTBYID: "User by id",
    GETCOUNT: "User Count",
    ALLUSERS: "Users List",
  },
  BRAND: {
    CREATED: "Successfully added new Brand.",
    UPDATED: "Successfully updated Brand.",
    GOTBYID: "Brand by id",
    ALLBRANDS: "Brands List",
    REMOVED: "Brand removed successfully.",
  },
  CATEGORY: {
    CREATED: "Successfully added new Category.",
    UPDATED: "Successfully updated Category.",
    GOTBYID: "Category by id",
    ALLCATEGORY: "Categories List",
    REMOVED: "Category removed successfully.",
  },
  PRODUCT: {
    CREATED: "Successfully added new Product.",
    UPDATED: "Successfully updated Product.",
    GOTBYID: "Product by id",
    GOTBYSKU_CODE: "Product by SKU Code",
    ALLPRODUCTS: "Products List",
    REMOVED: "Product removed successfully.",
  },
} as const;
export type MESSAGE_TYPE = keyof typeof MESSAGE;
