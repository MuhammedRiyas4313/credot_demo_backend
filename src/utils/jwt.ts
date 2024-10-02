import jwt from "jsonwebtoken";
import { CONFIG } from "../common/config.common";
import { ROLES_TYPE } from "common/constant.common";

export type access_jwt = {
  userId: string;
  role: ROLES_TYPE;
};

export const generateAccessJwt = async (obj: access_jwt) => {
  return jwt.sign(
    {
      ...obj,
      exp: Math.floor(Date.now() / 1000) + 604800, //valid for 7 days
    },
    CONFIG.JWT_ACCESS_TOKEN_SECRET,
  );
};
