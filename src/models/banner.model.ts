import { STATUS_TYPE } from "common/constant.common";
import { model, Schema } from "mongoose";

export interface IBanner {
  status: STATUS_TYPE;
  imagesArr: { image: string; title: string; tagline: string; releaseDate: string; buttonText: string; url: string }[];
}

const bannerSchema = new Schema<IBanner>(
  {
    status: String,
    imagesArr: [
      {
        image: String,
        title: String,
        tagline: String,
        releaseDate: String,
        buttonText: String,
        url: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const Banner = model<IBanner>("banners", bannerSchema);
