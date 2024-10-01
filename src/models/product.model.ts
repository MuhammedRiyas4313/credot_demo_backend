import { model, Schema, Types } from "mongoose";

export interface IProduct {
  name: string;
  sku: string;
  categoryId: Types.ObjectId;
  categoryName: string;
  brandId: Types.ObjectId;
  brandName: string;
  specification: string;
  description: string;
  thumbnail: string;
  imagesArr: { image: string }[];
  price: number;
  mrp: number;
  variants: {
    title: string;
    image: string;
    price: number;
    mrp: number;
    imagesArr: { image: string }[];
    subvariants: { title: string; price: number; mrp: number }[];
  }[];
  isDeleted: boolean;
  metaTitle: string;
  metaDescription: string;
}

const productSchema = new Schema<IProduct>(
  {
    name: String,
    sku: String,
    categoryId: Types.ObjectId,
    categoryName: String,
    brandId: Types.ObjectId,
    brandName: String,
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
        mrp: Number,
        imagesArr: [{ image: String }],
        subvariants: [{ title: String, price: Number, mrp: Number }],
      },
    ],
    isDeleted: { type: Boolean, default: false },
    metaTitle: String,
    metaDescription: String,
    imagesArr: [{ image: String }], //if there is no variants then this gallery required
  },
  {
    timestamps: true,
  },
);

export const Product = model<IProduct>("products", productSchema);
