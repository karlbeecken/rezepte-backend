import express from "express";

import recipeRouter from "./routes/recipe";

const app = express();
app.use(express.json());

app.use("/recipes?", recipeRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port 3000");
  });
}

module.exports = app;
