import express from "express";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
const port = 5000;

//
dotenv.config();
app.use(cors());
app.use(express.json());

// routes

// test
app.get("/", (req, res) => {
  res.send("api nè ");
});

// run server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
