import { Request, Response, NextFunction } from "express";
import { TierRepository } from "../repositories/tierRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";

// Get all public tiers
export const getPublicTiersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = await TierRepository.listPublic();

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Tiers retrieved successfully",
        data: tiers,
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get all tiers (admin only)
export const getAllTiersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = await TierRepository.list();

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "All tiers retrieved successfully",
        data: tiers,
      }),
    );
  } catch (error) {
    next(error);
  }
};