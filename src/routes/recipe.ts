import express from "express";
import { check, body, param, validationResult } from "express-validator";

const router = express.Router();

import {
  getAllRecipes,
  addRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  addIngredientToRecipe,
  getRecipeIngredients,
} from "../db/recipe";

router.get("/", (_req: express.Request, res: express.Response) => {
  // register /recipes route
  getAllRecipes().then(
    // execute function from db/recipe.ts
    (recipes) => {
      // if successful
      res.json(recipes); // return recipes
    },
    (err) => {
      // if error
      console.log(err); // log error
      res.status(400).json(err); // send error to api consumer
    }
  );
});

router.get(
  "/:uuid",
  param("uuid").isUUID(),
  (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log(req.query);
    if (req.query.withIngredients === "true") {
      getRecipeIngredients(req.params.uuid).then(
        (recipe) => {
          res.json(recipe);
        },
        (err) => {
          console.log(err);
          res.status(400).json(err);
        }
      );
    } else {
      getRecipeById(req.params.uuid)
        .then((recipe) => {
          res.json(recipe);
        })
        .catch((err) => {
          if (err.message === "Recipe not found") {
            res.status(404).json(err);
          } else {
            res.status(400).json(err);
          }
        });
    }
  }
);

router.post(
  "/",
  body("name").exists({ checkFalsy: true }).isString(),
  (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    addRecipe(req.body)
      .then((recipe) => {
        res.status(201).json(recipe);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  }
);

router.put(
  "/:uuid",
  param("uuid").isUUID(),
  body("name").exists({ checkFalsy: true }).isString(),
  (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    updateRecipe(req.body, req.params.uuid)
      .then((recipe) => {
        res.json(recipe);
      })
      .catch((err) => {
        if (err.message === "Recipe not found") {
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

    deleteRecipe(req.params.uuid)
      .then((success) => {
        res.json({ success });
      })
      .catch((err) => {
        if (err.message === "Recipe not found") {
          res.status(404).json(err);
        } else {
          res.status(400).json(err);
        }
      });
  }
);

export default router;
