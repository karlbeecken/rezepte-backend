import dotenv from "dotenv";

dotenv.config();

const client = require("../db/poolClient");

const getAllRecipes = () => {
  return new Promise((resolve, reject) => {
    client
      .query("SELECT * FROM recipe")
      .then((res, err) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.rows);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const getRecipeById = (uuid) => {
  return new Promise((resolve, reject) => {
    client
      .query("SELECT * FROM recipe WHERE uuid = $1", [uuid])
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

const addRecipe = (recipe) => {
  return new Promise(async (resolve, reject) => {
    client
      .query("INSERT INTO recipe (name) VALUES ($1) RETURNING *", [recipe.name])
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

const updateRecipe = async (recipe, uuid) => {
  return new Promise(async (resolve, reject) => {
    client
      .query(
        "UPDATE recipe SET name = $1, last_modified = NOW() WHERE uuid = $2 RETURNING *",
        [recipe.name, uuid]
      )
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
      .query("DELETE FROM recipe WHERE uuid = $1 RETURNING *", [uuid])
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

export {
  getAllRecipes,
  addRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  addIngredientToRecipe,
};
