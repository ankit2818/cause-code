const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

/** Load Post and Profile Models */
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");

/** Load Post Validation */
const validatePostInput = require("../../validation/post");

/**
 * @route       GET /api/posts/test
 * @description Tests posts route
 * @access      Public
 */
router.get("/test", (req, res) => res.json({ msg: "Posts works" }));

/**
 * @route       GET /api/posts
 * @description Get posts
 * @access      Public
 */
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err =>
      res.status(404).json({ noPostsFound: "No Posts found with that ID" })
    );
});

/**
 * @route       GET /api/posts/:id
 * @description Get posts by id
 * @access      Public
 */
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ noPostFound: "No Post found with that ID" })
    );
});

/**
 * @route       POST /api/posts
 * @description Create post
 * @access      Private
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    /** Check Validations */
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

/**
 * @route       DELETE /api/posts/:id
 * @description Delete post
 * @access      Private
 */
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          /** Check for post owner */
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notAuthorized: "User not authorized" });
          }
          Post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postNotFound: "No Post Found" }));
    });
  }
);

module.exports = router;
