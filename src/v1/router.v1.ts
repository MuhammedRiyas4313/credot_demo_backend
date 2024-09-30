import express from 'express';


/* Routes */

import indexRouter from "./routes/index.routes"

const app = express.Router();

app.use("/", indexRouter)

export default app;