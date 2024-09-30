import { adminSeeder } from "./adminSeeder";
import { createFolders } from "./folderSeeder";

export const seedData = () => {
  adminSeeder();
  createFolders();
};
