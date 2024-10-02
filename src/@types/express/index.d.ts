import express from "express";
import mongoose, { Types } from "mongoose";
import { IUser } from "models/user.model";
import { ROLES_TYPE } from "common/constant.common";
import { access_jwt } from "utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: access_jwt & {
        userObj?:
          | (mongoose.FlattenMaps<IUser> & {
              _id: Types.ObjectId;
            })
          | null;
      };
    }
  }
}
