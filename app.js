var express = require('express')
  , app = express.createServer()
  , _ = require('underscore')
  , mongo = require('mongodb')
  , connect = require('connect')
  , validator = require('validator')
  , mailer = require('mailer')
  , config = require('./config.js')

// Express config
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.cookieParser());
//var RedisStore = require('connect-redis')(express);
//app.use(express.session({secret: "some key", store: new RedisStore}));
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(connect.compress());

// App

/* Homepage */
app.get('/', function(req, res) {
  res.render('index', {

  });
});

/* New signup */
app.post('/signup', function(req, res) {
  var email = req.body.email;
  var tz = req.body.tz;

  // check email
  try {
    validator.check(email).isEmail();
  }
  catch(ex) {
    res.send({success: false, msg: 'Invalid email.'});
    return;
  }

  // send to mongo
  mongo.connect(process.env.MONGOHQ_URL || "mongodb://localhost:27017", function(err, conn) {
    if (err) {
      res.send({success: false, msg: 'Could not connect to database.'});
      return;
    }
    conn.collection('people', function(err, collection) {
      if (err) {
        res.send({success: false, msg: 'Could not connect to database collection.'});
        return;
      }

      collection.update({email:email}, {email:email, tz:tz}, {upsert:true}, function(err) {
        if (err) {
          res.send({success: false, msg: 'Could not update database.'});
          return;
        }
        res.send({success: true});
      });
    }); // end mongo collection
  }); // end mongo connection


});

app.post('/parse', function(req, res) {
  var to = req.body.to;
  var text = req.body.text;

  console.log('Got email from', to);

  var id = to.slice(0, to.indexOf('@'));

  // send to mongo
  mongo.connect(process.env.MONGOHQ_URL || "mongodb://localhost:27017", function(err, conn) {
    if (err) {
      return;
    }
    conn.collection('dreams', function(err, collection) {
      if (err) {
        return;
      }

      collection.insert({unique:id, text:text, time:new Date().getTime()}, function(err) {
        console.log('Recorded dream', id);
      });
    }); // end mongo collection
  }); // end mongo connection


  // debug
  /*
  mailer.send({
      host : "smtp.sendgrid.net",
      port : "587",
      domain : "keepdream.me",
      to : 'typppo@gmail.com',
      from : 'test@keepdream.me',
      subject: 'got a posted email',
      body: to + '\r\n\r\n' + text,
      authentication : "login",
      username : config.sendgrid.user,
      password : config.sendgrid.key,
    },
    function(err, result){
      if(err){
        console.log(err, result);
      }
  });
  */

  res.send('');
});


var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log('Listening on', port);

});
