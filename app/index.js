var express = require('express')
	, mongoose = require('mongoose')
	, passport = require('passport')
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')
	, session = require('cookie-session')
	, async = require('async')
	, hbs = require('hbs')
	, app = express()
	, port = process.env.PORT || 4000
	, LocalStrategy = require('passport-local').Strategy;

app.set('views', __dirname + '/views')
app.set('view options', { layout:'layout.html' })
app.set('view engine', 'html')
app.engine('html', hbs.__express)
app.use(express.static(__dirname + '/public'))
hbs.registerPartials(__dirname + '/views/partials')
hbs.localsAsTemplateData(app);
// app.use(bodyParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ keys: ['secretkey1', 'secretkey2', '...']}));
app.use(passport.initialize());
app.use(passport.session());
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());
mongoose.connect('mongodb://localhost/rls');
app.use(function(req, res, next){
    res.locals.session = req.session
    res.locals.user = req.user
    res.locals.query = req.query
    res.locals.xxx = 'hello'
    next()
});

// HBS Helpers
var fs = require('fs')
var moment = require('moment')

hbs.registerHelper('JSON', function(context) {
	return JSON.stringify(context)
});

hbs.registerHelper('moment', function(context, options) {
	format = options.hash.format || 'DD/MM/YYYY'

	if (context === 'now') {
		return moment().format(format)
	} else {
		return moment(context).format(format)
	}
})

hbs.registerHelper('component', function(component, options) {
	var componentPath = __dirname + '/views/partials/blocks/'+ component +'.html'
		, template = hbs.compile(fs.readFileSync(componentPath, 'utf8'))
		, content = new hbs.handlebars.SafeString(options.fn(this))

	return new hbs.handlebars.SafeString(template({
		content: content
		, args: options.hash
		// , data: options.data.root
	}))
})

// ROUTES

app.get('/', function (req, res) {
	async.parallel([
		function(callback){
			Release.find( function ( err, releases, count ){
				callback(null, releases)
			})
		},
		function(callback){
			Account.find( function ( err, accounts, count ){
				callback(null, accounts)
			})
		}
	],
	function(err, results){
		res.render('index',{
			releases: results[0]
			, accounts: results[1]
		})
	});
})

app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/register', function(req, res, next) {
  Account.register(new Account({ email: req.body.username, organisation: req.body.userOrg }), req.body.password, function(err) {
  // Account.register(new Account({ username: req.body.username, organisation: req.body.userOrg }), req.body.password, function(err) {
    if (err) { console.log('error while user register!', err); return next(err); }

    console.log('user registered!');

    // res.redirect('/');
	    passport.authenticate('local')(req, res, function () {
			res.redirect('/');
		});
  });
});

app.get('/login', function(req, res) {
	console.log('login page')
	res.render('login');
});

app.post('/login', passport.authenticate('local'), function(req, res) {
	console.log('xx')
	res.redirect('/');
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/clear', function(req, res) {
	Account.find({}).remove().exec()
	res.redirect('/');
});
//
//
//
//
//

var Release = require('./models/release');

app.route('/newtest')
	.get(function(req, res, next) {
		new Release({
			isHosted : true
			, URL: 'http://google.com'
			, title: 'Release title'
			, datePublished: Date.now()
			, dateCreated: Date.now()
			, dateEdited: Date.now()
		}).save( function( err, release, count ){
			res.redirect( '/' );
		});
	})


app.route('/releases')
	.get(function(req, res, next) {
		Release.find( function ( err, releases, count ){
			res.render('releases/all', {
				releases: releases
			})
		})
	})

app.route('/submit')
	// .all(function(req, res, next) {
	// })
	.get(function(req, res, next) {
		res.render('releases/new')
	})
	.post(function(req, res, next) {
		res.json(req.body)
		// res.redirect( '/' );
	})

app.route('/account')
	.get(function(req, res, next) {
		res.render('account/index')
	})
	.post(function(req, res, next) {
		Account.findByIdAndUpdate(req.user._id, {
			// Logs you out if you change email?
			email: req.body.userEmail
			, organisation: req.body.userOrg
			, address: {
				lineOne: req.body.addrLineOne
				, lineTwo: req.body.addrLineTwo
				, city: req.body.addrCity
				, postcode: req.body.addrPost
				, country: req.body.addrCountry
			}
		},function(){
			res.redirect('/account')
		})
	})



var server = app.listen(port, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
})
