import express from "express";

/* Routes */
import indexRouter from "./routes/index.routes";

import addressRouter from "./routes/address.routes";
import brandRouter from "./routes/brand.routes";
import cartRouter from "./routes/cart.routes";
import categoryRouter from "./routes/category.routes";
import orderRouter from "./routes/order.routes";
import productRouter from "./routes/product.routes";
import userRouter from "./routes/user.routes";

const app = express.Router();

app.use("/address", addressRouter);
app.use("/brand", brandRouter);
app.use("/cart", cartRouter);
app.use("/category", categoryRouter);
app.use("/order", orderRouter);
app.use("/product", productRouter);
app.use("/user", userRouter);
app.use("/", indexRouter);

export default app;
