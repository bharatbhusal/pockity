import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { NextFunction, Request, Response } from "express";

export const healthController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).send(
      new PockityBaseResponse({
        success: true,
        message: "Server is running!",
      }),
    );
  } catch (err: any) {
    next(err);
  }
};
