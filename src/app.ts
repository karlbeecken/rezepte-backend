import express from "express";

import recipeRouter from "./routes/recipe";
import ingredientRouter from "./routes/ingredient";

const app = express(); // create new express app
app.use(express.json()); // enable json body parser

app.use("/recipes?", recipeRouter); // mount recipe router
app.use("/ingredients?", ingredientRouter); // mount ingredient router

// ensure that in test mode we don't listen to the port
if (process.env.NODE_ENV !== "test") {
  // start app! 🎉
  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port 3000");
  });
}

module.exports = app;
