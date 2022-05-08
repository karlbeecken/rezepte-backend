import Pool from "pg-pool";
const client = require("../db/poolClient");

import {
  getAllRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
} from "../db/recipe";

interface Recipe {
  uuid: string;
  name: string;
  created: Date;
  last_modified: Date;
}

describe("Ingredient route", function () {
  let uuid;
  let pool;

  beforeAll(async function () {
    process.env.NODE_ENV = "test";
    // Create a new pool with a connection limit of 1
    pool = new Pool({
      database: "recipes",
      user: "postgres",
      password: "changeme",
      port: 5432,
      max: 1, // Reuse the connection to make sure we always hit the same temporal schema
      idleTimeoutMillis: 0, // Disable auto-disconnection of idle clients to make sure we always hit the same temporal schema
    });

    // Mock the query function to always return a connection from the pool we just created
    client.query = (text, values) => {
      return pool.query(text, values);
    };
  });

  afterAll(async function () {
    await pool.end();
  });

  beforeEach(async function () {
    await client.query(
      "CREATE TEMPORARY TABLE recipe (LIKE recipe INCLUDING ALL)"
    ); // This will copy constraints also
  });

  beforeEach(async function () {
    const res = await client.query(
      "INSERT INTO pg_temp.recipe (name) VALUES ('sample recipe 1') RETURNING *"
    );
    uuid = res.rows[0].uuid;
  });

  afterEach(async function () {
    await client.query("DROP TABLE IF EXISTS pg_temp.recipe");
  });

  describe("Get all recipes", function () {
    it("Should return all recipes", function () {
      expect.assertions(2);
      getAllRecipes().then((res) => {
        expect(res).toBeDefined();
        expect(res).toEqual([
          {
            uuid,
            name: "sample recipe 1",
            created: expect.any(Date),
            last_modified: expect.any(Date),
          },
        ]);
      });
    });
  });

  describe("Get recipe by id", function () {
    it("Should return a recipe", function () {
      expect.assertions(2);
      getRecipeById(uuid).then((res) => {
        expect(res).toBeDefined();
        expect(res).toEqual({
          uuid,
          name: "sample recipe 1",
          created: expect.any(Date),
          last_modified: expect.any(Date),
        });
      });
    });

    it("Should return a not found error if recipe does not exist", function () {
      expect.assertions(2);
      getRecipeById("8747b108-7a70-4511-b599-7f9cb2c3fdff").catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(new Error("Recipe not found"));
      });
    });

    it("Should return invalid uuid error if uuid is not valid", function () {
      expect.assertions(2);
      getRecipeById("not-a-uuid").catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "not-a-uuid"')
        );
      });
    });

    it("Should return invalid uuid error if uuid is not a string", function () {
      expect.assertions(2);
      getRecipeById(123).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "123"')
        );
      });
    });
  });

  describe("Add recipe", function () {
    it("Should add a recipe", function () {
      expect.assertions(2);
      addRecipe({ name: "sample recipe 2" }).then((res) => {
        expect(res).toBeDefined();
        expect(res).toEqual({
          uuid: expect.any(String),
          name: "sample recipe 2",
          created: expect.any(Date),
          last_modified: expect.any(Date),
        });
      });
    });

    it("Should return not-null error if name field is undefined", function () {
      expect.assertions(2);
      addRecipe({ yeet: "lol" }).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error(
            'null value in column "name" of relation "recipe" violates not-null constraint'
          )
        );
      });
    });

    it("Should return not-null error if name field is null", function () {
      expect.assertions(2);
      addRecipe({ name: null }).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error(
            'null value in column "name" of relation "recipe" violates not-null constraint'
          )
        );
      });
    });

    it("Should return not-empty error if name field is empty", function () {
      expect.assertions(2);
      addRecipe({ name: "" }).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error(
            'new row for relation "recipe" violates check constraint "recipe_name_check"'
          )
        );
      });
    });
  });

  describe("Update recipe", function () {
    it("Should update a recipe", function () {
      expect.assertions(3);
      updateRecipe({ name: "sample recipe updated" }, uuid).then(
        (res: Recipe) => {
          expect(res).toBeDefined();
          expect(res).toEqual({
            uuid,
            name: "sample recipe updated",
            created: expect.any(Date),
            last_modified: expect.any(Date),
          });

          expect(res.last_modified).not.toBe(res.created);
        }
      );
    });

    it("Should return not-null error if name field is undefined", function () {
      expect.assertions(2);
      updateRecipe({ yeet: "lol" }, uuid).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error(
            'null value in column "name" of relation "recipe" violates not-null constraint'
          )
        );
      });
    });

    it("Should return not-null error if name field is null", function () {
      expect.assertions(2);
      updateRecipe({ name: null }, uuid).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error(
            'null value in column "name" of relation "recipe" violates not-null constraint'
          )
        );
      });
    });

    it("Should return not-empty error if name field is empty", function () {
      expect.assertions(2);
      updateRecipe({ name: "" }, uuid).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error(
            'new row for relation "recipe" violates check constraint "recipe_name_check"'
          )
        );
      });
    });

    it("Should return not-found error if recipe does not exist", function () {
      expect.assertions(2);
      updateRecipe(
        { name: "sample recipe updated" },
        "8747b108-7a70-4511-b599-7f9cb2c3fdff"
      ).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(new Error("Recipe not found"));
      });
    });

    it("Should return invalid uuid error if uuid is not valid", function () {
      expect.assertions(2);
      updateRecipe({ name: "sample recipe updated" }, "not-a-uuid").catch(
        (err) => {
          expect(err).toBeDefined();
          expect(err).toEqual(
            new Error('invalid input syntax for type uuid: "not-a-uuid"')
          );
        }
      );
    });

    it("Should return invalid uuid error if uuid is not a string", function () {
      expect.assertions(2);
      updateRecipe({ name: "sample recipe updated" }, 123).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "123"')
        );
      });
    });
  });

  describe("Delete recipe", function () {
    it("Should delete a recipe", function () {
      expect.assertions(2);
      deleteRecipe(uuid).then((res) => {
        expect(res).toBeDefined();
        expect(res).toEqual(true);
      });
    });

    it("Should return not-found error if recipe does not exist", function () {
      expect.assertions(2);
      deleteRecipe("8747b108-7a70-4511-b599-7f9cb2c3fdff").catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(new Error("Recipe not found"));
      });
    });

    it("Should return invalid uuid error if uuid is not valid", function () {
      expect.assertions(2);
      deleteRecipe("not-a-uuid").catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "not-a-uuid"')
        );
      });
    });

    it("Should return invalid uuid error if uuid is not a string", function () {
      expect.assertions(2);
      deleteRecipe(123).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "123"')
        );
      });
    });

    it("Should return recipe not found error if uuid is undefined", function () {
      expect.assertions(2);
      deleteRecipe(undefined).catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(new Error("Recipe not found"));
      });
    });
  });
});
