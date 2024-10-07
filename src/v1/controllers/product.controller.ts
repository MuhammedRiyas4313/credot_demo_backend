import { PRODUCT_STATUS } from "common/constant.common";
import { ERROR } from "common/error.common";
import { MESSAGE } from "common/messages.common";
import { NextFunction, Request, Response } from "express";
import { Brand } from "models/brand.model";
import { Category } from "models/category.model";
import { Product, IProduct } from "models/product.model";
import { PipelineStage, Types } from "mongoose";
import { verifyRequiredFields } from "utils/error";
import { storeFileAndReturnNameBase64 } from "utils/fileSystem";
import { paginateAggregate } from "utils/paginateAggregate";
import { createFlexibleRegex } from "utils/regex";

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let {
      name,
      sku,
      categoryId,
      brandId,
      specification,
      description,
      thumbnail,
      imagesArr,
      price,
      mrp,
      variants,
      maxItemsPerOrder,
      metaTitle, //for SEO purpose
      metaDescription, //for SEO purpose
    } = req.body;

    const requiredFields: any = {
      Name: name,
      "SKU Code": sku,
      Category: categoryId,
      Brand: brandId,
      Specification: specification,
      Description: description,
      "Maximum Item Per Order": maxItemsPerOrder,
      Price: price,
      MRP: mrp,
    };

    if (!variants?.length) {
      requiredFields.Thumbnail = thumbnail;
    }

    //validating required fields
    verifyRequiredFields(requiredFields);

    //exist check category
    const category = await Category.findById(categoryId).lean().exec();

    if (!category) {
      throw new Error(ERROR.CATEGORY.NOT_FOUND);
    }

    //exist check category
    const brand = await Brand.findById(brandId).lean().exec();

    if (!brand) {
      throw new Error(ERROR.BRAND.NOT_FOUND);
    }

    //exist check for unique product name
    const existProductWithSkuCode = await Product.findOne({
      sku: { $regex: new RegExp(createFlexibleRegex(sku), "i") },
    })
      .lean()
      .exec();

    if (existProductWithSkuCode) {
      throw new Error(ERROR.PRODUCT.EXIST_SKU_CODE);
    }

    //exist check for unique product name
    const existProduct = await Product.findOne({
      name: { $regex: new RegExp(createFlexibleRegex(name), "i") },
      brandId: new Types.ObjectId(brandId),
      categoryId: new Types.ObjectId(categoryId),
      isDeleted: false,
    })
      .lean()
      .exec();

    if (existProduct) {
      throw new Error(ERROR.PRODUCT.EXIST);
    }

    //price should be less than mrp
    if (price > mrp) {
      throw new Error(ERROR.PRODUCT.MRP_GT_PRICE);
    }

    const newproductObj: Partial<IProduct> = {
      name,
      sku,
      categoryId,
      categoryName: category?.name,
      brandId,
      brandName: brand?.name,
      specification,
      description,
      price,
      mrp,
      maxItemsPerOrder,
    };

    if (metaDescription) {
      newproductObj.metaDescription = metaDescription;
    }

    if (metaTitle) {
      newproductObj.metaTitle = metaTitle;
    }

    //variants images and image gallery processing.
    if (variants?.length) {
      for (const el of variants) {
        if (el?.image) {
          el.image = await storeFileAndReturnNameBase64(el.image);
        }
        if (el?.imagesArr?.length) {
          for (const img of el?.imagesArr) {
            if (img?.image) {
              img.image = await storeFileAndReturnNameBase64(img?.image);
            }
          }
        }
      }
      newproductObj.variants = variants;
    }

    //images and image gallery processing.
    if (imagesArr?.length) {
      for (const el of imagesArr) {
        if (el?.image) {
          el.image = await storeFileAndReturnNameBase64(el.image);
        }
      }
      newproductObj.imagesArr = imagesArr;
    }

    //writing file to /public/uploads folder

    if (thumbnail) {
      thumbnail = await storeFileAndReturnNameBase64(thumbnail);
      newproductObj.thumbnail = thumbnail;
    }

    await Product.create(newproductObj);

    res.status(201).json({ message: MESSAGE.PRODUCT.CREATED });
  } catch (error) {
    next(error);
  }
};

