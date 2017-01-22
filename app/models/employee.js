var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var EmployeSchema = new Schema({ 
	name: String, 
	email: String,
	password: String, 
	department: String,
	admin: Boolean,
	status: String,
	last_login: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
  	created_at: { type: Date, default: Date.now } 
});
EmployeSchema.plugin(require('mongoose-audit'));
// set up a mongoose model
module.exports = mongoose.model('Employee',EmployeSchema );

