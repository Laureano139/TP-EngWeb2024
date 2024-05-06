var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var mongoose = require('mongoose')

var mongoDB = 'mongodb://127.0.0.1:27017/tpMapaRuasDeBraga'
mongoose.connect(mongoDB)
var db = mongoose.connection
db.on('error', console.error.bind(console, 'Erro de conexão ao MongoDB'))
db.once('open', () => {
  console.log("Conexão ao MongoDB realizada com sucesso")
})

var indexRouter = require('./routes/index');
var ucRouter = require('./routes/uc');
var equipaRouter = require('./routes/equipa');
var projetoRouter = require('./routes/projeto');
var entregaRouter = require('./routes/entrega');
var userRouter = require('./routes/user');

const { v4: uuidv4 } = require('uuid'); 
var session = require('express-session');
var FileStore = require('session-file-store')(session);

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var axios = require('axios')

// passport config
var User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  genid: req => {
    console.log("Dentro do Middleware da sessão...");
    console.log(req.sessionID);
    return uuidv4();
  },
  store: new FileStore(), // caso queiramos guardar os cookies localmente
  secret: "TPMapaRuasDeBragaEngWeb2024",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/uc', ucRouter);
app.use('/equipa', equipaRouter);
app.use('/projeto', projetoRouter);
app.use('/entrega', entregaRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
