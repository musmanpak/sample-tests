import { Request, Response } from 'express';
import * as HttpStatus from 'http-status-codes';
import { Id } from 'objection';
import { Bag, Cuboid } from '../models';

export const list = async (req: Request, res: Response): Promise<Response> => {
  const ids = req.query.ids as Id[];
  const cuboids = await Cuboid.query().findByIds(ids).withGraphFetched('bag');

  return res.status(200).json(cuboids);
};

export const get = async (req: Request, res: Response): Promise<Response> => {
  const id: Id = req.params.id;
  const cuboid = await Cuboid.query().findById(id);

  if (!cuboid) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  return res.status(200).json(cuboid);
};

export const update = async (req: Request, res: Response): Promise<any> => {
  const id: Id = req.params.id;
  const cuboid = await Cuboid.query().findById(id).withGraphFetched('bag');

  if (!cuboid) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  const { newWidth, newHeight, newDepth } = req.body;
  cuboid.width = newWidth;
  cuboid.height = newHeight;
  cuboid.depth = newDepth;

  return res.status(HttpStatus.OK).json(cuboid);
};

export const create = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { width, height, depth, bagId } = req.body;

  const bagData = await Bag.query().findById(bagId).withGraphFetched('cuboids');

  // eslint-disable-next-line fp/no-let
  let occupiedVolume = width * height * depth;

  if (bagData && bagData.cuboids) {
    bagData.cuboids.forEach((c) => {
      occupiedVolume += c.width * c.height * c.depth;
    });

    if (bagData.volume >= occupiedVolume) {
      const cuboid = await Cuboid.query().insert({
        width,
        height,
        depth,
        bagId,
      });

      return res.status(HttpStatus.CREATED).json(cuboid);
    } else {
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: 'Insufficient capacity in bag' });
    }
  }
  return res.sendStatus(HttpStatus.NOT_FOUND);
};
