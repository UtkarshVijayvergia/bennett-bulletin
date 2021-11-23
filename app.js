const express = require('express');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const bodyParser = require('body-parser');
const users = require('./config/data').userDB; 

const server = http.createServer(app);
// passport config 
require('./config/passport')(passport);



// DB Config
const db = require('./config/keys').MongoURI;


// Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

// User model
const user = require('./models/user');
const { post } = require('got');
const posts = require('./models/amaan_posts');
// const passport = require('./config/passport');



// Public
app.use( express.static('public'));
// Specific folder example
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/images'))


// Bodyparser
app.use(express.urlencoded({ extended: false }));



// express middleware for session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));



// connect passport middleware 
app.use(passport.initialize());
app.use(passport.session());



// connect flash middleware
app.use(flash()); 




// global vars middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});
 



// Set View's

app.set('views', './views');
app.set('view engine', 'ejs');



// Routes
app.get( '/login', ( req, res ) => {
    res.render('login');
    // console.log(123);


// for authentication......below signup route
    // app.post('/login', (req, res, next) => {
    //     passport.authenticate('local', {
    //         successRedirect: '/dashboard',
    //         failureRedirect: '/dashboard',
    //         failureFlash: true
    //     })(req, res, next);
    // });
    app.post('/login', async (req, res) => {
        console.log(req.body)
        try{
            let foundUser = users.find((data) => req.body.Bennett_email_id === data.Bennett_email_id);
            if (foundUser) {
        
                let submittedPass = req.body.Password; 
                let storedPass = foundUser.Password; 
                console.log("reached here")
                const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
                if (passwordMatch) {
                    let usrname = foundUser.Username;
                    // res.send(`<div align ='center'><h2>login successful</h2></div><br><br><br><div align ='center'><h3>Hello ${usrname}</h3></div><br><br><div align='center'><a href='./login.html'>logout</a></div>`);
                    res.redirect('/proto-type-dashoard');
                    console.log('success') 
                } else {
                    // res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
                    req.flash('error_msg','wrong email or password')
                    res.redirect('/login');
                    console.log('fail')
                }
            } 
            else {
        
                // let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
                // await bcrypt.compare(req.body.Password, fakePass);
                req.flash('error_msg','wrong email or password')
                res.redirect('/login');
                
            }
        } catch{
            
            res.redirect('/login');
            req.flash('error_msg','wrong email or password')
        }
    });

});
 


 

app.get( '/sign_up', ( req, res ) => {
    res.render('sign_up');
    app.post('/sign_up', (req, res) => {
        const{ First_Name, Last_Name, Username, Bennett_email_id, Password, Confirm_Paassword } = req.body;
        
        let errors = [];
        //checking req fields
        if(!First_Name || !Last_Name || !Username || !Bennett_email_id || !Password || !Confirm_Paassword) {
            errors.push({msg: 'Please fill in all the fields'});
        }

        //checking passwords match
        if(Password !== Confirm_Paassword){
            errors.push({msg: 'Passwords do not match'});
        }
 
        //checking password length
        if(Password.length < 6){
            errors.push({msg: 'Passwords should be more than 5 characters'});
        }
 
        // sending errors
        if(errors.length > 0){
            res.render('sign_up', {
                errors,
                First_Name,
                Last_Name,
                Username, 
                Bennett_email_id,
                Password,
                Confirm_Paassword
            }); 
        }
        else{ 
            // Validation passed
            user.findOne({Bennett_email_id: Bennett_email_id})
                .then(User => {
                    if(User){
                        //user exists
                        errors.push({msg: 'Email is already registered'})
                        res.render('sign_up', {
                            errors,
                            First_Name,
                            Last_Name,
                            Username, 
                            Bennett_email_id,
                            Password,
                            Confirm_Paassword
                        });   
                    }
                    else{
                        const newuser = new user({
                            First_Name,
                            Last_Name,
                            Username,
                            Bennett_email_id,
                            Password,
                            Confirm_Paassword
                        });
                        users.push(newuser);
                        // Hash password
                        bcrypt.genSalt(10, (err, salt) => 
                            bcrypt.hash(newuser.Password, salt, (err, hash) => {
                                if(err) throw err;
                                // set password to hash
                                newuser.Password = hash;
                                newuser.Confirm_Paassword = hash;
                                // save user
                                
                                console.log(newuser)
                                newuser.save()
                                    .then(User => {
                                        req.flash('success_msg', 'You are now registered and can log in');
                                        res.redirect('/login');
                                    }) 
                                    .catch(err => console.log(err));
                        }))
                    }
                });
        }
    }) 
});


app.get( '/proto-type-dashoard', ( req, res ) => {
    res.render('homepage');
});


// app.get( '/proto-type-dashboard', ( req, res ) => {
//     res.render('testfile');
// });







// login a authentication
// app.post('/login', (req, res, next) => {
//     passport.authenticate('local', {
//         successRedirect: '/dashboard',
//         failureRedirect: '/login',
//         failureFlash: true
//     })(req, res, next);
// });



app.get( '/add_post', ( req, res ) => {
    res.render('post');
    // console.log(req.body)
    
    app.post('/post', (req, res) => { 
        console.log("reached1")
        const{ Title, Content } = req.body;
        console.log(req.body)
        console.log("reached")
        const newpost = new posts({
            Title,
            Content
        });
        // console.log(newpost)
        newpost.save()
        console.log('hello')
        res.redirect('/proto-type-dashoard');
        console.log('hello2')
    }); 
});
  








const port = process.env.PORT || 3000;

app.listen(port, console.log(`Server started on port ${port}$`));