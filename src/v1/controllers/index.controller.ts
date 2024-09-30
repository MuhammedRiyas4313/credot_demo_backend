import { NextFunction, Request, Response } from "express";

export const testController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).send("Hellow world")
    } catch (error) {
        next(error);
    }
}