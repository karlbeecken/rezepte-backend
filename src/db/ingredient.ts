import dotenv from "dotenv";

dotenv.config();

const client = require("../db/poolClient");

const getAllIngredients = () => {
  return new Promise((resolve, reject) => {
    client.query("SELECT * FROM ingredient", (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res.rows);
    });
  });
};

const getIngredientById = (uuid) => {
  return new Promise((resolve, reject) => {
    client
      .query("SELECT * FROM ingredient WHERE uuid = $1", [uuid])
      .then((res, err) => {
        if (err) {
          reject(err);
        } else {
          if (res.rows.length > 0) {
            resolve(res.rows[0]);
          } else {
            reject(new Error("Ingredient not found"));
          }
        }
      });
  });
};

const addIngredient = (ingredient) => {
  return new Promise(async (resolve, reject) => {
    if (!ingredient.price) {
      client
        .query("INSERT INTO ingredient (name) VALUES ($1) RETURNING *", [
          ingredient.name,
        ])
        .then((res, err) => {
          if (err) {
            reject(err);
          } else {
            resolve(res.rows[0]);
          }
        });
    } else {
      client
        .query(
          "INSERT INTO ingredient (name, price) VALUES ($1, $2) RETURNING *",
          [ingredient.name, ingredient.price]
        )
        .then((res, err) => {
          if (err) {
            reject(err);
          }
          resolve(res.rows[0]);
        });
    }
  });
};

const updateIngredient = async (ingredient, uuid) => {
  return new Promise(async (resolve, reject) => {
    if (!ingredient.price) {
      client
        .query(
          "UPDATE ingredient SET name = $1, last_modified = NOW() WHERE uuid = $2 RETURNING *",
          [ingredient.name, uuid]
        )
        .then((res, err) => {
          if (err) {
            reject(err);
          } else {
            if (res.rows.length > 0) {
              resolve(res.rows[0]);
            } else {
              reject(new Error("Ingredient not found"));
            }
          }
        });
    } else {
      client
        .query(
          "UPDATE ingredient SET name = $1, price = $2, last_modified = NOW() WHERE uuid = $3 RETURNING *",
          [ingredient.name, ingredient.price, uuid]
        )
        .then((res, err) => {
          if (err) {
            reject(err);
          } else {
            if (res.rows.length > 0) {
              resolve(res.rows[0]);
            } else {
              reject(new Error("Ingredient not found"));
            }
          }
        });
    }
  });
};

const deleteIngredient = async (uuid) => {
  return new Promise(async (resolve, reject) => {
    client
      .query("DELETE FROM ingredient WHERE uuid = $1 RETURNING *", [uuid])
      .then((res, err) => {
        if (err) {
          reject(err);
        }
        if (res.rows.length > 0) {
          resolve(true);
        } else {
          reject(new Error("Ingredient not found"));
        }
      });
  });
};

export {
  getAllIngredients,
  getIngredientById,
  addIngredient,
  updateIngredient,
  deleteIngredient,
};
