const express = require("express");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");
const router = express.Router();

/** Load input validation */
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

/** Load User Model */
const User = require("../../models/User");

/**
 * @route       GET /api/users/test
 * @description Tests users route
 * @access      Public
 */
router.get("/test", (req, res) => res.json({ msg: "Users works" }));

/**
 * @route       GET /api/users/register
 * @description Register a user
 * @access      Public
 */
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  /** Check Validation */
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = "Email already exists";
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", // size
        r: "pg", // rating
        d: "mm" // default image
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => {
              res.json(user);
            })
            .catch(err => console.log(err));
        });
      });
    }
  });
});

/**
 * @route       GET /api/users/login
 * @description Login User / returning jwt web token
 * @access      Public
 */
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  /** Check Validation */
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  /** Find user by email */
  User.findOne({ email }).then(user => {
    /** Check for user */
    if (!user) {
      errors.email = "User not found";
      return res.status(404).json(errors);
    }
    /** Check password */
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        /** Payload */
        const payload = {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        };

        /**
         * User matched
         * Sign token
         */
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 24 * 60 * 60 },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        errors.password = "Password incorrect";
        return res.status(400).json(errors);
      }
    });
  });
});

/**
 * @route       GET /api/users/current
 * @description Return current user
 * @access      Private
 */
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);

module.exports = router;
