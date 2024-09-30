import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);

  if (err.status && typeof err.status == "number") {
    res.status(err.status).json({ status: err.status, message: err.message, error: err });
    return;
  }

  res.status(500).json({ message: err.message, err: err });
  return;
};
