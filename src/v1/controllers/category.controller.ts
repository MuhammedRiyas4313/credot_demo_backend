import { ERROR } from "common/error.common";
import { MESSAGE } from "common/messages.common";
import { NextFunction, Request, Response } from "express";
import { Category, ICategory } from "models/category.model";
import { PipelineStage, Types } from "mongoose";
import { verifyRequiredFields } from "utils/error";
import { storeFileAndReturnNameBase64 } from "utils/fileSystem";
import { paginateAggregate } from "utils/paginateAggregate";
import { createFlexibleRegex } from "utils/regex";

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { name, thumbnail } = req.body;

    const requiredFields = {
      Name: name,
      Thumbnail: thumbnail,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    //exist check for unique category name
    const existcategory = await Category.findOne({
      name: { $regex: new RegExp(createFlexibleRegex(name), "i") },
      isDeleted: false,
    })
      .lean()
      .exec();

    if (existcategory) {
      throw new Error(ERROR.CATEGORY.EXIST);
    }

    const newcategoryObj: Partial<ICategory> = {
      name,
    };

    thumbnail = await storeFileAndReturnNameBase64(thumbnail);

    if (thumbnail) {
      newcategoryObj.thumbnail = thumbnail;
    }

    await Category.create(newcategoryObj);

    res.status(201).json({ message: MESSAGE.CATEGORY.CREATED });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, sort, order } = req.query;

    //filtered soft deleted categorys
    let matchObj: Record<string, any> = { isDeleted: false };
    let sortObj: Record<string, any> = { createdAt: -1 };

    //search for categories
    if (search && typeof search === "string") {
      matchObj.name = { $regex: new RegExp(createFlexibleRegex(search), "i") };
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
    const paginatedData = await paginateAggregate(Category, pipeline, req.query);

    res
      .status(200)
      .json({ message: MESSAGE.CATEGORY.ALLCATEGORY, data: paginatedData.data, total: paginatedData.total });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).lean().exec();

    //exist check
    if (!category) {
      throw new Error(ERROR.CATEGORY.NOT_FOUND);
    }

    res.status(200).json({ message: MESSAGE.CATEGORY.GOTBYID, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let { name, thumbnail } = req.body;

    const category = await Category.findById(id).lean().exec();

    //exist check
    if (!category) {
      throw new Error(ERROR.CATEGORY.NOT_FOUND);
    }

    const requiredFields = {
      Name: name,
      Thumbnail: thumbnail,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    //exist check for unique category name
    const existcategory = await Category.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      name: { $regex: new RegExp(createFlexibleRegex(name), "i") },
      isDeleted: false,
    })
      .lean()
      .exec();

    if (existcategory) {
      throw new Error(ERROR.CATEGORY.EXIST);
    }
    // Assign the updated name to the update object

    if (thumbnail && thumbnail.startsWith("data:")) {
      //check type base64 or filename with extension, if base 64 need updation
      thumbnail = await storeFileAndReturnNameBase64(thumbnail);
    }

    let updateObj: Partial<ICategory> = {
      name,
      thumbnail,
    };

    await Category.findByIdAndUpdate(id, { $set: updateObj }).exec();

    res.status(200).json({ message: MESSAGE.CATEGORY.UPDATED });
  } catch (error) {
    next(error);
  }
};

export const deletecategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).lean().exec();

    //exist check
    if (!category) {
      throw new Error(ERROR.CATEGORY.NOT_FOUND);
    }

    await Category.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    res.status(200).json({ message: MESSAGE.CATEGORY.REMOVED });
  } catch (error) {
    next(error);
  }
};
