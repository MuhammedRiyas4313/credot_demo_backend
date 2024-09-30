import { model, Schema, Types } from "mongoose";

export interface ICart {
  userId: Types.ObjectId;
  itemsArr: { skucode: string; price: number; mrp: string; quantity: number; total: number }[];
  grandTotal: number;
  itemsCount: number;
}

const cartSchema = new Schema<ICart>(
  {
    userId: Types.ObjectId,
    itemsArr: [
      {
        skucode: String,
        price: Number,
        mrp: Number,
        quantity: Number,
        total: Number,
      },
    ],
    grandTotal: Number,
    itemsCount: Number,
  },
  {
    timestamps: true,
  },
);

export const Cart = model<ICart>("carts", cartSchema);
