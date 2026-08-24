import express from "express";
import cors from "cors";
import authRouter from "./src/authentication";
import boardRouter from "./src/board";
import organizationRouter from "./src/organization";
import orgMemberRouter from "./src/orgMember";
import sectionRouter from "./src/section";
import issueRouter from "./src/issue";
import commentRouter from "./src/comment";
import { errorHandler } from "./helper/errorHandler";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(authRouter);
app.use(boardRouter);
app.use(organizationRouter);
app.use(orgMemberRouter);
app.use(sectionRouter);
app.use(issueRouter);
app.use(commentRouter);

app.use(errorHandler);

app.listen(3000, () => {
  console.log("running on port 3000");
});
