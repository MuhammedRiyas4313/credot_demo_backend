import { ROLES } from "common/constant.common";
import { encryptPassword } from "utils/bcrypt";
import { User } from "models/user.model";

export const adminSeeder = async () => {
  try {
    const encryptedPassword = await encryptPassword("admin@1234");
    const adminExist = await User.findOne({ role: ROLES.ADMIN }).exec();

    if (adminExist) {
      return "Admin already exists";
    }
    await new User({
      name: "Admin",
      email: "admin@admin.com",
      password: encryptedPassword,
      role: ROLES.ADMIN,
    }).save();
  } catch (error) {
    console.error(error);
  }
};
