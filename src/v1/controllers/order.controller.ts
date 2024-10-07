import { ORDER_STATUS } from "common/constant.common";
import { ERROR } from "common/error.common";
import { MESSAGE } from "common/messages.common";
import { NextFunction, Request, Response } from "express";
import { updateInventory } from "helpers/orderStatusUpdate";
import { Address } from "models/address.model";
import { Cart } from "models/cart.model";
import { IOrder, Order } from "models/order.model";
import { Product } from "models/product.model";
import { PipelineStage, Types } from "mongoose";
import { startSession } from "mongoose";
import { paginateAggregate } from "utils/paginateAggregate";
import { createFlexibleRegex } from "utils/regex";

/* create order*/
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  //to make sure that the cart becoming empty after order created successfully.
  const session = await startSession();
  session.startTransaction();

  try {
    // Check if there is a userId attached in the req
    if (!req.user?.userId) {
      throw new Error(ERROR.USER.INVALID_USER_ID);
    }

    // //only addressId from the req.body;
    // const { addressId } = req.body;

    //check the address exist or not
    // const address = await Address.findById(addressId).lean().exec();

    //address is mandatory
    // if (!address) {
    //   throw new Error(ERROR.ADDRESS.NOT_FOUND);
    // }
    // Fetch cart to place the order
    const userCart = await Cart.findOne({ userId: new Types.ObjectId(req.user.userId) }).exec();

    if (!userCart || !userCart.itemsArr.length) {
      throw new Error(ERROR.CART.NO_ITEMS_IN_CART_FOR_ORDER);
    }

    for (const item of userCart.itemsArr) {
      // Check if the product exists
      const product = await Product.findOne({ sku: item.sku, isDeleted: false }).exec();
      if (!product) {
        throw new Error(ERROR.PRODUCT.NOT_FOUND);
      }

      let availableQuantity = product.quantity;
      let price = product.price;
      let mrp = product.mrp;
      let productVariant: any = product;

      // Check if there is a variant or subvariant
      if (item.variantId && product.variants?.length) {
        //check the variant available or not
        const variantIndex = product.variants.findIndex((v: any) => v._id.toString() === item.variantId?.toString());
        if (variantIndex <= -1) {
          throw new Error(ERROR.PRODUCT.VARIANT_NOT_FOUND);
        }

        availableQuantity = product.variants[variantIndex].quantity;
        price = product.variants[variantIndex].price;
        mrp = product.variants[variantIndex].mrp;
        productVariant = product.variants[variantIndex];

        // If subvariantId is provided, check the subvariant
        if (item.subvariantId && product.variants[variantIndex].subvariants?.length) {
          const subvariantIndex = product.variants[variantIndex].subvariants.findIndex(
            (sv: any) => sv._id.toString() === item.subvariantId?.toString(),
          );
          if (subvariantIndex <= -1) {
            throw new Error(ERROR.PRODUCT.VARIANT_NOT_FOUND);
          }
          availableQuantity = product.variants[variantIndex].subvariants[subvariantIndex].quantity;
          price = product.variants[variantIndex].subvariants[subvariantIndex].price;
          mrp = product.variants[variantIndex].subvariants[subvariantIndex].mrp;
          productVariant = product.variants[variantIndex].subvariants[subvariantIndex];
        }
      }

      if (item.quantity > product.maxItemsPerOrder) {
        // Check max items per order
        throw new Error(ERROR.PRODUCT.MAX_ITEM_COUNT(product.maxItemsPerOrder));
      } else {
        // Check stock availability
        if (availableQuantity < item.quantity) {
          throw new Error(ERROR.PRODUCT.PRODUCT_OUT_OF_STOCK(product.name));
        }
      }

      // Deduct the quantity from the product/variant/subvariant
      productVariant.quantity -= item.quantity;

      //updating product quantity
      await product.save({ session });
    }
    //new order obj. status will be default status INITIATED.
    const newOrderObj: Partial<IOrder> = {
      userId: new Types.ObjectId(req.user.userId),
      itemsArr: userCart.itemsArr,
      grandTotal: userCart.grandTotal,
      itemsCount: userCart.itemsCount,
      // addressId: new Types.ObjectId(address?._id),
    };

    // Create the order
    await Order.create([newOrderObj], { session });

    // Clear cart items after the order is placed
    userCart.itemsArr = [];
    userCart.grandTotal = 0;
    userCart.itemsCount = 0;
    await userCart.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: MESSAGE.ORDER.CREATED });
  } catch (error) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/* Update order status */
export const udpateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { status, remark } = req.body;

    //check status is valid or not
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new Error(ERROR.STATUS.NOT_DEFINED);
    }

    //check userId attached
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error(ERROR.USER.INVALID_USER_ID);
    }

    //check order exist
    const order = await Order.findById(id).lean().exec();

    //check status if it is cancelled or returned manage stock.
    if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.RETURNED_DELIVERED) {
      if (status === ORDER_STATUS.CANCELLED && !remark) {
        throw new Error(ERROR.REMARK.REQUIRED);
      }
      await updateInventory(status, order);
    }

    await Order.findByIdAndUpdate(id, { $set: { status: status } })
      .lean()
      .exec();

    res.status(200).json({ message: MESSAGE.ORDER.STATUS_UPDATED });
  } catch (error) {
    next(error);
  }
};

/* For admin */
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    let matchObj: Record<string, any> = {};
    let sortObj: Record<string, any> = { createdAt: -1 };

    //search for orders
    if (search && typeof search === "string") {
      matchObj.status = { $regex: new RegExp(createFlexibleRegex(search), "i") };
      req.query.pageIndex = "0";
      req.query.pageSize = "10";
    }

    let pipeline: PipelineStage[] = [
      {
        $match: matchObj,
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userObj",
        },
      },
      {
        $unwind: {
          path: "$userObj",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: sortObj,
      },
    ];

    //get paginated data and total document count
    const paginatedData = await paginateAggregate(Order, pipeline, req.query);

    res
      .status(200)
      .json({ message: MESSAGE.CATEGORY.ALLCATEGORY, data: paginatedData.data, total: paginatedData.total });
  } catch (error) {
    next(error);
  }
};

/* For users */
export const getOrdersForUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    const userId = req.user?.userId;

    if (!userId) {
      throw new Error(ERROR.USER.INVALID_USER_ID);
    }

    let matchObj: Record<string, any> = {};
    let sortObj: Record<string, any> = { createdAt: -1 };

    //search for orders
    if (search && typeof search === "string") {
      matchObj.status = { $regex: new RegExp(createFlexibleRegex(search), "i") };
      req.query.pageIndex = "0";
      req.query.pageSize = "10";
    }

    //if di
    if (userId && typeof userId === "string") {
      matchObj.userId = new Types.ObjectId(userId);
    }

    let pipeline: PipelineStage[] = [
      {
        $match: matchObj,
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
          status: {
            $first: "$status",
          },
          remark: {
            $first: "$remark",
          },
          createdAt: {
            $first: "$createdAt",
          },
        },
      },
      {
        $sort: sortObj,
      },
    ];

    //get paginated data and total document count
    const paginatedData = await paginateAggregate(Order, pipeline, req.query);

    res.status(200).json({ message: MESSAGE.ORDER.GOTBYID, data: paginatedData.data, total: paginatedData.total });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).lean().exec();

    //exist check
    if (!order) {
      throw new Error(ERROR.USER.NOT_FOUND);
    }

    res.status(200).json({ message: MESSAGE.ORDER.GOTBYID, data: order });
  } catch (error) {
    next(error);
  }
};
