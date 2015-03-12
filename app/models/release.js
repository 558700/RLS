var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var Release = new Schema({
    isHosted: Boolean
    , URL: String
    // Content?
    , title: String
    , datePublished: Date
    , dateCreated: Date
    // , dateEdited: Date
    // , createdBy: String //ObjectID?

});

Release.plugin(passportLocalMongoose);

module.exports = mongoose.model('Release', Release);
