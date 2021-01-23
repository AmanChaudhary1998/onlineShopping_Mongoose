const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (cb)=>{
    MongoClient.connect('mongodb+srv://aman001:aman28@mycluster.o3hq5.mongodb.net/shop?retryWrites=true&w=majority')
    .then((client)=>{
        console.log('Connected to database successfully');
        _db = client.db();
        cb();
    })
    .catch((err) =>{
        console.log(err);
        throw err;
});
};

const getDB = () =>{
    if(_db)
    {
        return _db;
    }
    throw "No database found";
}

exports.mongoConnect = mongoConnect;
exports.getDB = getDB;