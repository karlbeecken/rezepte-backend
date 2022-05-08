import express from "express";

import recipeRouter from "./routes/recipe";
import ingredientRouter from "./routes/ingredient";

const app = express();
app.use(express.json());

app.use("/recipes?", recipeRouter);
app.use("/ingredients?", ingredientRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port 3000");
  });
}

module.exports = app;
