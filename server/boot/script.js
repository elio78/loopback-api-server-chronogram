module.exports = function(app) {
var customerdb = app.dataSources.db;

customerdb.automigrate('Customer', function(err) {
   if (err) throw (err);
   var Customer = app.models.Customer;

   Customer.create([
    {username: 'Admin', email: 'elio@canale-parola.eu', password: 'abcdef', id:'user01'},
    {username: 'elio', email: 'elio@canale-parola.eu', password: 'Ce1mdphs', id:'user02'}
  ], function(err, users) {
    if (err) return cb(err);
     var Role = app.models.Role;
    var RoleMapping = app.models.RoleMapping;

    //create the admin role
    Role.create({
      name: 'admin'
    }, function(err, role) {
      if (err) cb(err);
       //make admin
      role.principals.create({
        principalType: RoleMapping.USER,
        principalId: users[0].id
      }, function(err, principal) {
        if (err) throw (err);
      });
    });
  });
});
};
