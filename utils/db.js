const mongoose = require('mongoose');

const url = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;

const dbUrl = process.env.ENVIRONMENT == 'DEV' ? process.env.MONGO_URI : url;

// const atlasURL = 'mongodb+srv://ajay123:ajay123@transactions-puvlf.mongodb.net/loomLog?retryWrites=true&w=majority';

// const atlasURL = 'mongodb+srv://ajay:ajay@cluster0.sli3e.mongodb.net/loomLog?retryWrites=true&w=majority';

const atlasURL = 'mongodb+srv://ajay:ajay@cluster0.sli3e.mongodb.net/loomLog?retryWrites=true&w=majority';

const connectDB = () => {
    console.log(dbUrl);
    mongoose
        .connect(atlasURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => console.log("db connected"))
        .catch((err) => console.log(err));
}

module.exports = connectDB;