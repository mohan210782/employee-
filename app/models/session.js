var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sessionScheme = new Schema({ 
	email: String, 
	created_at: { type: Date, default: Date.now } 
});

sessionScheme.plugin(require('mongoose-audit'));

// set up a mongoose model
module.exports = mongoose.model('Session',sessionScheme );