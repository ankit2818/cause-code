const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

/** Load validation */
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

/** Load Profile and User Model */
const Profile = require("../../models/Profile");
const User = require("../../models/User");

/**
 * @route       GET /api/profile/test
 * @description Tests profile route
 * @access      Public
 */
router.get("/test", (req, res) => res.json({ msg: "Profile works" }));

/**
 * @route       GET /api/profile
 * @description Fetches current user's profile
 * @access      Private
 */
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noProfile = "Profile not found";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => {
        res.status(404).json(err);
      });
  }
);

/**
 * @route       GET /api/profile/all
 * @description Get all profile by handle
 * @access      Public
 */
router.get("/all", (req, res) => {
  const errors = {};
  Profile.find()
    .populate("user", ["name", "avatar"])
    .then(profiles => {
      if (!profiles) {
        errors.noProfile = "No profiles found";
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => res.status(404).json({ profile: "No profiles found" }));
});

/**
 * @route       GET /api/profile/handle/:handle
 * @description Get profile by handle
 * @access      Public
 */
router.get("/handle/:handle", (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noProfile = "No profile found";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

/**
 * @route       GET /api/profile/user/:userId
 * @description Get profile by userId
 * @access      Public
 */
router.get("/user/:userId", (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.userId })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noProfile = "No profile found";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json({ profile: "No profile found" }));
});

/**
 * @route       POST /api/profile
 * @description Create or Update user profile
 * @access      Private
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);
    /** Check validation */
    if (!isValid) {
      /** Return errors with 400 status */
      return res.status(400).json(errors);
    }

    /** Get field values */
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubUsername)
      profileFields.githubUsername = req.body.githubUsername;
    /** Skills - split into arrays */
    if (typeof req.body.skills !== "undefined") {
      profileFields.skills = req.body.skills.split(",");
    }
    /** Social fields */
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        /** Update Profile */
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true, useFindAndModify: false }
        ).then(profile => res.json(profile));
      } else {
        /** Create Profile */
        /** Check if handle exists */
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = "That handle already exists";
            res.status(400).json(errors);
          }

          /** Save Profile */
          new Profile(profileFields).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

/**
 * @route       POST /api/profile/experience
 * @description Add experience to profile
 * @access      Private
 */
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);
    /** Check validation */
    if (!isValid) {
      /** Return errors with 400 status */
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      /** Add to experience array */
      profile.experience.unshift(newExp);
      profile.save().then(profile => res.json(profile));
    });
  }
);

/**
 * @route       POST /api/profile/education
 * @description Add education to profile
 * @access      Private
 */
router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);
    /** Check validation */
    if (!isValid) {
      /** Return errors with 400 status */
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldOfStudy: req.body.fieldOfStudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      /** Add to experience array */
      profile.education.unshift(newEdu);
      profile.save().then(profile => res.json(profile));
    });
  }
);

/**
 * @route       DELETE /api/profile/experience/:expId
 * @description Delete education from profile
 * @access      Private
 */
router.delete(
  "/experience/:expId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        /** Get remove index */
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.expId);

        /** Splice out of array */
        profile.experience.splice(removeIndex, 1);

        /** Save */
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

/**
 * @route       DELETE /api/profile/education/:eduId
 * @description Delete education from profile
 * @access      Private
 */
router.delete(
  "/education/:eduId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        /** Get remove index */
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.eduId);

        /** Splice out of array */
        profile.education.splice(removeIndex, 1);

        /** Save */
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

/**
 * @route       DELETE /api/profile/
 * @description Delete user and profile
 * @access      Private
 */
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove(
      { user: req.user.id },
      { useFindAndModify: false }
    ).then(() => {
      User.findOneAndRemove(
        { _id: req.user.id },
        { useFindAndModify: false }
      ).then(() => res.json({ success: true }));
    });
  }
);

module.exports = router;
