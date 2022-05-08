import express from "express";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

import {
  getAllIngredients,
  getIngredientById,
  addIngredient,
  updateIngredient,
  deleteIngredient,
} from "../db/ingredient";

router.get("/", (_req: express.Request, res: express.Response) => {
  getAllIngredients()
    .then((ingredients) => {
      res.json(ingredients);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.get(
  "/:uuid",
  param("uuid").isUUID(),
  (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    getIngredientById(req.params.uuid)
      .then((ingredient) => {
        res.json(ingredient);
      })
      .catch((err) => {
        if (err.message === "Ingredient not found") {
          res.status(404).json(err);
        } else {
          res.status(400).json(err);
        }
      });
  }
);

router.post(
  "/",
  body("name").exists({ checkFalsy: true }).isString(),
  body("price").optional().isNumeric(),
  (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    addIngredient(req.body)
      .then((ingredient) => {
        res.status(201).json(ingredient);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  }
);

router.put(
  "/:uuid",
  param("uuid").isUUID(),
  body("name").optional().isString().notEmpty(),
  body("price").optional().isNumeric(),
  (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.name === undefined && req.body.price === undefined) {
      return res.status(400).json({
        errors: [
          {
            msg: "You must provide either a name or a price",
          },
        ],
      });
    }

    updateIngredient(req.body, req.params.uuid)
      .then((ingredient) => {
        res.json(ingredient);
      })
      .catch((err) => {
        if (err.message === "Ingredient not found") {
          res.status(404).json(err);
        } else {
          res.status(400).json(err);
        }
      });
  }
);

router.delete(
  "/:uuid",
  param("uuid").isUUID(),
  (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    deleteIngredient(req.params.uuid)
      .then((success) => {
        res.json({ success });
      })
      .catch((err) => {
        if (err.message === "Ingredient not found") {
          res.status(404).json(err);
        } else {
          res.status(400).json(err);
        }
      });
  }
);

export default router;
