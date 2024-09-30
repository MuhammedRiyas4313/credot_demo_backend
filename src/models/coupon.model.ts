import { COUPON_STATUS, COUPON_STATUS_TYPE, COUPON_TYPE_TYPE } from "common/constant.common";
import { model, Schema } from "mongoose";

export interface ICoupon {
  code: string;
  type: COUPON_TYPE_TYPE;
  validity: Date;
  discount: Number; // if the type is percentage discount will be percentage, if it is flat then discount will be the amount
  minimumPurchaseAmount: number;
  applicableProducts: string[]; // List of product SKU codes the coupon applies to
  isApplicableForAll: boolean;
  isActive: COUPON_STATUS_TYPE;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: String,
    type: String,
    validity: Date,
    discount: Number,
    minimumPurchaseAmount: Number,
    applicableProducts: [String],
    isApplicableForAll: Boolean,
    isActive: { type: String, default: COUPON_STATUS.ACTIVE },
  },
  {
    timestamps: true,
  },
);

export const Coupon = model<ICoupon>("coupons", couponSchema);
