const fs = require("fs");
const {execSync} = require("child_process");
require("dotenv").config();






    console.log("ā” Hold on, We are installing all packages");
  execSync("npm i --dev");
	execSync("npm run build");


	console.log("š We're getting you set up.\n");
	console.log("āļø Building latest code... \n");


  execSync("npm i --dev");
        console.log("\nā¤ļø Almost... done..\n");
	execSync("npm run build");
	console.log("ā Done!");





	console.log("š Using production setup...\n");

	console.log("If you're running this during development, the game won't work\n");
	console.log("š„ Creating a production build...");
  execSync("npm i --dev");
	execSync("npm run prod");
	console.log("ā Done!\n");
console.log ("Run npm start in order to start server")