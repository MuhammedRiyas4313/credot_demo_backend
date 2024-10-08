import { ERROR } from "common/error.common";
import { MESSAGE } from "common/messages.common";
import { NextFunction, Request, Response } from "express";
import { findIndex } from "lodash";
import { Cart } from "models/cart.model";
import { Product } from "models/product.model";
import { Types } from "mongoose";
import { verifyRequiredFields } from "utils/error";

/* Add items to cart */
/* this could be use for add to cart, increase quantity, decrease quantity remove item  */

/**
 *
 */
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    /* variantId and subvariantId is optional */
    const { sku, quantity, variantId, subvariantId } = req.body;

    const requiredFields = { Product: sku, Quantity: quantity };

    verifyRequiredFields(requiredFields);

    if (!req.user?.userId) {
      throw new Error(ERROR.USER.NOT_FOUND);
    }

    const userId = new Types.ObjectId(req.user?.userId);

    // Check if the product exists
    const product = await Product.findOne({ sku: sku, isDeleted: false }).lean().exec();
    if (!product) {
      throw new Error(ERROR.PRODUCT.NOT_FOUND);
    }

    let availableQuantity = product.quantity;
    let price = product.price;
    let mrp = product.mrp;
    let productVariant: any = product; //for check .

    // Check if there is a variant or subvariant
    if (variantId && product?.variants?.length) {
      const variant = product?.variants.find((v: any) => v._id.toString() === variantId);
      if (!variant) {
        throw new Error(ERROR.PRODUCT.VARIANT_NOT_FOUND);
      }

      availableQuantity = variant?.quantity;
      price = variant.price;
      mrp = variant.mrp;
      productVariant = variant;

      // If subvariantId is provided, check the subvariant
      if (subvariantId) {
        const subvariant = variant.subvariants.find((sv: any) => sv._id.toString() === subvariantId);
        if (!subvariant) {
          throw new Error(ERROR.PRODUCT.VARIANT_NOT_FOUND);
        }
        availableQuantity = subvariant.quantity;
        price = subvariant.price;
        mrp = subvariant.mrp;
        productVariant = subvariant;
      }
    }

    // Check if the cart already exists for the user
    let userCart = await Cart.findOne({ userId }).exec();

    const itemTotal = price * quantity;

    let response: any = {};

    if (quantity > product.maxItemsPerOrder) {
      throw new Error(ERROR.PRODUCT.MAX_ITEM_COUNT(product.maxItemsPerOrder));
    } else {
      //check the stock
      if (productVariant.quantity < quantity) {
        throw new Error(ERROR.PRODUCT.NO_MORE_STOCK(productVariant.quantity));
      }
    }

    if (userCart) {
      // If the cart exists, check if the item is already in the cart
      let itemIndex = userCart.itemsArr.findIndex((item) => {
        let find = false;

        if (variantId) {
          find = item?.variantId?.toString() === variantId;
        }
        if (variantId && subvariantId) {
          find = item?.variantId?.toString() === variantId && item?.subvariantId?.toString() === subvariantId;
        }

        return find;
      });

      if (itemIndex > -1) {
        // Item exists in the cart
        if (quantity === -1 && userCart.itemsArr[itemIndex].quantity <= 1) {
          // Remove the item if incoming quantity is -1 and existing quantity is <= 1
          userCart.itemsArr.splice(itemIndex, 1);
          response.message = MESSAGE.CART.ITEM_REMOVED;
        } else {
          //if increasing the product quantiy check maxItemsPerOrder limit
          if (userCart.itemsArr[itemIndex].quantity + quantity >= product.maxItemsPerOrder) {
            throw new Error(ERROR.PRODUCT.MAX_ITEM_COUNT(product.maxItemsPerOrder));
          } else {
            //check the stock
            if (productVariant.quantity < userCart.itemsArr[itemIndex].quantity + quantity) {
              throw new Error(ERROR.PRODUCT.NO_MORE_STOCK(productVariant.quantity));
            } else {
              // Update the quantity and total
              userCart.itemsArr[itemIndex].quantity += quantity;
              userCart.itemsArr[itemIndex].total =
                userCart.itemsArr[itemIndex].quantity * userCart.itemsArr[itemIndex].price;

              response.message = MESSAGE.CART.ITEM_UPDATED;
            }
          }
        }
      } else {
        //only product with quantity could add to cart
        // Item doesn't exist in the cart, add a new item
        userCart.itemsArr = [
          {
            sku,
            price,
            mrp,
            quantity,
            total: itemTotal,
            variantId,
            subvariantId,
            createdAt: new Date(),
          },
          ...userCart.itemsArr,
        ];
        response.message = MESSAGE.CART.ITEM_ADDED;
      }

      // Update the grand total and items count.
      userCart.grandTotal = userCart.itemsArr.reduce((acc, item) => acc + item.total, 0);
      userCart.itemsCount = userCart.itemsArr.length;
    } else {
      // If no cart exists, create a new one

      userCart = new Cart({
        userId,
        itemsArr: [{ sku, price, mrp, quantity, total: itemTotal, variantId, subvariantId, createdAt: new Date() }],
        grandTotal: itemTotal,
        itemsCount: 1,
      });

      response.message = MESSAGE.CART.ITEM_ADDED;
    }

    await userCart.save();
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/* get cart by userId */
export const getCartByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const { id } = req.params;

    const id = req.user?.userObj?._id;

    if (!id) {
      throw new Error(ERROR.USER.INVALID_USER_ID);
    }

    let cart = await Cart.aggregate([
      {
        $match: { userId: new Types.ObjectId(id) }, // Match by user ID
      },
      {
        $unwind: {
          path: "$itemsArr", // Unwind the items array
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "itemsArr.sku", // Match the SKU from itemsArr
          foreignField: "sku", // Match against the product's SKU
          let: {
            variantId: "$itemsArr.variantId",
            subvariantId: "$itemsArr.subvariantId",
            cartQuantity: "$itemsArr.quantity",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$isDeleted", false], // Ensure the product is not deleted
                },
              },
            },
            {
              $addFields: {
                availability: {
                  $cond: [
                    { $lte: ["$$cartQuantity", "$maxItemsPerOrder"] }, // Check if cartQuantity is within the limit
                    {
                      $cond: [
                        { $gt: [{ $size: "$variants" }, 0] }, // Check if there are variants
                        {
                          $cond: [
                            { $ne: ["$$subvariantId", null] }, // Check if subvariantId is provided
                            {
                              // Check if any subvariant matches the condition
                              $gt: [
                                {
                                  $size: {
                                    $filter: {
                                      input: "$variants.subvariants",
                                      as: "subvariant",
                                      cond: {
                                        $and: [
                                          { $eq: ["$$subvariantId", "$$subvariant._id"] },
                                          { $gt: ["$$subvariant.quantity", "$$cartQuantity"] },
                                        ],
                                      },
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                            {
                              // If no subvariantId, check variants
                              $gt: [
                                {
                                  $size: {
                                    $filter: {
                                      input: "$variants",
                                      as: "variant",
                                      cond: {
                                        $gt: ["$$variant.quantity", "$$cartQuantity"],
                                      },
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          ],
                        },
                        {
                          // No variants, check stock directly
                          $gt: ["$quantity", "$$cartQuantity"],
                        },
                      ],
                    },
                    false, // If cartQuantity exceeds maxItemsPerOrder
                  ],
                },
                image: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$$variantId", null] }, // Check if variantId is not null
                        { $gt: [{ $size: "$variants" }, 0] }, // Check if variants array has elements
                      ],
                    },
                    {
                      $let: {
                        vars: {
                          matchedVariant: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$variants",
                                  as: "variant",
                                  cond: { $eq: ["$$variant._id", "$$variantId"] }, // Match the variant by variantId
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: {
                          $arrayElemAt: ["$$matchedVariant.imagesArr.image", 0], // Get the first image of the matched variant
                        },
                      },
                    },
                    "$thumbnail", // Fallback: If no variant, use the root thumbnail
                  ],
                },
                name: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$$variantId", null] }, // Check if variantId is not null
                        { $gt: [{ $size: "$variants" }, 0] }, // Check if variants array has elements
                      ],
                    },
                    {
                      $let: {
                        vars: {
                          matchedVariant: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$variants",
                                  as: "variant",
                                  cond: { $eq: ["$$variant._id", "$$variantId"] }, // Match the variant by variantId
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: "$$matchedVariant.name",
                      },
                    },
                    "$name", // Fallback: If no variant, use the root thumbnail
                  ],
                },
              },
            },
          ],
          as: "productObj", // Embed productObj into itemsArr
        },
      },
      {
        $unwind: {
          path: "$productObj", // Unwind productObj (removes items without a matching productObj)
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" }, // Keep the userId field
          itemsArr: {
            $push: {
              $mergeObjects: ["$itemsArr", { productObj: "$productObj" }], // Merge productObj into itemsArr, will overwritten with the current product data;
            },
          },
          grandTotal: { $first: "$grandTotal" }, // Keep the grand total
          itemsCount: { $first: "$itemsCount" }, // Keep the items count
        },
      },
    ]).exec();

    cart = cart?.length ? cart[0] : null;

    res.status(200).json({ message: MESSAGE.CART.CART_VIEWED, data: cart });
  } catch (error) {
    next(error);
  }
};

export const deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //cart item id
    const { id } = req.params;

    const userId = req.user?.userObj?._id;

    if (!id) {
      throw new Error(ERROR.USER.INVALID_USER_ID);
    }

    const userCart = await Cart.findOne({ userId: new Types.ObjectId(userId) }).exec();

    if (!userCart) {
      throw new Error(ERROR.CART.NOT_FOUND);
    }

    let itemsArr = [...userCart.itemsArr];

    let currentItemIndex = itemsArr?.findIndex((el: any) => el._id?.toString() === id);

    if (currentItemIndex !== -1) {
      itemsArr?.splice(currentItemIndex, 1);
    }

    userCart.itemsArr = itemsArr;
    userCart.grandTotal = userCart.itemsArr.reduce((acc, item) => acc + item.total, 0);
    userCart.itemsCount = userCart.itemsArr.length;

    await userCart.save();

    res.status(200).json({ message: MESSAGE.CART.ITEM_REMOVED });
  } catch (error) {
    next(error);
  }
};
