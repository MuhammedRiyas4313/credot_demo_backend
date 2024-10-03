import { model, Schema, Types } from "mongoose";

export interface IAddress {
  userId: Types.ObjectId;
  place: string;
  address: string;
  pincode: any;
  phone: string;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: Types.ObjectId,
    place: String,
    address: String,
    pincode: Schema.Types.Mixed,
    phone: String,
  },
  {
    timestamps: true,
  },
);

addressSchema.index({ userId: 1 });

export const Address = model<IAddress>("addresses", addressSchema);
