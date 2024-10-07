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
import { authorizeJwt } from "middlewares/auth.middleware";

const app = express.Router();

app.use("/", indexRouter);

app.use("/banner", authorizeJwt, bannerRouter);

/* Inventory */
app.use("/brand", authorizeJwt, brandRouter);
app.use("/category", authorizeJwt, categoryRouter);
app.use("/product", authorizeJwt, productRouter);

app.use("/cart", authorizeJwt, cartRouter);

app.use("/order", authorizeJwt, orderRouter);

app.use("/user", userRouter);
app.use("/address", authorizeJwt, addressRouter);

export default app;
