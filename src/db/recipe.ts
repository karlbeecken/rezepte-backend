import dotenv from "dotenv";

dotenv.config();

const client = require("../db/poolClient");

const getAllRecipes = () => {
  return new Promise((resolve, reject) => {
    client.query("SELECT * FROM recipe", (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.rows);
      }
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
      });
  });
};

const updateRecipe = async (recipe, uuid) => {
  return new Promise(async (resolve, reject) => {
    client
      .query("UPDATE recipe SET name = $1 WHERE uuid = $2 RETURNING *", [
        recipe.name,
        uuid,
      ])
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
      });
  });
};

export { getAllRecipes, addRecipe, getRecipeById, updateRecipe, deleteRecipe };
