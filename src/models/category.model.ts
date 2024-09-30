import { model, Schema, Types } from "mongoose";

export interface ICategory {
  name: string;
  brand: Types.ObjectId;
  thumbnail: string;
}

const categorySchema = new Schema<ICategory>(
  {
    name: String,
    brand: Types.ObjectId,
    thumbnail: String,
  },
  {
    timestamps: true,
  },
);

export const Category = model<ICategory>("categories", categorySchema);