/* For admin */
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    //filtered soft deleted products
    let matchObj: Record<string, any> = { isDeleted: false };
    let sortObj: Record<string, any> = { createdAt: -1 };

    //search for products
    if (search && typeof search === "string") {
      matchObj.$or = [
        { name: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
        { sku: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
        { brandName: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
        { categoryName: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
      ];
      req.query.pageIndex = "0";
      req.query.pageSize = "10";
    }

    let pipeline: PipelineStage[] = [
      {
        $match: matchObj,
      },
      {
        $sort: sortObj,
      },
    ];

    //get paginated data and total document count
    const paginatedData = await paginateAggregate(Product, pipeline, req.query);

    res
      .status(200)
      .json({ message: MESSAGE.PRODUCT.ALLPRODUCTS, data: paginatedData.data, total: paginatedData.total });
  } catch (error) {
    next(error);
  }
};

/* For admin */
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).lean().exec();

    //exist check
    if (!product) {
      throw new Error(ERROR.PRODUCT.NOT_FOUND);
    }

    res.status(200).json({ message: MESSAGE.PRODUCT.GOTBYID, data: product });
  } catch (error) {
    next(error);
  }
};

/* For Users */
export const getProductsForUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    //filtered soft deleted products
    let matchObj: Record<string, any> = { isDeleted: false };
    let sortObj: Record<string, any> = { createdAt: -1 };

    //search for products
    if (search && typeof search === "string") {
      matchObj.$or = [
        { name: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
        { sku: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
        { brandName: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
        { categoryName: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
      ];
      req.query.pageIndex = "0";
      req.query.pageSize = "10";
    }

    let pipeline: PipelineStage[] = [
      {
        $match: matchObj, // Apply your initial match condition here
      },
      {
        $unwind: {
          path: "$variants",
          preserveNullAndEmptyArrays: true, // Keep documents without variants
        },
      },
      // {
      //   $unwind: {
      //     path: "$variants.subvariants",
      //     preserveNullAndEmptyArrays: true, // Keep documents without subvariants
      //   },
      // },
      {
        $lookup: {
          from: "carts", // Lookup from the Cart collection
          localField: "sku", // The SKU of the product
          foreignField: "itemsArr.sku", // SKU in the cart items array
          as: "cart", // Name the result "cart"
        },
      },
      {
        $addFields: {
          cart: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$cart",
                  as: "cartItem",
                  cond: { $eq: ["$$cartItem.userId", req.user?.userId] }, // Match the userId with the current user
                },
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          inCart: {
            $cond: {
              if: {
                $and: [
                  { $and: [{ $ne: ["$cart", null] }, { $gt: [{ $size: { $ifNull: ["$cart.itemsArr", []] } }, 0] }] }, // Ensure cart.itemsArr exists and has elements
                  {
                    $or: [
                      {
                        $in: [
                          "$variants._id",
                          { $map: { input: { $ifNull: ["$cart.itemsArr", []] }, as: "item", in: "$$item.variantId" } },
                        ],
                      }, // Check if variantId exists in cart
                      {
                        $in: [
                          "$sku",
                          { $map: { input: { $ifNull: ["$cart.itemsArr", []] }, as: "item", in: "$$item.sku" } },
                        ],
                      }, // Check if the main product SKU is in the cart
                    ],
                  },
                ],
              },
              then: true, // If variantId or SKU matches, set inCart to true
              else: false, // Otherwise, set it to false
            },
          },
        },
      },
      {
        $addFields: {
          // Image logic: if variants exist, use variant.image, else use thumbnail
          image: {
            $cond: [
              { $and: [{ $ne: ["$variants", null] }, { $gt: [{ $size: "$variants.imagesArr" }, 0] }] }, // If variants array size > 0
              {
                $reduce: {
                  input: "$variants.imagesArr",
                  initialValue: null,
                  in: {
                    $cond: [
                      { $eq: ["$$value", null] }, // If initialValue is null, return the image
                      "$$this.image", // Access the image property of the current element
                      "$$value", // Keep the value if it's not null
                    ],
                  },
                },
              },
              "$thumbnail", // Else use thumbnail
            ],
          },

          // Price logic: if subvariants exist, use subvariant price, else variant price, else main price
          price: {
            $cond: [
              {
                $and: [
                  { $ne: ["$variants", null] },
                  { $ne: ["$variants.subvariants", null] },
                  { $gt: [{ $size: "$variants.subvariants" }, 0] },
                ],
              },
              // If there are subvariants, use the price of the first subvariant
              {
                $reduce: {
                  input: "$variants.subvariants",
                  initialValue: null,
                  in: {
                    $cond: [
                      { $eq: ["$$value", null] }, // If initialValue is null, return the image
                      "$$this.price", // Access the image property of the current element
                      "$$value", // Keep the value if it's not null
                    ],
                  },
                },
              },
              {
                $cond: [
                  { $and: [{ $ne: ["$variants", null] }, { $ne: ["$variants.price", null] }] },
                  // Else if there are no subvariants, use the variant price
                  "$variants.price",
                  // Else use the main price
                  "$price",
                ],
              },
            ],
          },

          // mrp logic: if subvariants exist, use subvariant mrp, else variant mrp, else main mrp
          mrp: {
            $cond: [
              {
                $and: [
                  { $ne: ["$variants", null] },
                  { $ne: ["$variants.subvariants", null] },
                  { $gt: [{ $size: "$variants.subvariants" }, 0] },
                ],
              },
              // If there are subvariants, use the MRP of the first subvariant
              {
                $reduce: {
                  input: "$variants.subvariants",
                  initialValue: null,
                  in: {
                    $cond: [
                      { $eq: ["$$value", null] }, // If initialValue is null, return the image
                      "$$this.mrp", // Access the image property of the current element
                      "$$value", // Keep the value if it's not null
                    ],
                  },
                },
              },
              {
                $cond: [
                  { $and: [{ $ne: ["$variants", null] }, { $ne: ["$variants.mrp", null] }] },
                  // Else if there are no subvariants, use the variant MRP
                  "$variants.mrp",
                  // Else use the main MRP
                  "$mrp",
                ],
              },
            ],
          },

          name: {
            $cond: [
              { $and: [{ $ne: ["$variants", null] }, { $ne: ["$variants.name", null] }] }, // If variants array size > 0
              "$variants.name", // Else use variant price
              "$name", // Else use main price
            ],
          },

          // Quantity logic: if subvariants exist, use subvariant quantity, else variant quantity, else main quantity
          quantity: {
            $cond: [
              {
                $and: [
                  { $ne: ["$variants", null] },
                  { $ne: ["$variants.subvariants", null] },
                  { $gt: [{ $size: "$variants.subvariants" }, 0] },
                ],
              },
              // If there are subvariants, use the quantity of the largest subvariant quantity
              {
                $reduce: {
                  input: "$variants.subvariants",
                  initialValue: 0,
                  in: { $cond: [{ $gt: ["$$this.quantity", "$$value"] }, "$$this.quantity", "$$value"] },
                },
              },
              {
                $cond: [
                  { $and: [{ $ne: ["$variants", null] }, { $ne: ["$variants.quantity", null] }] },
                  // Else if there are no subvariants, use the variant quantity
                  "$variants.quantity",
                  // Else use the main product quantity
                  "$quantity",
                ],
              },
            ],
          },
          subvariantId: {
            $cond: [
              {
                $and: [
                  { $ne: ["$variants", null] },
                  { $ne: ["$variants.subvariants", null] },
                  { $gt: [{ $size: "$variants.subvariants" }, 0] },
                ],
              },
              // If there are subvariants, use the quantity of the largest subvariant quantity
              { $arrayElemAt: ["$variants.subvariants", 0] },
              {
                $cond: [
                  { $and: [{ $ne: ["$variants", null] }, { $ne: ["$variants.quantity", null] }] },
                  // Else if there are no subvariants, use the variant quantity
                  "$variants.quantity",
                  // Else use the main product quantity
                  "$quantity",
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          subvariantId: {
            $cond: [{ $ne: ["$subvariantId", null] }, "$subvariantId._id", null],
          },
          variantId: {
            $cond: [{ $ne: ["$variants", null] }, "$variants._id", null],
          },
        },
      },
      //to show in product list availability
      {
        $addFields: {
          status: {
            $cond: [{ $gt: ["$quantity", 0] }, PRODUCT_STATUS.AVAILABLE, PRODUCT_STATUS.UN_AVAILABLE],
          },
        },
      },
      {
        $sort: sortObj, // Apply sorting condition
      },
    ];

    //get paginated data and total document count
    const paginatedData = await paginateAggregate(Product, pipeline, req.query);

    res
      .status(200)
      .json({ message: MESSAGE.PRODUCT.ALLPRODUCTS, data: paginatedData.data, total: paginatedData.total });
  } catch (error) {
    next(error);
  }
};

/* For user  */
export const getProductByIdForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("GET PRODUCT BY ID FOR USER 1");
    const { id } = req.params;

    const existProduct = await Product.findById(id).lean().exec();

    //exist check
    if (!existProduct) {
      throw new Error(ERROR.PRODUCT.NOT_FOUND);
    }

    let product = await Product.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
        },
      },
      {
        $addFields: {
          imagesArr: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] }, // If there are variants
              { $arrayElemAt: ["$variants.imagesArr", 0] }, // Use variants[0].imagesArr
              "$imagesArr", // Otherwise, use root imagesArr
            ],
          },
          specification: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] }, // If there are variants
              {
                $cond: [
                  { $gt: [{ $size: { $arrayElemAt: ["$variants.subvariants", 0] } }, 0] }, // If there are subvariants in variants[0]
                  { $arrayElemAt: [{ $arrayElemAt: ["$variants.subvariants.specification", 0] }, 0] }, // Use subvariant[0].specification
                  { $arrayElemAt: ["$variants.specification", 0] }, // Else, use variants[0].specification
                ],
              },
              "$specification", // Else, use root specification
            ],
          },
          description: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] }, // If there are variants
              {
                $cond: [
                  { $gt: [{ $size: { $arrayElemAt: ["$variants.subvariants", 0] } }, 0] }, // If there are subvariants in variants[0]
                  { $arrayElemAt: [{ $arrayElemAt: ["$variants.subvariants.description", 0] }, 0] }, // Correctly accessing subvariant[0].description
                  { $arrayElemAt: ["$variants.description", 0] }, // Else, use variants[0].description
                ],
              },
              "$description", // Else, use root description
            ],
          },
          name: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] }, // If there are variants
              { $arrayElemAt: ["$variants.name", 0] }, // Use variants[0].imagesArr
              "$name", // Otherwise, use root imagesArr
            ],
          },
          price: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] }, // If there are variants
              {
                $cond: [
                  { $gt: [{ $size: { $arrayElemAt: ["$variants.subvariants", 0] } }, 0] }, // If there are subvariants in variants[0]
                  {
                    $arrayElemAt: [
                      {
                        $arrayElemAt: ["$variants.subvariants.price", 0],
                      },
                      0,
                    ],
                  }, // Correctly accessing subvariant[0].description
                  {
                    $reduce: {
                      input: "$variants",
                      initialValue: null,
                      in: {
                        $cond: [
                          { $eq: ["$$value", null] }, // If initialValue is null, return the image
                          "$$this.price", // Access the image property of the current element
                          "$$value", // Keep the value if it's not null
                        ],
                      },
                    },
                  }, // Else, use variants[0].price
                ],
              },
              "$price", // Else, use root price
            ],
          },
          mrp: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] }, // If there are variants
              {
                $cond: [
                  { $gt: [{ $size: { $arrayElemAt: ["$variants.subvariants", 0] } }, 0] }, // If there are subvariants in variants[0]
                  {
                    $arrayElemAt: [
                      {
                        $arrayElemAt: ["$variants.subvariants.mrp", 0],
                      },
                      0,
                    ],
                  }, // Correctly accessing subvariant[0].description
                  {
                    $arrayElemAt: ["$variants.mrp", 0],
                  }, // Else, use variants[0].mrp
                ],
              },
              "$mrp", // Else, use root mrp
            ],
          },
          selectedVariant: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] }, // If there are variants
              { $arrayElemAt: ["$variants", 0] }, // Else, use variants[0].mrp
              null,
            ],
          },
          selectedSubVariant: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] }, // If there are variants
              {
                $cond: [
                  { $gt: [{ $size: { $arrayElemAt: ["$variants.subvariants", 0] } }, 0] }, // If there are subvariants in variants[0]
                  { $arrayElemAt: [{ $arrayElemAt: ["$variants.subvariants", 0] }, 0] }, // Correctly accessing subvariant[0].description
                  null, // Else, use variants[0].mrp
                ],
              }, // Else, use variants[0].mrp
              null, // Else, use root mrp
            ],
          },
        },
      },
    ]).exec();

    product = product?.length > 0 ? product[0] : null;

    res.status(200).json({ message: MESSAGE.PRODUCT.GOTBYID, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let {
      name,
      sku,
      categoryId,
      brandId,
      specification,
      description,
      thumbnail,
      imagesArr,
      price,
      mrp,
      variants,
      maxItemsPerOrder,
      isBestSeller,
      metaTitle, //for SEO purpose
      metaDescription, //for SEO purpose
    } = req.body;

    const requiredFields: any = {
      Name: name,
      "SKU Code": sku,
      Category: categoryId,
      Brand: brandId,
      Specification: specification,
      Description: description,
      "Maximum Item Per Order": maxItemsPerOrder,
      Price: price,
      MRP: mrp,
    };

    if (!variants?.length) {
      requiredFields.Thumbnail = thumbnail;
    }

    //validating required fields
    verifyRequiredFields(requiredFields);

    //exist check category
    const category = await Category.findById(categoryId).lean().exec();

    if (!category) {
      throw new Error(ERROR.CATEGORY.NOT_FOUND);
    }

    //exist check category
    const brand = await Brand.findById(brandId).lean().exec();

    if (!brand) {
      throw new Error(ERROR.BRAND.NOT_FOUND);
    }

    //exist check for unique product name
    const existProductWithSkuCode = await Product.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      sku: sku,
    })
      .lean()
      .exec();

    if (existProductWithSkuCode) {
      throw new Error(ERROR.PRODUCT.EXIST_SKU_CODE);
    }

    //exist check for unique product name
    const existProduct = await Product.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      name: name,
      brandId: new Types.ObjectId(brandId),
      categoryId: new Types.ObjectId(categoryId),
      isDeleted: false,
    })
      .lean()
      .exec();

    if (existProduct) {
      throw new Error(ERROR.PRODUCT.EXIST);
    }

    //price should be less than mrp
    if (price > mrp) {
      throw new Error(ERROR.PRODUCT.MRP_GT_PRICE);
    }

    const updateObj: Partial<IProduct> = {
      name,
      sku,
      categoryId,
      categoryName: category?.name,
      brandId,
      brandName: brand?.name,
      specification,
      description,
      price,
      mrp,
      maxItemsPerOrder,
      isBestSeller,
    };

    if (metaDescription) {
      updateObj.metaDescription = metaDescription;
    }

    if (metaTitle) {
      updateObj.metaTitle = metaTitle;
    }

    //variants images and image gallery processing.
    if (variants?.length) {
      for (const el of variants) {
        if (el?.image && el?.image.startsWith("data:")) {
          el.image = await storeFileAndReturnNameBase64(el?.image);
        }
        if (el?.imagesArr?.length) {
          for (const img of el?.imagesArr) {
            if (img?.image && img?.image.startsWith("data:")) {
              img.image = await storeFileAndReturnNameBase64(img?.image);
            }
          }
        }
      }
      updateObj.variants = variants;
    }

    //images and image gallery processing.
    if (imagesArr?.length) {
      for (const el of imagesArr) {
        if (el?.image && el?.image?.startsWith("data:")) {
          el.image = await storeFileAndReturnNameBase64(el?.image);
        }
      }
      updateObj.imagesArr = imagesArr;
    }

    if (thumbnail && thumbnail?.startsWith("data:")) {
      thumbnail = await storeFileAndReturnNameBase64(thumbnail);
    }

    if (thumbnail) {
      updateObj.thumbnail = thumbnail;
    }

    await Product.findByIdAndUpdate(id, { $set: updateObj }).exec();

    res.status(200).json({ message: MESSAGE.PRODUCT.UPDATED });
  } catch (error) {
    next(error);
  }
};

export const updateProductIsBestSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { isBestSeller } = req.body;

    const product = await Product.findOne({ _id: new Types.ObjectId(), isDeleted: false }).lean().exec();

    if (!product) {
      throw new Error(ERROR.PRODUCT.NOT_FOUND);
    }

    //set the boolean in the body to isBestSeller.
    await Product.findByIdAndUpdate(id, { $set: { isBestSeller: isBestSeller } }).exec();

    res.status(200).json({ message: MESSAGE.PRODUCT.UPDATED });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).lean().exec();

    //exist check
    if (!product) {
      throw new Error(ERROR.PRODUCT.NOT_FOUND);
    }

    await Product.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    res.status(200).json({ message: MESSAGE.PRODUCT.REMOVED });
  } catch (error) {
    next(error);
  }
};
