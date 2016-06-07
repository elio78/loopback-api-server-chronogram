var http = require('http'),
httpProxy = require('http-proxy');
//----------------------Ajouts Elio
var passport = require('passport');
var cookieParser = require('cookie-parser');
var session = require('express-session');
//----------------------Ajouts Elio----Fin
var app=express();

// Create a proxy server with custom application logic
var proxy = httpProxy.createProxyServer({});
proxy.on('error', function (err, req, res) {
	  res.writeHead(500, {
	    'Content-Type': 'text/plain'
	  });
	  res.end(err);
	}); 

// If "-pm" is at the end of the app/domain name, or PM_URL matches the route,
// proxy to the Process Manager. Otherwise, proxy to the application itself
//----------------------Ajouts Elio
var server = http.createServer(function(req, res) {
	if (req.headers.host.indexOf('-pm.') != -1){
		proxy.web(req, res, { target: 'http://127.0.0.1:8701' });
	}
	// specify something like myapp-pm.mybluemix.net
	else if (req.headers.host.indexOf(process.env.PM_URL) != -1){
		proxy.web(req, res, { target: 'http://127.0.0.1:8701' });
	}
	else
	{
		proxy.web(req, res, { target: 'http://127.0.0.1:3001' });
	}
});

app.use(cookieParser());
app.use(session({resave: 'true', saveUninitialized: 'true' , secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session()); passport.serializeUser(function(user, done) {
   done(null, user);
}); 

app.deserializeUser(function(obj, done) {
   done(null, obj);
});         
// VCAP_SERVICES contient toutes les données d'identification des services liés à
// cette application. Pour des détails sur son contenu, voir
// le document ou l'exemple associé à chaque service.  
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
var ssoConfig = services.SingleSignOn[0]; 
var client_id = ssoConfig.credentials.clientId;
var client_secret = ssoConfig.credentials.secret;
var authorization_url = ssoConfig.credentials.authorizationEndpointUrl;
var token_url = ssoConfig.credentials.tokenEndpointUrl;
var issuer_id = ssoConfig.credentials.issuerIdentifier;
var callback_url = "https://chronogram-auth-gy4dv0atyx-cj10.iam.ibmcloud.com";        

var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;
var Strategy = new OpenIDConnectStrategy({
                 authorizationURL : authorization_url,
                 tokenURL : token_url,
                 clientID : client_id,
                 scope: 'openid',
                 response_type: 'code',
                 clientSecret : client_secret,
                 callbackURL : callback_url,
                 skipUserProfile: true,
                 issuer: issuer_id}, 
	function(iss, sub, profile, accessToken, refreshToken, params, done)  {
	         	process.nextTick(function() {
		profile.accessToken = accessToken;
		profile.refreshToken = refreshToken;
		done(null, profile);
         	})
}); 

passport.use(Strategy); 
serverapp.get('/login', passport.authenticate('openidconnect', {})); 
          
function ensureAuthenticated(req, res, next) {
	if(!req.isAuthenticated()) {
	          	req.session.originalUrl = req.originalUrl;
		res.redirect('/login');
	} else {
		return next();
	}
}
//----------------------Ajouts Elio----Fin

console.log("listening on port " + process.env.PORT)
server.listen(process.env.PORT);
