import { model, Schema } from "mongoose";

export interface IBrand {
  name: string;
  logo: string;
  priority: any; //for sort to show in a specific order for user not a required field either null or number
  isDeleted: boolean;
}

const brandSchema = new Schema<IBrand>(
  {
    name: String,
    logo: String,
    priority: Schema.Types.Mixed,
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

brandSchema.index({ name: 1 });
brandSchema.index({ priority: 1 });
brandSchema.index({ isDeleted: 1 });

export const Brand = model<IBrand>("brands", brandSchema);
