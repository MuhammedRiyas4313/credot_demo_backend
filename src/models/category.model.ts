import { model, Schema } from "mongoose";

export interface ICategory {
  name: string;
  thumbnail: string;
  isDeleted: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: String,
    thumbnail: String,
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ name: 1 });
categorySchema.index({ isDeleted: 1 });

export const Category = model<ICategory>("categories", categorySchema);
