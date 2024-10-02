import { model, Schema, Types } from "mongoose";

export interface ICart {
  userId: Types.ObjectId;
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
}

const cartSchema = new Schema<ICart>(
  {
    userId: Types.ObjectId,
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
  },
  {
    timestamps: true,
  },
);

cartSchema.index({ userId: 1 });

export const Cart = model<ICart>("carts", cartSchema);
