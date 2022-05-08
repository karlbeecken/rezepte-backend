import Pool from "pg-pool";
const client = require("../db/poolClient");

import {
  getAllIngredients,
  getIngredientById,
  addIngredient,
  updateIngredient,
  deleteIngredient,
} from "./ingredient";

interface Ingredient {
  uuid: string;
  name: string;
  price?: number;
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
      "CREATE TEMPORARY TABLE ingredient (LIKE ingredient INCLUDING ALL)"
    ); // This will copy constraints also
  });

  beforeEach(async function () {
    const res = await client.query(
      "INSERT INTO pg_temp.ingredient (name, price) VALUES ('sample ingredient 1', '1.99') RETURNING *"
    );
    uuid = res.rows[0].uuid;
  });

  afterEach(async function () {
    await client.query("DROP TABLE IF EXISTS pg_temp.ingredient");
  });

  describe("Get all ingredients", function () {
    it("Should return a list of ingredients", function () {
      expect.assertions(1);
      getAllIngredients().then((ingredients) => {
        expect(ingredients).toEqual([
          {
            uuid,
            name: "sample ingredient 1",
            created: expect.any(Date),
            last_modified: expect.any(Date),
            price: 1.99,
          },
        ]);
      });
    });
  });

  describe("Get ingredient by id", function () {
    it("Should return an ingredient", function () {
      expect.assertions(1);
      getIngredientById(uuid).then((ingredient) => {
        expect(ingredient).toEqual({
          uuid,
          name: "sample ingredient 1",
          created: expect.any(Date),
          last_modified: expect.any(Date),
          price: 1.99,
        });
      });
    });

    it("Should return not found error if ingredient does not exist", function () {
      expect.assertions(1);
      getIngredientById("8747b108-7a70-4511-b599-7f9cb2c3fdff").catch((err) => {
        expect(err).toEqual(new Error("Ingredient not found"));
      });
    });

    it("Should return invalid uuid error if uuid is not valid", function () {
      expect.assertions(1);
      getIngredientById("not-a-uuid").catch((err) => {
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "not-a-uuid"')
        );
      });
    });

    it("Should return invalid uuid error if uuid is not a string", function () {
      expect.assertions(1);
      getIngredientById(123).catch((err) => {
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "123"')
        );
      });
    });
  });

  describe("Add ingredient", function () {
    it("Should add an ingredient", function () {
      expect.assertions(1);
      addIngredient({ name: "sample ingredient 2", price: 2.99 }).then(
        (ingredient) => {
          expect(ingredient).toEqual({
            uuid: expect.any(String),
            name: "sample ingredient 2",
            created: expect.any(Date),
            last_modified: expect.any(Date),
            price: 2.99,
          });
        }
      );
    });

    it("Should return not-null error if name field is undefined", function () {
      expect.assertions(1);
      addIngredient({ yeet: "sample ingredient 2" }).catch((err) => {
        expect(err).toEqual(
          new Error(
            'null value in column "name" of relation "ingredient" violates not-null constraint'
          )
        );
      });
    });

    it("Should return not-null error if name field is null", function () {
      expect.assertions(1);
      addIngredient({ name: null }).catch((err) => {
        expect(err).toEqual(
          new Error(
            'null value in column "name" of relation "ingredient" violates not-null constraint'
          )
        );
      });
    });

    it("Should return not-empty error if name field is empty", function () {
      expect.assertions(1);
      addIngredient({ name: "" }).catch((err) => {
        expect(err).toEqual(
          new Error(
            'new row for relation "ingredient" violates check constraint "ingredient_name_check"'
          )
        );
      });
    });
  });

  describe("Update ingredient", function () {
    it("Should update an ingredient", function () {
      expect.assertions(2);
      updateIngredient(
        {
          name: "sample ingredient updated",
          price: 4.99,
        },
        uuid
      ).then((ingredient: Ingredient) => {
        expect(ingredient).toEqual({
          uuid,
          name: "sample ingredient updated",
          created: expect.any(Date),
          last_modified: expect.any(Date),
          price: 4.99,
        });

        expect(ingredient.last_modified).not.toEqual(ingredient.created);
      });
    });

    it("Should return not found error if ingredient does not exist", function () {
      expect.assertions(1);
      updateIngredient(
        {
          name: "sample ingredient updated",
          price: 4.99,
        },
        "8747b108-7a70-4511-b599-7f9cb2c3fdff"
      ).catch((err) => {
        expect(err).toEqual(new Error("Ingredient not found"));
      });
    });

    it("Should return invalid uuid error if uuid is not valid", async function () {
      expect.assertions(1);
      updateIngredient(
        {
          name: "sample ingredient updated",
          price: 4.99,
        },
        "not-a-uuid"
      ).catch((err) => {
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "not-a-uuid"')
        );
      });
    });

    it("Should return invalid uuid error if uuid is not a string", function () {
      expect.assertions(1);
      updateIngredient(
        {
          name: "sample ingredient updated",
          price: 4.99,
        },
        123
      ).catch((err) => {
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "123"')
        );
      });
    });

    it("Should return not-null error if name field is undefined", function () {
      expect.assertions(1);
      updateIngredient(
        {
          yeet: "sample ingredient updated",
          price: 4.99,
        },
        uuid
      ).catch((err) => {
        expect(err).toEqual(
          new Error(
            'null value in column "name" of relation "ingredient" violates not-null constraint'
          )
        );
      });
    });

    it("Should return not-null error if name field is null", function () {
      expect.assertions(1);
      updateIngredient(
        {
          name: null,
          price: 4.99,
        },
        uuid
      ).catch((err) => {
        expect(err).toEqual(
          new Error(
            'null value in column "name" of relation "ingredient" violates not-null constraint'
          )
        );
      });
    });

    it("Should return not-empty error if name field is empty", function () {
      expect.assertions(1);
      updateIngredient(
        {
          name: "",
          price: 4.99,
        },
        uuid
      ).catch((err) => {
        expect(err).toEqual(
          new Error(
            'new row for relation "ingredient" violates check constraint "ingredient_name_check"'
          )
        );
      });
    });
  });

  describe("Delete ingredient", function () {
    it("Should delete an ingredient", function () {
      expect.assertions(1);
      deleteIngredient(uuid).then((res) => {
        expect(res).toBe(true);
        getIngredientById(uuid).catch((err) => {
          expect(err).toEqual(new Error("Ingredient not found"));
        });
      });
    });

    it("Should return not found error if ingredient does not exist", function () {
      expect.assertions(2);
      deleteIngredient("8747b108-7a70-4511-b599-7f9cb2c3fdff").catch((err) => {
        expect(err).toEqual(new Error("Ingredient not found"));
      });
    });

    it("Should return invalid uuid error if uuid is not valid", function () {
      expect.assertions(1);
      deleteIngredient("not-a-uuid").catch((err) => {
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "not-a-uuid"')
        );
      });
    });

    it("Should return invalid uuid error if uuid is not a string", function () {
      expect.assertions(1);
      deleteIngredient(123).catch((err) => {
        expect(err).toEqual(
          new Error('invalid input syntax for type uuid: "123"')
        );
      });
    });
  });
});
