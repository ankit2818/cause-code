import axios from "axios";
import setAuthToken from "../utils/setAuthToken";
import jwt_decode from "jwt-decode";

import { GET_ERRORS, SET_CURRENT_USER } from "./types";

/** Register User */
export const registerUser = (userData, history) => dispatch => {
  axios
    .post("/api/users/register", userData)
    .then(res => history.push("/login"))
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    );
};

/** Login User - Get token */
export const loginUser = userData => dispatch => {
  axios
    .post("/api/users/login", userData)
    .then(res => {
      /** Save token to localStorage */
      const { token } = res.data;
      localStorage.setItem("jwtToken", token);

      /** Set token to auth Header */
      setAuthToken(token);

      /** Decode token to get user Data */
      const decoded = jwt_decode(token);

      /** Set current user */
      dispatch(setCurrentUser(decoded));
    })
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    );
};

/** Set logged in user */
export const setCurrentUser = decoded => {
  return {
    type: SET_CURRENT_USER,
    payload: decoded
  };
};

/** Logout user */
export const logoutUser = () => dispatch => {
  /** Remove the token from localStorage */
  localStorage.removeItem("jwtToken");

  /** Remove the auth header for future requests */
  setAuthToken(false);

  /** Set current user obejct to null which will set isAuthenticated to false */
  dispatch(setCurrentUser({}));
};
