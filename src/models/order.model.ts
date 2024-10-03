import { ORDER_STATUS, ORDER_STATUS_TYPE } from "common/constant.common";
import { model, Schema, Types } from "mongoose";

export interface IOrder {
  userId: Types.ObjectId;
  addressId: Types.ObjectId;
  itemsArr: {
    sku: string;
    variantId?: Types.ObjectId;
    subvariantId?: Types.ObjectId;
    price: number;
    mrp: number;
    quantity: number;
    total: number;
    createdAt: Date;
  }[];
  grandTotal: number;
  itemsCount: number;
  status: ORDER_STATUS_TYPE;
  remark: string; //to cancel the order remark is mandatory!
}

const orderSchema = new Schema<IOrder>(
  {
    userId: Types.ObjectId,
    addressId: Types.ObjectId,
    itemsArr: [
      {
        sku: String,
        variantId: Types.ObjectId,
        subvariantId: Types.ObjectId,
        price: Number,
        mrp: Number,
        quantity: Number,
        total: Number,
        createdAt: Date,
      },
    ],
    grandTotal: Number,
    itemsCount: Number,
    status: { type: String, default: ORDER_STATUS.INITIATED },
    remark: String,
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });

export const Order = model<IOrder>("orders", orderSchema);
