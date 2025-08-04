// controllers/Group.controller.ts
import { Request, Response } from "express";
import Group from "../models/Group.model";
import { User } from "../models/user";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, isPublic } = req.body;
    const admin = req.body.admin; // Assuming userId is set from authentication middleware
    console.log(admin, "admin");
    const newGroup = new Group({
      name,
      admin,
      isPublic,
      members: [admin],
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPublicGroups = async (req: Request, res: Response) => {
  try {
    const groups = await Group.find({ isPublic: true });
    res.json(groups);
  } catch (error) {
    console.error("Error fetching public groups:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const groups = await Group.find({ members: userId });
    res.json(groups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const joinGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.body;
    const userId = req.body.userId; // From auth middleware

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    res.json({ message: "Joined group successfully" });
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const AddUserGroupAdminOnly = async (req: Request, res: Response) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.body.adminId) {
      return res.status(403).json({ error: "Only admin can add users" });
    }

    const userToAdd = await User.findById(req.body.userId);
    if (!userToAdd) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already in group
    if (group.members.includes(req.body.userId)) {
      return res.status(400).json({ error: "User already in group" });
    }

    group.members.push(req.body.userId);
    await group.save();

    // Add group to user's group list
    // userToAdd.groups.push(group._id);
    // await userToAdd.save();

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Remove user from group (admin only)
export const RemoveUserGroupOnlyAdmain = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(req.body.adminId, "admin id");

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    console.log(group.admin);

    // Check if user is admin
    if (group.admin !== req.body.adminId) {
      return res.status(403).json({ error: "Only admin can remove users" });
    }

    console.log(req.body.adminId, "admin id");

    // Cannot remove admin
    if (group.admin === req.params.userId) {
      return res.status(400).json({ error: "Cannot remove group admin" });
    }

    // Remove user from group
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== req.params.userId
    );
    await group.save();

    // Remove group from user's group list
    // const user = await User.findById(req.params.userId);
    // if (user) {
    //   user.groups = user.groups.filter(
    //     (groupId) => groupId.toString() !== req.params.groupId
    //   );
    // await user.save();
    // }

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get group members

export const GetGroupMembers = async (req: Request, res: Response) => {
  console.log("oj");
  try {
    const group = await Group.findById(req.params.groupId).populate("members");
    console.log(group, "ss");
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Only allow group members to see member list
    // if (!group.members.some((member) => member === req.params.id)) {
    //   return res.status(403).json({ error: "Not authorized" });
    // }
    console.log(group.members);

    return res.status(200).json(group.members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
