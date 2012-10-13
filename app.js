var query = require("./queries"),
    express = require("express"),
    app = express();


app.listen(9000);
console.log("listening on default port 9000");

query.getShapes("51B");
