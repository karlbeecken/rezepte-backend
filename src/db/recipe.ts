import dotenv from "dotenv";
import { getIngredientById } from "./ingredient";

dotenv.config();

const client = require("../db/poolClient");

interface Recipe {
  uuid: string;
  name: string;
  created: Date;
  last_modified: Date;
  ingredients?: Array<Object>;
  total_cost?: number;
}

interface Ingredient {
  uuid: string;
  name: string;
  price?: number;
  created: Date;
  last_modified: Date;
}

/**
 * Gets all recipes from the database
 *@returns {Promise<Array>} - Returns an array of recipes
 */
const getAllRecipes = () => {
  return new Promise((resolve, reject) => {
    // new Promise is returned to router
    client
      .query("SELECT * FROM recipe") // query all recipes from database
      .then((res, err) => {
        // once query is complete
        if (err) {
          // if there is an error
          reject(err); // reject the error
        } else {
          // if there is no error
          resolve(res.rows); // resolve the promise with an array of recipes
        }
      })
      .catch((err) => {
        // if there is an error
        reject(err); // reject the error
      });
  });
};

/**
 * Gets a specific recipe by its uuid
 * @param {string} uuid - The uuid of the recipe
 * @returns {Promise<object>} - Returns the recipe
 */

const getRecipeById = (uuid) => {
  return new Promise((resolve, reject) => {
    client
      .query("SELECT * FROM recipe WHERE uuid = $1", [uuid]) // query from database, filter by uuid
      .then((res, err) => {
        if (err) {
          reject(err);
        } else {
          if (res.rows.length > 0) {
            resolve(res.rows[0]);
          } else {
            reject(new Error("Recipe not found"));
          }
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Creates a new recipe in the database
 * @param {object} recipe - The recipe to be added
 * @param {string} recipe.name - The name of the recipe
 * @returns {object} - Returns the newly created recipe
 */

const addRecipe = (recipe) => {
  return new Promise(async (resolve, reject) => {
    client
      .query("INSERT INTO recipe (name) VALUES ($1) RETURNING *", [recipe.name]) // query to insert recipe into database
      .then((res, err) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.rows[0]);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Modify a recipe
 * @param {object} recipe - The modified recipe
 * @param {string} uuid - The uuid of the recipe
 * @returns {Promise<object>} - Returns the modified recipe
 */

const updateRecipe = async (recipe, uuid) => {
  return new Promise(async (resolve, reject) => {
    client
      .query(
        "UPDATE recipe SET name = $1, last_modified = NOW() WHERE uuid = $2 RETURNING *",
        [recipe.name, uuid]
      ) // query to update recipe in database, set last modified to now and select by uuid
      .then((res, err) => {
        if (err) {
          reject(err);
        } else {
          if (res.rows.length > 0) {
            resolve(res.rows[0]);
          } else {
            reject(new Error("Recipe not found"));
          }
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const deleteRecipe = async (uuid) => {
  return new Promise(async (resolve, reject) => {
    client
      .query("DELETE FROM recipe WHERE uuid = $1 RETURNING *", [uuid]) // query to delete recipe from database, filter by uuid
      .then((res, err) => {
        if (err) {
          reject(err);
        }
        if (res.rows.length > 0) {
          resolve(true);
        } else {
          reject(new Error("Recipe not found"));
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

// functionality not yet fully implemented, please disregard
/**
 * Adds an ingredient to a recipe
 * @param ingredient UUID of the ingredient
 * @param recipe UUID of the recipe
 * @param amount Amount of the ingredient
 * @returns {Promise<object>} Returns the modified recipe
 */
const addIngredientToRecipe = async (ingredient, recipe, amount) => {
  return new Promise(async (resolve, reject) => {
    if (!amount) {
      client
        .query(
          "INSERT INTO recipe_ingredient (recipe, ingredient) VALUES ($1, $2) RETURNING *",
          [recipe, ingredient]
        )
        .then((res, err) => {
          if (err) {
            reject(err);
          } else {
            resolve(res.rows[0]);
          }
        })
        .catch((err) => {
          reject(err);
        });
    } else {
      client
        .query(
          "INSERT INTO recipe_ingredient (recipe, ingredient, amount) VALUES ($1, $2, $3) RETURNING *",
          [recipe, ingredient, amount]
        )
        .then((res, err) => {
          if (err) {
            reject(err);
          }
          resolve(res.rows[0]);
        })
        .catch((err) => {
          reject(err);
        });
    }
  });
};

const getRecipeIngredients = async (uuid) => {
  return new Promise(async (resolve, reject) => {
    getRecipeById(uuid).then(
      (recipe: Recipe) => {
        recipe.ingredients = [];
        client
          .query("SELECT * FROM recipe_ingredient WHERE recipe = $1", [uuid])
          .then((res, err) => {
            if (err) {
              reject(err);
            } else if (res.rows.length === 0) {
              resolve(recipe);
            } else {
              res.rows.forEach((el, i) => {
                getIngredientById(el.ingredient).then(
                  (ingredient) => {
                    console.log(ingredient);
                    recipe.ingredients.push(ingredient);
                    if (i === res.rows.length - 1) {
                      let total_cost = 0;
                      recipe.ingredients.forEach((el: Ingredient) => {
                        if (el.price) total_cost += el.price;
                      });
                      recipe.total_cost = total_cost;
                      resolve(recipe);
                    }
                  },
                  (err) => {
                    reject(err);
                  }
                );
              });
            }
          })
          .catch((err) => {
            reject(err);
          });
      },
      (err) => {
        reject(err);
      }
    );
  });
};

export {
  getAllRecipes,
  addRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  addIngredientToRecipe,
  getRecipeIngredients,
};
