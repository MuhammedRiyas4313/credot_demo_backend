import { USER_STATUS } from "common/constant.common";
import { ERROR } from "common/error.common";
import { MESSAGE } from "common/messages.common";
import { NextFunction, Request, Response } from "express";
import { User, IUser } from "models/user.model";
import { PipelineStage, Types } from "mongoose";
import { comparePassword, encryptPassword } from "utils/bcrypt";
import { verifyRequiredFields } from "utils/error";
import { generateAccessJwt } from "utils/jwt";
import { paginateAggregate } from "utils/paginateAggregate";
import { createFlexibleRegex } from "utils/regex";

/* user self registration */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { name, email, password } = req.body;

    const requiredFields = {
      Name: name,
      Email: email,
      Password: password,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    //exist check for unique user email
    const existuser = await User.findOne({
      email: { $regex: new RegExp(createFlexibleRegex(email), "i") },
      isDeleted: false,
    })
      .lean()
      .exec();

    if (existuser) {
      throw new Error(ERROR.USER.EMAIL_BEING_USED);
    }

    //encrypt password
    password = await encryptPassword(password);

    const newuserObj: Partial<IUser> = {
      name,
      email,
      password,
    };

    await User.create(newuserObj);

    res.status(201).json({ message: MESSAGE.USER.CREATED });
  } catch (error) {
    next(error);
  }
};

/* User login */
export const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { email, password } = req.body;

    const user = await User.findOne({ email: { $regex: new RegExp(createFlexibleRegex(email), "i") } })
      .lean()
      .exec();

    if (!user) {
      throw new Error(ERROR.USER.CAN_NOT_FOUND);
    }

    const passwordCheck = await comparePassword(user.password, password);

    if (!passwordCheck) {
      throw new Error(ERROR.USER.INVALID_CREDENTIAL);
    }

    let accessToken = await generateAccessJwt({ userId: String(user._id), role: user.role });

    res.status(200).json({
      message: MESSAGE.USER.LOGGED_IN,
      token: accessToken,
      id: user._id,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    //filtered soft deleted users
    let matchObj: Record<string, any> = { isDeleted: false };
    let sortObj: Record<string, any> = { createdAt: -1 };

    //search for users
    if (search && typeof search === "string") {
      matchObj.$and = [
        { name: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
        { email: { $regex: new RegExp(createFlexibleRegex(search), "i") } },
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
    const paginatedData = await paginateAggregate(User, pipeline, req.query);

    res.status(200).json({ message: MESSAGE.USER.ALLUSERS, data: paginatedData.data, total: paginatedData.total });
  } catch (error) {
    next(error);
  }
};

export const getuserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).lean().exec();

    //exist check
    if (!user) {
      throw new Error(ERROR.USER.NOT_FOUND);
    }

    res.status(200).json({ message: MESSAGE.USER.GOTBYID, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let { name, email } = req.body;

    const user = await User.findById(id).lean().exec();

    //exist check
    if (!user) {
      throw new Error(ERROR.USER.NOT_FOUND);
    }

    const requiredFields = {
      Name: name,
      Email: email,
    };

    //validating required fields
    verifyRequiredFields(requiredFields);

    //exist check for unique user email
    const existuser = await User.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      email: { $regex: new RegExp(createFlexibleRegex(email), "i") },
      isDeleted: false,
    })
      .lean()
      .exec();

    if (existuser) {
      throw new Error(ERROR.USER.EMAIL_BEING_USED);
    }

    let updateObj: Partial<IUser> = {
      name,
      email,
    };

    await User.findByIdAndUpdate(id, { $set: updateObj }).exec();

    res.status(200).json({ message: MESSAGE.USER.UPDATED });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let { status } = req.body;

    const user = await User.findById(id).lean().exec();

    //exist check
    if (!user) {
      throw new Error(ERROR.USER.NOT_FOUND);
    }

    if (!Object.values(USER_STATUS).includes(status)) {
      throw new Error(ERROR.STATUS.NOT_DEFINED);
    }

    let updateObj: Partial<IUser> = {
      status,
    };

    await User.findByIdAndUpdate(id, { $set: updateObj }).exec();

    res.status(200).json({ message: MESSAGE.USER.STATUS_UPDATED });
  } catch (error) {
    next(error);
  }
};

export const deleteuserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).lean().exec();

    //exist check
    if (!user) {
      throw new Error(ERROR.USER.NOT_FOUND);
    }

    await User.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    res.status(200).json({ message: MESSAGE.USER.REMOVED });
  } catch (error) {
    next(error);
  }
};
