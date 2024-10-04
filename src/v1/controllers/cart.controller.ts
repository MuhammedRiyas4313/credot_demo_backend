import { ERROR } from "common/error.common";
import { MESSAGE } from "common/messages.common";
import { NextFunction, Request, Response } from "express";
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

    if (userCart) {
      // If the cart exists, check if the item is already in the cart
      let itemIndex = userCart.itemsArr.findIndex((item) => item.sku === sku);

      if (itemIndex > -1) {
        // Item exists in the cart
        if (quantity === -1 && userCart.itemsArr[itemIndex].quantity <= 1) {
          // Remove the item if incoming quantity is -1 and existing quantity is <= 1
          userCart.itemsArr.splice(itemIndex, 1);
          response.message = MESSAGE.CART.ITEM_REMOVED;
        } else {
          //if increasing the product quantiy check maxItemsPerOrder limit
          if (userCart.itemsArr[itemIndex].quantity + quantity >= product.maxItemsPerOrder) {
            response.message = ERROR.PRODUCT.MAX_ITEM_COUNT(product.maxItemsPerOrder);
          } else {
            //check the stock
            if (productVariant.quantity < userCart.itemsArr[itemIndex].quantity + quantity) {
              response.message = ERROR.PRODUCT.NO_MORE_STOCK(productVariant.quantity);
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
    const { id } = req.params;

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
                                          { $gte: ["$$subvariant.quantity", "$$cartQuantity"] },
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
                                        $gte: ["$$variant.quantity", "$$cartQuantity"],
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
                          $gte: ["$quantity", "$$cartQuantity"],
                        },
                      ],
                    },
                    false, // If cartQuantity exceeds maxItemsPerOrder
                  ],
                },
                productInfoObj: {
                  $cond: {
                    if: { $ne: ["$$variantId", null] }, // Check if variantId is provided
                    then: {
                      $cond: {
                        if: { $ne: ["$$subvariantId", null] }, // Check if subvariantId is provided
                        then: {
                          // Use subvariant image and price
                          $let: {
                            vars: {
                              subvariant: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$variants.subvariants",
                                      as: "subvariant",
                                      cond: { $eq: ["$$subvariantId", "$$subvariant._id"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              price: "$$subvariant.price",
                            },
                          },
                        },
                        else: {
                          // Use variant image and price
                          $let: {
                            vars: {
                              variant: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$variants",
                                      as: "variant",
                                      cond: { $eq: ["$$variantId", "$$variant._id"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              image: "$$variant.image",
                              price: "$$variant.price",
                            },
                          },
                        },
                      },
                    },
                    else: {
                      // No variantId, use product image and price
                      image: { $arrayElemAt: ["$thumbnail", 0] }, // Assuming the main product image is in imagesArr
                      price: "$price",
                    },
                  },
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

    res.status(200).json({ message: MESSAGE.CATEGORY.GOTBYID, data: cart });
  } catch (error) {
    next(error);
  }
};
