import { createJiti } from "jiti";
//#region src/filesystem/virtual/loadConfigFile.ts
async function loadConfigFile(filePath) {
	return await createJiti(filePath, { interopDefault: false }).import(filePath);
}
//#endregion
export { loadConfigFile };

//# sourceMappingURL=loadConfigFile.js.map