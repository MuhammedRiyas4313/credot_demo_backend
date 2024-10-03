import { SORT_ORDER } from "common/constant.common";
import { ERROR } from "common/error.common";
import { MESSAGE } from "common/messages.common";
import { NextFunction, Request, Response } from "express";
import { Brand, IBrand } from "models/brand.model";
import { PipelineStage, Types } from "mongoose";
import { verifyRequiredFields } from "utils/error";
import { storeFileAndReturnNameBase64 } from "utils/fileSystem";
import { paginateAggregate } from "utils/paginateAggregate";
import { createFlexibleRegex } from "utils/regex";

export const createBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { name, logo, priority } = req.body;

    const requiredFields = {
      Name: name,
      Logo: logo,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    //exist check for unique brand name
    const existBrand = await Brand.findOne({
      name: { $regex: new RegExp(createFlexibleRegex(name), "i") },
      isDeleted: false,
    })
      .lean()
      .exec();

    if (existBrand) {
      throw new Error(ERROR.BRAND.EXIST);
    }

    const newBrandObj: Partial<IBrand> = {
      name,
    };

    if (priority) {
      //exist check for priority
      const existBrandWithPriority = await Brand.findOne({
        $and: [{ priority }, { priority: { $ne: null } }, { isDeleted: false }],
      })
        .lean()
        .exec();

      if (existBrandWithPriority) {
        throw new Error(ERROR.BRAND.EXIST_WITH_PRIORITY);
      }
      newBrandObj.priority = priority;
    }

    logo = await storeFileAndReturnNameBase64(logo);

    if (logo) {
      newBrandObj.logo = logo;
    }

    await Brand.create(newBrandObj);

    res.status(201).json({ message: MESSAGE.BRAND.CREATED });
  } catch (error) {
    next(error);
  }
};

export const getBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, sort, order } = req.query;

    //filtered soft deleted brands
    let matchObj: Record<string, any> = { isDeleted: false };
    let sortObj: Record<string, any> = {};

    //search for brands
    if (search && typeof search === "string") {
      matchObj.name = { $regex: new RegExp(createFlexibleRegex(search), "i") };
      req.query.pageIndex = "0";
      req.query.pageSize = "10";
    }

    let pipeline: PipelineStage[] = [
      {
        $match: matchObj,
      },
    ];

    // If sort and order parameters are provided, add a $sort stage to the pipeline
    if (sort && sort !== "" && order && order !== "") {
      sortObj[`${sort}`] = order === SORT_ORDER.ASCE ? 1 : -1;
      pipeline.push({
        $sort: sortObj,
      });
    }

    //get paginated data and total document count
    const paginatedData = await paginateAggregate(Brand, pipeline, req.query);

    res.status(200).json({ message: MESSAGE.BRAND.ALLBRANDS, data: paginatedData.data, total: paginatedData.total });
  } catch (error) {
    next(error);
  }
};

export const getBrandById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id).lean().exec();

    //exist check
    if (!brand) {
      throw new Error(ERROR.BRAND.NOT_FOUND);
    }

    res.status(200).json({ message: MESSAGE.BRAND.GOTBYID, data: brand });
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let { name, logo, priority } = req.body;

    const requiredFields = {
      Name: name,
      Logo: logo,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    const brand = await Brand.findById(id).lean().exec();

    //exist check
    if (!brand) {
      throw new Error(ERROR.BRAND.NOT_FOUND);
    }

    //exist check for unique brand name
    const existBrand = await Brand.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      name: { $regex: new RegExp(createFlexibleRegex(name), "i") },
      isDeleted: false,
    })
      .lean()
      .exec();

    if (existBrand) {
      throw new Error(ERROR.BRAND.EXIST);
    }

    if (logo && logo.startsWith("data:")) {
      //check type base64 or filename with extension, if base 64 need updation
      logo = await storeFileAndReturnNameBase64(logo);
    }

    let updateObj: Partial<IBrand> = {
      name,
      logo,
    };

    if (priority) {
      //exist check for priority
      const existBrandWithPriority = await Brand.findOne({
        $and: [
          { _id: { $ne: new Types.ObjectId(id) } },
          { priority },
          { priority: { $ne: null } },
          { isDeleted: false },
        ],
      })
        .lean()
        .exec();

      if (existBrandWithPriority) {
        throw new Error(ERROR.BRAND.EXIST_WITH_PRIORITY);
      }
      updateObj.priority = priority;
    }

    await Brand.findByIdAndUpdate(id, { $set: updateObj }).exec();

    res.status(200).json({ message: MESSAGE.BRAND.UPDATED });
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id).lean().exec();

    //exist check
    if (!brand) {
      throw new Error(ERROR.BRAND.NOT_FOUND);
    }

    await Brand.findByIdAndUpdate(id, { $set: { isDeleted: true }, $unset: { priority: 1 } });

    res.status(200).json({ message: MESSAGE.BRAND.REMOVED });
  } catch (error) {
    next(error);
  }
};
