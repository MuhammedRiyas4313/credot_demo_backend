import { STATUS } from "common/constant.common";
import { ERROR } from "common/error.common";
import { MESSAGE } from "common/messages.common";
import { NextFunction, Request, Response } from "express";
import { Banner, IBanner } from "models/banner.model";
import { PipelineStage, Types } from "mongoose";
import { verifyRequiredFields } from "utils/error";
import { storeFileAndReturnNameBase64 } from "utils/fileSystem";
import { paginateAggregate } from "utils/paginateAggregate";

export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { imagesArr, status } = req.body;

    const requiredFields = {
      Images: imagesArr?.length ? imagesArr : undefined,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    if (imagesArr?.length) {
      for (const el of imagesArr) {
        if (el?.image) {
          el.image = await storeFileAndReturnNameBase64(el.image);
        }
      }
    }

    if (status === STATUS.ACTIVE) {
      await Banner.updateMany({ status }, { $set: { status: STATUS.INACTIVE } });
    }

    const newBanner: Partial<IBanner> = {
      status,
      imagesArr,
    };

    await Banner.create(newBanner);

    res.status(201).json({ message: MESSAGE.BANNER.CREATED });
  } catch (error) {
    next(error);
  }
};

/* For admin */
export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //filtered soft deleted banner
    let matchObj: Record<string, any> = {};

    let pipeline: PipelineStage[] = [
      {
        $match: matchObj,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];

    //get paginated data and total document count
    const paginatedData = await paginateAggregate(Banner, pipeline, req.query);

    res.status(200).json({ message: MESSAGE.BANNER.ALL_BANNERS, data: paginatedData.data, total: paginatedData.total });
  } catch (error) {
    next(error);
  }
};

/* Get active banner for users */
export const getActiveBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banner = await Banner.findOne({ status: STATUS.ACTIVE }).lean().exec();

    //exist check
    if (!banner) {
      throw new Error(ERROR.BANNER.NO_ACTIVE_BANNERS);
    }

    res.status(200).json({ message: MESSAGE.BANNER.GOT_ACTIVE, data: banner });
  } catch (error) {
    next(error);
  }
};

/* Get banner by id */
export const getBannerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id).lean().exec();

    //exist check
    if (!banner) {
      throw new Error(ERROR.BANNER.NOT_FOUND);
    }

    res.status(200).json({ message: MESSAGE.BANNER.GOT_ACTIVE, data: banner });
  } catch (error) {
    next(error);
  }
};

/* could be use for update only status but have to send imagesArr aswell*/
export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let banner = await Banner.findById(id).exec();

    if (!banner) {
      throw new Error(ERROR.BANNER.NOT_FOUND);
    }

    let { imagesArr, status } = req.body;

    const requiredFields = {
      Images: imagesArr?.length ? imagesArr : undefined,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    if (Array.isArray(imagesArr) && imagesArr?.length) {
      for (const el of imagesArr) {
        if (el?.image && el?.image.startsWith("data:")) {
          el.image = await storeFileAndReturnNameBase64(el.image);
        }
      }
    }

    if (status === STATUS.ACTIVE) {
      await Banner.updateMany({ status: STATUS.ACTIVE }, { $set: { status: STATUS.INACTIVE } });
    }

    banner.status = status;
    banner.imagesArr = imagesArr;

    await banner.save();

    res.status(200).json({ message: MESSAGE.BANNER.UPDATED });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id).lean().exec();

    //exist check
    if (!banner) {
      throw new Error(ERROR.BANNER.NOT_FOUND);
    }

    await Banner.findByIdAndDelete(id).exec();

    res.status(200).json({ message: MESSAGE.BANNER.REMOVED });
  } catch (error) {
    next(error);
  }
};
