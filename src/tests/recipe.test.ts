import request from "supertest";
import Pool from "pg-pool";
const client = require("../db/poolClient");

describe("Recipe route", function () {
  let app;
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

    // It's important to import the app after mocking the database connection
    app = require("../app");
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

  describe("GET /recipes", function () {
    it("Should return a list of recipes", async function () {
      const response = await request(app).get("/recipes");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          uuid: expect.any(String),
          name: "sample recipe 1",
          created: expect.any(String),
          last_modified: expect.any(String),
        },
      ]);
    });
  });

  describe("GET /recipe/:uuid", function () {
    it("Should return the specified recipe", async function () {
      const response = await request(app).get(`/recipe/${uuid}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        uuid,
        name: "sample recipe 1",
        created: expect.any(String),
        last_modified: expect.any(String),
      });
    });

    it("Should return a 404 if the recipe does not exist", async function () {
      const response = await request(app).get(
        "/recipes/cd386d13-0773-4759-b0e8-779444791fa4"
      );
      expect(response.status).toBe(404);
    });
  });

  describe("POST /recipe", function () {
    it("Should create a new recipe", async function () {
      const req = {
        name: "rezept1",
      };
      await postRecipe(req);

      const { rows } = await client.query(
        "SELECT name FROM recipe WHERE name = $1",
        [req.name]
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual(req);
    });

    it("Should fail if request is missing required params", async function () {
      await postRecipe({}, 400);
    });

    async function postRecipe(req, status = 200) {
      const { body } = await request(app)
        .post("/recipe")
        .send(req)
        .expect(status);
      return body;
    }
  });

  describe("PUT /recipe/:uuid", function () {
    it("Should update the specified recipe", async function () {
      const req = {
        name: "cool sample recipe",
      };
      await putRecipe(uuid, req);

      const { rows } = await client.query(
        "SELECT name FROM recipe WHERE uuid = $1",
        [uuid]
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual(req);
    });

    it("Should return a 404 if the recipe does not exist", async function () {
      await putRecipe(
        "cd386d13-0773-4759-b0e8-779444791fa4",
        { name: "cool sample recipe" },
        404
      );
    });

    it("Should fail if request is missing required params", async function () {
      await putRecipe(uuid, {}, 400);
    });

    async function putRecipe(uuid, req, status = 200) {
      const { body } = await request(app)
        .put(`/recipe/${uuid}`)
        .send(req)
        .expect(status);
      return body;
    }
  });

  describe("DELETE /recipe/:uuid", function () {
    it("Should delete the specified recipe", async function () {
      await deleteRecipe(uuid);

      const { rows } = await client.query(
        "SELECT uuid FROM recipe WHERE uuid = $1",
        [uuid]
      );
      expect(rows).toHaveLength(0);
    });

    it("Should return a 404 if the recipe does not exist", async function () {
      await deleteRecipe("cd386d13-0773-4759-b0e8-779444791fa4", 404);
    });

    async function deleteRecipe(uuid, status = 200) {
      await request(app).delete(`/recipe/${uuid}`).expect(status);
    }
  });
});
