import { SORT_ORDER } from "common/constant.common";
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
      metaTitle, //for SEO purpose
      metaDescription, //for SEO purpose
    } = req.body;

    const requiredFields: any = {
      Name: name,
      "SKU Code": sku,
      Category: categoryId,
      Brand: brandId,
      Thumbnail: thumbnail,
      Specification: specification,
      Description: description,
      Price: price,
      MRP: mrp,
    };

    //either variants or image gallery required.
    if (!variants?.length && !imagesArr?.length) {
      requiredFields["Images"] = undefined;
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

    thumbnail = await storeFileAndReturnNameBase64(thumbnail);

    if (thumbnail) {
      newproductObj.thumbnail = thumbnail;
    }

    await Product.create(newproductObj);

    res.status(201).json({ message: MESSAGE.PRODUCT.CREATED });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    //filtered soft deleted products
    let matchObj: Record<string, any> = { isDeleted: false };
    let sortObj: Record<string, any> = { createdAt: -1 };

    //search for categories
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
      metaTitle, //for SEO purpose
      metaDescription, //for SEO purpose
    } = req.body;

    const requiredFields: any = {
      Name: name,
      "SKU Code": sku,
      Category: categoryId,
      Brand: brandId,
      Thumbnail: thumbnail,
      Specification: specification,
      Description: description,
      Price: price,
      MRP: mrp,
    };

    //either variants or image gallery required.
    if (!variants?.length && !imagesArr?.length) {
      requiredFields["Images"] = undefined;
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
      sku: { $regex: new RegExp(createFlexibleRegex(sku), "i") },
    })
      .lean()
      .exec();

    if (existProductWithSkuCode) {
      throw new Error(ERROR.PRODUCT.EXIST_SKU_CODE);
    }

    //exist check for unique product name
    const existProduct = await Product.findOne({
      _id: { $ne: new Types.ObjectId(id) },
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
            if (img?.image && el?.image.startsWith("data:")) {
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

export const deleteProductById = async (req: Request, res: Response, next: NextFunction) => {
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
