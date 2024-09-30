import { model, Schema, Types } from "mongoose";

export interface IProduct {
  name: string;
  sku: string;
  category: Types.ObjectId;
  brand: Types.ObjectId;
  specification: string;
  description: string;
  thumbnail: string;
  price: number;
  mrp: number;
  variants: {
    title: string;
    image: string;
    price: number;
    imagesArr: { image: string }[];
    subvariants: { name: string; price: number }[];
  }[];
}

const productSchema = new Schema<IProduct>(
  {
    name: String,
    sku: String,
    category: Types.ObjectId,
    brand: Types.ObjectId,
    specification: String,
    description: String,
    thumbnail: String,
    price: Number,
    mrp: Number,
    variants: [
      {
        title: String,
        image: String,
        price: Number,
        imagesArr: [{ image: String }],
        subvariants: [{ name: String, price: Number }],
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const Product = model<IProduct>("products", productSchema);
