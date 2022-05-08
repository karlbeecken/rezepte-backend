import request from "supertest";
import Pool from "pg-pool";
const client = require("../db/poolClient");

describe("Ingredient route", function () {
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

  describe("GET /ingredients", function () {
    it("Should return a list of ingredients", async function () {
      const response = await request(app).get("/ingredients");
      expect(response.status).toBe(200); // 200 OK
      expect(response.body).toEqual([
        {
          uuid,
          name: "sample ingredient 1",
          created: expect.any(String),
          price: 1.99,
          last_modified: expect.any(String),
        },
      ]);
    });
  });

  describe("GET /ingredient/:uuid", function () {
    it("Should return an ingredient", async function () {
      const response = await request(app).get(`/ingredient/${uuid}`);
      expect(response.status).toBe(200); // 200 OK

      expect(response.body).toEqual({
        uuid,
        name: "sample ingredient 1",
        price: 1.99,
        last_modified: expect.any(String),
        created: expect.any(String),
      });
    });
  });

  describe("POST /ingredient", function () {
    it("Should create an ingredient with a price", async function () {
      const response = await request(app).post("/ingredient").send({
        name: "sample ingredient 2",
        price: 2.99,
      });
      expect(response.status).toBe(201); // 201 Created
      expect(response.body).toEqual({
        uuid: expect.any(String),
        name: "sample ingredient 2",
        price: 2.99,
        created: expect.any(String),
        last_modified: expect.any(String),
      });
    });

    it("Should create an ingredient without a price", async function () {
      const response = await request(app).post("/ingredient").send({
        name: "sample ingredient 3",
      });
      expect(response.status).toBe(201); // 201 Created
      expect(response.body).toEqual({
        uuid: expect.any(String),
        name: "sample ingredient 3",
        price: null,
        created: expect.any(String),
        last_modified: expect.any(String),
      });
    });

    it("Should return an error when creating an ingredient with an invalid price", async function () {
      const response = await request(app).post("/ingredient").send({
        name: "sample ingredient 4",
        price: "invalid",
      });
      expect(response.status).toBe(400); // 400 Bad Request
      expect(response.body).toEqual({
        errors: [
          {
            location: "body",
            msg: "Invalid value",
            param: "price",
            value: "invalid",
          },
        ],
      });
    });

    it("Should return an error when creating an ingredient with an invalid name", async function () {
      const response = await request(app).post("/ingredient").send({
        name: "",
        price: 2.99,
      });
      expect(response.status).toBe(400); // 400 Bad Request
      expect(response.body).toEqual({
        errors: [
          {
            location: "body",
            msg: "Invalid value",
            param: "name",
            value: "",
          },
        ],
      });
    });

    it("Should return an error when creating an ingredient without a name", async function () {
      const response = await request(app).post("/ingredient").send({});
      expect(response.status).toBe(400); // 400 Bad Request
      expect(response.body).toEqual({
        errors: [
          { msg: "Invalid value", location: "body", param: "name" },
          { msg: "Invalid value", location: "body", param: "name" },
        ],
      });
    });
  });

  describe("PUT /ingredient/:uuid", function () {
    it("Should update an ingredient with a price", async function () {
      const req = {
        name: "sample ingredient 1 updated",
        price: 2.99,
      };
      const response = await request(app).put(`/ingredient/${uuid}`).send(req);
      expect(response.status).toBe(200); // 200 OK
      expect(response.body).toEqual({
        uuid,
        name: "sample ingredient 1 updated",
        price: 2.99,
        created: expect.any(String),
        last_modified: expect.any(String),
      });
      expect(response.body.last_modified).not.toBe(response.body.created);

      const { rows } = await client.query(
        "SELECT * FROM ingredient WHERE uuid = $1",
        [uuid]
      );

      expect(rows[0]).toEqual({
        uuid,
        name: req.name,
        price: 2.99,
        created: expect.any(Date),
        last_modified: expect.any(Date),
      });
      expect(rows[0].last_modified).not.toEqual(rows[0].created);
    });

    it("Should update an ingredient without a price", async function () {
      const response = await request(app).put(`/ingredient/${uuid}`).send({
        name: "sample ingredient 1 updated",
      });
      expect(response.status).toBe(200); // 200 OK
      expect(response.body).toEqual({
        uuid,
        name: "sample ingredient 1 updated",
        price: 1.99,
        created: expect.any(String),
        last_modified: expect.any(String),
      });

      const { rows } = await client.query(
        "SELECT * FROM ingredient WHERE uuid = $1",
        [uuid]
      );

      expect(rows[0]).toEqual({
        uuid,
        name: "sample ingredient 1 updated",
        price: 1.99,
        created: expect.any(Date),
        last_modified: expect.any(Date),
      });
      expect(rows[0].last_modified).not.toEqual(rows[0].created);
    });

    it("Should return an error when updating an ingredient with an invalid price", async function () {
      const response = await request(app).put(`/ingredient/${uuid}`).send({
        name: "sample ingredient 1 updated",
        price: "invalid",
      });
      expect(response.status).toBe(400); // 400 Bad Request
      expect(response.body).toEqual({
        errors: [
          {
            location: "body",
            msg: "Invalid value",
            param: "price",
            value: "invalid",
          },
        ],
      });
    });

    it("Should return an error when updating an ingredient with an invalid name", async function () {
      const response = await request(app).put(`/ingredient/${uuid}`).send({
        name: "",
        price: 2.99,
      });
      expect(response.status).toBe(400); // 400 Bad Request
      expect(response.body).toEqual({
        errors: [
          {
            location: "body",
            msg: "Invalid value",
            param: "name",
            value: "",
          },
        ],
      });
    });

    it("Should return an error when updating an ingredient without any content", async function () {
      const response = await request(app).put(`/ingredient/${uuid}`).send({});
      expect(response.status).toBe(400); // 400 Bad Request
      expect(response.body).toEqual({
        errors: [{ msg: "You must provide either a name or a price" }],
      });
    });

    it("Should return an error when updating an ingredient with an invalid uuid", async function () {
      const response = await request(app).put(`/ingredient/invalid`).send({
        name: "sample ingredient 1 updated",
        price: 2.99,
      });
      expect(response.status).toBe(400); // 400 Bad Request
      expect(response.body).toEqual({
        errors: [
          {
            location: "params",
            msg: "Invalid value",
            param: "uuid",
            value: "invalid",
          },
        ],
      });
    });
  });

  describe("DELETE /ingredient/:uuid", function () {
    it("Should delete an ingredient", async function () {
      const response = await request(app).delete(`/ingredient/${uuid}`);
      expect(response.status).toBe(200); // 200 OK
      expect(response.body).toEqual({ success: true });

      const { rows } = await client.query(
        "SELECT * FROM ingredient WHERE uuid = $1",
        [uuid]
      );

      expect(rows).toEqual([]);
    });

    it("Should return an error when deleting an ingredient with an invalid uuid", async function () {
      const response = await request(app).delete(`/ingredient/invalid`);
      expect(response.status).toBe(400); // 400 Bad Request
      expect(response.body).toEqual({
        errors: [
          {
            location: "params",
            msg: "Invalid value",
            param: "uuid",
            value: "invalid",
          },
        ],
      });
    });

    it("Should return an error when deleting an ingredient that does not exist", async function () {
      const response = await request(app).delete(
        `/ingredient/fe5f8b87-9c61-4679-b8c7-e046fc7a7ec4`
      );
      expect(response.status).toBe(404); // 404 Not Found
    });
  });
});
