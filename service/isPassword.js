const {
  obj_error,
  obj_sign,
  obj_regexp,
} = require(`../store.js`);

module.exports = (
  password,
  allowCyrillic,
  allowError,
) => {
  try {
    if (
      obj_regexp.reg_passLatin.test(password) ||
      allowCyrillic && obj_regexp.reg_passLatinCyril(password)
    ) {
      return true;
    }

    throw obj_error.str_password;
  } catch (error) {
    const str_error = (
      error?.message ||
      error?.toString() ||
      obj_sign.str_empty
    );
    
    if (allowError) {
      throw `${obj_error.str_catchService} [${str_error}]`;
    } else {
      return false;
    }
  }
}