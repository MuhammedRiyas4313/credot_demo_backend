import path from "path";
import fs from "fs";

export function createFolders() {
  try {
    let publicpath = path.join(process.cwd(), "public");
    let publicCheck = fs.existsSync(publicpath);
    if (!publicCheck) {
      fs.mkdirSync(publicpath);
    }

    let path1 = path.join(process.cwd(), "public", "uploads");
    let f1 = fs.existsSync(path1);
    if (!f1) {
      fs.mkdirSync(path1);
    }
  } catch (error) {
    console.error(error, "<<createFolders ERROR");
  }
}
