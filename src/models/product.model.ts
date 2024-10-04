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
  thumbnail: string; //required
  maxItemsPerOrder: number;
  imagesArr: { image: string }[]; //not required.
  price: number;
  mrp: number;
  quantity: number;
  isBestSeller: boolean;
  variants: {
    title: string;
    image: string;
    price: number;
    mrp: number;
    quantity: number;
    specification: string;
    description: string;
    createdAt: Date;
    imagesArr: { image: string }[]; //to show multiple images of a variant.
    subvariants: {
      title: string;
      price: number;
      mrp: number;
      quantity: number;
      specification: string;
      description: string;
      createdAt: Date;
    }[];
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
    quantity: Number, //this will consider as the stock when there is no variants.
    maxItemsPerOrder: Number, //should be a positive value
    isBestSeller: { type: Boolean, default: false },
    variants: [
      {
        title: String,
        image: String,
        price: Number,
        mrp: Number,
        quantity: Number, //if variants and no sub variants
        specification: String,
        description: String,
        createdAt: { type: Date, default: new Date() },
        imagesArr: [{ image: String }],
        subvariants: [
          {
            title: String,
            price: Number,
            mrp: Number,
            quantity: Number,
            specification: String,
            description: String,
            createdAt: { type: Date, default: new Date() },
          },
        ], // this quantity have the high priority.
      },
    ],
    isDeleted: { type: Boolean, default: false },
    metaTitle: String,
    metaDescription: String,
    imagesArr: [{ image: String }], //if there is no variants, not required!
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ brandName: 1 });
productSchema.index({ categoryName: 1 });

export const Product = model<IProduct>("products", productSchema);
