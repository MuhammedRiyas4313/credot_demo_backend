import express from "express";

/* Routes */
import indexRouter from "./routes/index.routes";

import bannerRouter from "./routes/banner.routes";

/* Inventory */
import brandRouter from "./routes/brand.routes";
import categoryRouter from "./routes/category.routes";
import productRouter from "./routes/product.routes";

import cartRouter from "./routes/cart.routes";

import orderRouter from "./routes/order.routes";

import userRouter from "./routes/user.routes";
import addressRouter from "./routes/address.routes";

const app = express.Router();

app.use("/", indexRouter);

app.use("/banner", bannerRouter);

/* Inventory */
app.use("/brand", brandRouter);
app.use("/category", categoryRouter);
app.use("/product", productRouter);

app.use("/cart", cartRouter);

app.use("/order", orderRouter);

app.use("/user", userRouter);
app.use("/address", addressRouter);

export default app;
