// routes/Group.route.ts
import express from "express";
import {
  AddUserGroupAdminOnly,
  createGroup,
  GetGroupMembers,
  getPublicGroups,
  getUserGroups,
  joinGroup,
  RemoveUserGroupOnlyAdmain,
} from "../controllers/Group.controller";

const router = express.Router();

router.post("/create", createGroup);
router.get("/public", getPublicGroups);
router.get("/user/:userId", getUserGroups);
router.post("/join", joinGroup);
router.post("/:groupId/members", AddUserGroupAdminOnly);
router.delete("/:groupId/members/:userId", RemoveUserGroupOnlyAdmain);
router.get("/:groupId/members", GetGroupMembers);
export default router;
