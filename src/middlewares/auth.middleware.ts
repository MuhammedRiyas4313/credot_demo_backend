import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "common/config.common";
import { User } from "models/user.model";
import { Types } from "mongoose";
import { ROLES, ROLES_TYPE, USER_STATUS } from "common/constant.common";
import { ERROR } from "common/error.common";

/**
 * @description authorize all roles to use the route
 */
export const authorizeJwt: RequestHandler = async (req, res, next) => {
  // console.log(req.headers);

  const authorization = req.headers["authorization"];
  let token = authorization && authorization.split("Bearer ")[1];
  if (!token && typeof req.query.token == "string") {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ message: ERROR.TOKEN.INVALID });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, CONFIG.JWT_ACCESS_TOKEN_SECRET);
    if (decoded?.userId) {
      const user = await User.findOne({ _id: new Types.ObjectId(decoded.userId), status: USER_STATUS.BLOCKED })
        .lean()
        .exec();
      //if user is blocked? delete the token and keep the client loged out.
      if (user) {
        throw new Error(ERROR.USER.ACCOUNT_BLOCKED);
      }
    }
    next();
  } catch (e: any) {
    console.error(e);
    res.status(401).json({ message: e?.message ? e?.message : ERROR.TOKEN.TRY_AGAIN });
  }
};

/**
 * @description setting user obj for every request
 */
export const setUserAndUserObj: RequestHandler = async (req, res, next) => {
  const authorization = req.headers["authorization"];
  let token = authorization && authorization.split("Bearer ")[1];
  if (!token && typeof req.query.token == "string") {
    token = req.query.token;
  }
  if (token) {
    try {
      const decoded: any = jwt.verify(token, CONFIG.JWT_ACCESS_TOKEN_SECRET);
      if (decoded) {
        req.user = decoded;
      }

      if (req.user) {
        req.user.userObj = await User.findById(decoded.userId).lean().exec();
      }
    } catch (e) {
      console.error(e);
      res.status(401).json({ message: ERROR.TOKEN.INVALID });
      return;
    }
  }
  next();
};

export const checkPermission = (req: Request, res: Response, next: NextFunction) => {
  type USER_ROLE = ROLES_TYPE | undefined;

  try {
    if (!req.user?.userObj) {
      res.status(403).json({ message: ERROR.TOKEN.INVALID });
      return;
    }

    const userRole: USER_ROLE = req.user?.userObj?.role;

    if (userRole === ROLES.ADMIN) {
      next();
    } else {
      res.status(403).json({ message: ERROR.ROLE.INSUFFICIENT_PERMISSION });
      return;
    }
  } catch (error) {
    console.error(error, "ERROR IN CHECK PERMISSION");
    res.status(403).json({ message: ERROR.ROLE.INSUFFICIENT_PERMISSION });
  }
};
