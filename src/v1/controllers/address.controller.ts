import { ERROR } from "common/error.common";
import { MESSAGE } from "common/messages.common";
import { NextFunction, Request, Response } from "express";
import { Address, IAddress } from "models/address.model";
import { PipelineStage, Types } from "mongoose";
import { verifyRequiredFields } from "utils/error";
import { paginateAggregate } from "utils/paginateAggregate";

export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { place, address, pincode, phone } = req.body;

    const requiredFields = {
      Place: place,
      Address: address,
      "Pin Code": pincode,
      Phone: phone,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    const userId = req.user?.userId;

    if (!userId) {
      throw new Error(ERROR.USER.INVALID_USER_ID);
    }

    const newaddressObj: Partial<IAddress> = {
      userId: new Types.ObjectId(userId),
      place,
      address,
      pincode,
      phone,
    };

    await Address.create(newaddressObj);

    res.status(201).json({ message: MESSAGE.ADDRESS.CREATED });
  } catch (error) {
    next(error);
  }
};

/* For user according to userId */
export const getAddressByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //id = userId
    const { id } = req.params;

    //filtered soft deleted addresss
    let matchObj: Record<string, any> = { isDeleted: false };

    //match for specific user
    if (id && typeof id === "string") {
      matchObj.userId = new Types.ObjectId(id);
    }

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
    const paginatedData = await paginateAggregate(Address, pipeline, req.query);

    res.status(200).json({ message: MESSAGE.ADDRESS.ADDRESSES, data: paginatedData.data, total: paginatedData.total });
  } catch (error) {
    next(error);
  }
};

/* get address by address id for update */
export const getAddressById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const address = await Address.findById(id).lean().exec();

    //exist check
    if (!address) {
      throw new Error(ERROR.ADDRESS.NOT_FOUND);
    }

    res.status(200).json({ message: MESSAGE.ADDRESS.GOTBYID, data: address });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let { place, address, pincode, phone } = req.body;

    const requiredFields = {
      Place: place,
      Address: address,
      "Pin Code": pincode,
      Phone: phone,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    const existAddress = await Address.findById(id).exec();

    //exist check
    if (!existAddress) {
      throw new Error(ERROR.ADDRESS.NOT_FOUND);
    }

    existAddress.place = place;
    existAddress.address = address;
    existAddress.pincode = pincode;
    existAddress.phone = phone;

    await existAddress.save();

    res.status(200).json({ message: MESSAGE.ADDRESS.UPDATED });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const address = await Address.findById(id).lean().exec();

    //exist check
    if (!address) {
      throw new Error(ERROR.ADDRESS.NOT_FOUND);
    }

    await Address.findByIdAndDelete(id).lean().exec();

    res.status(200).json({ message: MESSAGE.ADDRESS.REMOVED });
  } catch (error) {
    next(error);
  }
};
