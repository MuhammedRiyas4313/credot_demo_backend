import { model, Schema } from "mongoose";

export interface IBrand {
  name: string;
  logo: string;
  order: any;
}

const brandSchema = new Schema<IBrand>(
  {
    name: String,
    logo: String,
    order: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
);

export const Brand = model<IBrand>("brands", brandSchema);
