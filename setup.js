const fs = require("fs");
const {execSync} = require("child_process"); 
require("dotenv").config();






    console.log("⚡ Hold on, We are installing all packages");
  execSync("npm i --dev");
	execSync("npm run build");


	console.log("👀 We're getting you set up.\n");
	console.log("⚒️ Building latest code... \n");


  execSync("npm i --dev");
        console.log("\n❤️ Almost... done..\n");
	execSync("npm run build");
	console.log("✅ Done!");





	console.log("🚀 Using production setup...\n");

	console.log("If you're running this during development, the game won't work\n");
	console.log("🔥 Creating a production build...");
  execSync("npm i --dev");
	execSync("npm run prod");
	console.log("✅ Done!\n");
console.log ("Run npm start in order to start server")
