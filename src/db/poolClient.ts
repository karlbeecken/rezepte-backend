const dotenv = require("dotenv");
import { Pool } from "pg";

dotenv.config();

const pool = new Pool();

const query = (text, values) => {
  return pool.query(text, values);
};

module.exports.query = query;
