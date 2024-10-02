import { ROLES_TYPE, USER_STATUS, USER_STATUS_TYPE } from "common/constant.common";
import { model, Schema } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
  status: USER_STATUS_TYPE;
  role: ROLES_TYPE;
  isDeleted: boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: String,
    email: String,
    password: String,
    status: { type: String, default: USER_STATUS.ACTIVE },
    role: String,
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ name: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isDeleted: 1 });

export const User = model<IUser>("users", userSchema);
