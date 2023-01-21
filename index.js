const express = require('express');
const {
    v4: uuidv4
} = require('uuid');
const path = require('path');
const bodyParser = require('body-parser');
const moment = require('moment');
const connection = require('./config/database.config');
const e = require('express');
var cookieParser = require('cookie-parser');
const {
    check,
    validationResult,
    body
} = require('express-validator');
const {
    performance
} = require('perf_hooks');
const dotenv = require('dotenv');
const multer = require('multer')

var imageStorage = multer.diskStorage({
    destination: "C:\\Users\\Lenovo\\Desktop\\fall 2022\\my-app\\public\\images",
    filename: (req, file, cb) => {
        cb(null, file.filename + '_' + Date.now() + path.extname(file.originalname))
    }


});




const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 1000000 // 1000000 Bytes = 1 MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|JPEG)$/)) {
            // upload only png and jpg format
            return cb(new Error('Please upload a Image'))
        }
        cb(undefined, true)
    }
})



const app = express();
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
const urlencodedParser = bodyParser.urlencoded({
    extended: false
})


app.get('/', (req, res) => {
res.render('welcome')
});




app.get('/signup', function(req, res) {

    let sql = `select * from user`
    connection.query(sql, (err, result) => {
        if (err) console.log(err);
        res.render('signup', {
            users: result,
            check: false
        });
    })
});

// For Single image upload

app.post('/signup', urlencodedParser, [
    check('email', 'email format is not valid').exists().isLength({
        min: 3
    }),
    check('username', 'this username is not valid').exists().isLength({
        min: 3
    }),
    check('tel', 'this number is not valid').exists().isLength({
        min: 8
    }),
    check('password', 'Password should be 5 characters long').exists().isLength({
        min: 5
    })

], (req, res) => {

    const {
        username,
        email,
        password,
        tel
    } = req.body;

    const errors = validationResult(req)
    let alert;
    if (!errors.isEmpty()) {

        alert = errors.array()
        res.render("signup", {
            alert,
            check: false
        });

    } else {

        let emailSQL = `SELECT email FROM user WHERE email="${email}"`;

        connection.query(emailSQL, (err, result) => {
            if (err) throw err;

            if (result.length == 0) {

                let insertSQL = `INSERT INTO user 
                (userName,email,password,tel)   VALUES
                ("${username}", "${email}","${password}",${tel})`;



                connection.query(insertSQL, (err, result) => {
                    if (err) throw err;

                })
                let IdSql = `SELECT * from user where email="${email}"`;
                connection.query(IdSql, (err, result) => {
                    if (err) throw err;

                    res.cookie('cookieName', result[0].userId);
                    //userId=result[0].userId;
                    res.redirect(`/registration?id=${result[0].userId}`);
                })

            } else {
                res.render("signup", {
                    check: true
                });

            }


        })

    }
});




app.get('/signin', function(req, res) {

    let sql = `select * from user`
    connection.query(sql, (err, result) => {
        if (err) console.log(err);
        res.render('signin', {
            users: result,
            fal: false
        });
    })
});




app.post('/signin', urlencodedParser, [
    check('email', 'email format is not valid').exists().isLength({
        min: 3
    }),
    check('password', 'Password should be 5 characters long').exists().isLength({
        min: 1
    })

], (req, res) => {
    const {
        email,
        password
    } = req.body;
    const errors = validationResult(req)
    let alert;
    if (!errors.isEmpty()) {

        alert = errors.array()
        res.render("signin", {
            alert,
            fal: false
        });

    } else {

        let emailSQL = `SELECT email,password FROM user WHERE email="${email}" AND password="${password}"`;

        connection.query(emailSQL, (err, result) => {
            if (err) throw err;

            if (result.length == 0) {
                res.render("signin", {
                    fal: true
                });
            } else {
                let IdSql = `SELECT * from user where email="${email}"`;
                connection.query(IdSql, (err, result) => {
                    if (err) throw err;


                    res.cookie('cookieName', result[0].userId);
                    // userId=result[0].userId;

                    res.redirect(`/home?id=${result[0].userId}`);
                })

            }


        })

    }

})




app.get('/registration', function(req, res) {

    let sql = `select * from user`
    connection.query(sql, (err, result) => {
        if (err) console.log(err);
        res.render('registration', {
            users: result,
            fal: false
        });
    })
});




app.post('/registration', imageUpload.single('image'), (req, res) => {
    const {
        major,
        instagram,
        age,
        inlineRadioOptions
    } = req.body;




    let profile = `images/${req.file?req.file.filename:"unp.png"}`;

    let insertSQL = `INSERT INTO register 
                (userId,status,instagram,major,age,profile)   VALUES
                ("${req.cookies.cookieName}", "${inlineRadioOptions}","${instagram}","${major}","${age}","${profile}" )`;



    connection.query(insertSQL, (err, result) => {
        if (err) throw err;

    })

    res.redirect(`/home?id=${req.cookies.cookieName}`);
}, (error, req, res, next) => {
    console.log({
        error: error.message
    });
    res.render("registration", {
        check: false,
        Invpic: true,
        mes: error.message
    })
})




app.get('/home', (req, res) => {


    const {
        id
    } = req.query;


    let sql = `select * from user where UserId = "${id}"`;
    let sql2 = `select * from register  where userId = "${id}"`;
    let sql3 = `select distinct interest from interests where userId="${id}"`
    connection.query(sql, (err, result) => {

        connection.query(sql2, (err, result2) => {
            connection.query(sql3, (err, result3) => {

                res.render('home', {
                    user: result[0],
                    info: result2[0],
                    interests: result3
                });


            })
        })



    })

});




app.get('/addInterest', function(req, res) {

    let sql = `select * from user`
    connection.query(sql, (err, result) => {
        if (err) console.log(err);
        res.render('addInterest', {
            users: result,
            id:req.cookies.cookieName
        });
    })
});


app.post('/addInterest', (req, res) => {
    const {
        interest
    } = req.body;
    let sql1 = `select * from user where userId=${req.cookies.cookieName}`
    let sql2 = `select * from register where userId=${req.cookies.cookieName}`




    connection.query(sql1, (err, result1) => {
        connection.query(sql2, (err, result2) => {

            let insertSQL = `INSERT INTO interests 
                        (userId,interest,userName,email,age,tel,major,profile,instagram)   VALUES
                        ("${req.cookies.cookieName}", "${interest}","${result1[0].userName}",
                        "${result1[0].email}",  "${result2[0].age}", "${result1[0].tel}", "${result2[0].major}"
                        , "${result2[0].profile}", "${result2[0].instagram}")`;



            connection.query(insertSQL, (err, result) => {
                if (err) throw err;

            })
        })
    })

    res.redirect(`/home?id=${req.cookies.cookieName}`);
})


app.post('/deleteInterest', (req, res) => {
    const {
        interest
    } = req.query;

    let sql1 = `delete from interests where userId=${req.cookies.cookieName} and interest="${interest}"`


    connection.query(sql1, (err, result) => {
        if (err) throw err;

    })
    res.redirect(`/home?id=${req.cookies.cookieName}`);
})




app.get('/commonUsers', (req, res) => {


    const {
        id
    } = req.query;


    let sql = `select distinct userName , profile,userId FROM interests where interest in (Select interest from interests where userId=${id});`;

    connection.query(sql, (err, result) => {

        res.render('common', {
            users: result,
            id: req.cookies.cookieName
        })


    })

});




app.get('/checkProfile', (req, res) => {


    const {
        id,
        Userid
    } = req.query;


    let sql = `select * from user where UserId = "${Userid}"`;
    let sql2 = `select * from register  where userId = "${Userid}"`;
    let sql3 = `select distinct interest from interests where userId="${Userid}"`
    let sql4 = `select * from follow where followedId = "${Userid}" AND userId = ${id} `;

    connection.query(sql, (err, result) => {

        connection.query(sql2, (err, result2) => {
            connection.query(sql3, (err, result3) => {
                connection.query(sql4, (err, result4) => {


                    if (result4.length == 0) {

                        res.render('checkProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: false,
                            id: req.cookies.cookieName
                        });

                    } else {

                        res.render('checkProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: true,
                            id: req.cookies.cookieName
                        });

                    }



                })
            })
        })



    })

});


app.post('/follow', (req, res) => {

    const {
        id
    } = req.query;
    let sql = `select userName from user where userId=${id}`;
    let sql2 = `select profile from register where userId=${id}`;
    let sql3 = `select userName from user where userId=${req.cookies.cookieName}`;
    let sql4 = `select profile from register where userId=${req.cookies.cookieName}`;

    connection.query(sql, (err, result1) => {
        connection.query(sql2, (err, result2) => {
            connection.query(sql3, (err, result3) => {
                connection.query(sql4, (err, result4) => {

                    let insertSQL = `INSERT INTO follow 
                                    (userId,followedId,followedName,followedProfile,name,profile)   VALUES
                                    ("${req.cookies.cookieName}", "${id}","${result1[0].userName}","${result2[0].profile}",
                                    "${result3[0].userName}","${result4[0].profile}")`;

                    connection.query(insertSQL, (err, result) => {
                        if (err) throw err;

                    })
                })
            })
        })
    })

    res.redirect(`/checkProfile?Userid=${id}&&id=${req.cookies.cookieName}`);
})




app.post('/unfollow', (req, res) => {

    const {
        id
    } = req.query;

    let insertSQL = `Delete from follow
                                       where 
                                       userId= "${req.cookies.cookieName}"and followedId= "${id}"`;

    connection.query(insertSQL, (err, result) => {
        if (err) throw err;


    })

    res.redirect(`/checkProfile?Userid=${id}&&id=${req.cookies.cookieName}`);
})




app.get('/checkFollowing', (req, res) => {
    let sql = `select * from follow where userId = "${req.cookies.cookieName}";`;
    connection.query(sql, (err, result) => {


        res.render('following', {
            following: result,
            id: req.cookies.cookieName
        });

    })
});


app.get('/checkFollowers', (req, res) => {
    let sql = `select * from follow where followedId = "${req.cookies.cookieName}";`;
    connection.query(sql, (err, result) => {

        res.render('followers', {
            following: result,
            id: req.cookies.cookieName
        });

    })
});




app.get('/checkFollowingProfile', (req, res) => {

    const {
        id,
        Userid
    } = req.query;

    let sql = `select * from user where UserId = "${Userid}"`;

    let sql2 = `select * from register  where userId = "${Userid}"`;
    let sql3 = `select distinct interest from interests where userId="${Userid}"`
    let sql4 = `select * from follow where followedId = "${Userid}" AND userId = ${id} `;
    connection.query(sql, (err, result) => {

        connection.query(sql2, (err, result2) => {
            connection.query(sql3, (err, result3) => {
                connection.query(sql4, (err, result4) => {

                    if (result4.length == 0) {

                        res.render('checkFollowingProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: false,
                            id: req.cookies.cookieName
                        });

                    } else {

                        res.render('checkFollowingProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: true,
                            id: req.cookies.cookieName
                        });

                    }



                })
            })
        })



    })

});



app.get('/checkFollowersProfile', (req, res) => {

    const {
        id,
        Userid
    } = req.query;

    let sql = `select * from user where UserId = "${Userid}"`;

    let sql2 = `select * from register  where userId = "${Userid}"`;
    let sql3 = `select distinct interest from interests where userId="${Userid}"`
    let sql4 = `select * from follow where followedId = "${Userid}" AND userId = ${id} `;
    connection.query(sql, (err, result) => {

        connection.query(sql2, (err, result2) => {
            connection.query(sql3, (err, result3) => {
                connection.query(sql4, (err, result4) => {

                    if (result4.length == 0) {

                        res.render('checkFollowersProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: false,
                            id: req.cookies.cookieName
                        });

                    } else {

                        res.render('checkFollowersProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: true,
                            id: req.cookies.cookieName
                        });

                    }



                })
            })
        })



    })

});




app.get('/viewOnline', (req, res) => {


    const {
        id
    } = req.query;


    let sql = `select distinct userName , register.profile , userId FROM user join tsc.register using (userId)  where available="Online"`;

    connection.query(sql, (err, result) => {

        res.render('online', {
            users: result,
            id: req.cookies.cookieName
        })


    })

});




app.post('/set', (req, res) => {

    const {
        inlineRadioOptions
    } = req.body;
    let updateSQL = `UPDATE user Set
                available="${inlineRadioOptions}"
                Where userId="${req.cookies.cookieName}" `

    connection.query(updateSQL, (err, result) => {
        if (err) throw err;


    })

    res.redirect(`/home?id=${req.cookies.cookieName}`);
})



app.get('/checkOnlineProfile', (req, res) => {


    const {
        id,
        Userid
    } = req.query;


    let sql = `select * from user where UserId = "${Userid}"`;
    let sql2 = `select * from register  where userId = "${Userid}"`;
    let sql3 = `select distinct interest from interests where userId="${Userid}"`
    let sql4 = `select * from follow where followedId = "${Userid}" AND userId = ${id} `;

    connection.query(sql, (err, result) => {

        connection.query(sql2, (err, result2) => {
            connection.query(sql3, (err, result3) => {
                connection.query(sql4, (err, result4) => {
                    if (result4.length == 0) {

                        res.render('checkOnlineProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: false,
                            id: req.cookies.cookieName
                        });

                    } else {

                        res.render('checkOnlineProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: true,
                            id: req.cookies.cookieName
                        });

                    }



                })
            })
        })



    })

});




app.get('/commonOnline', (req, res) => {
    const {
        id
    } = req.query;


    let sql2 = `select distinct userName , interests.profile,user.userId,
    available FROM tsc.interests join tsc.user using (userName) where interest in
                       (Select interest from tsc.interests where userId=${id}) And available = "Online";`;


    connection.query(sql2, (err, result) => {

        res.render('commonOnline', {
            users: result,
            id: req.cookies.cookieName
        })


    })
me
});




app.get('/activityLounge', (req, res) => {
    const {
        id,
        userId
    } = req.query;

    let sql2 = `select distinct userName ,user.userId,activity.activityName,
             activity.activityStarts,activity.activityEnds,activityCapacity,enrolled,date,idgame,activityLocation
             FROM tsc.user join tsc.activity using (userId) where userId in
             (Select userId from tsc.activity) And activity.date >= CURDATE();`;

    let sql = `select idgame from waitinglist where invitedId="${req.cookies.cookieName}" `
   
    connection.query(sql, (err, result2) => {
        let sql3 = `select idgame from activitylounge where invitedId="${req.cookies.cookieName}" `
        connection.query(sql2, (err, result) => {
            connection.query(sql3, (err, result3) => {

            res.render('activityLounge', {
                activity: result,
                id: req.cookies.cookieName,
                idgame: result2,
                accepted2: result3
            })
})
        })
    })

});



app.get('/createActivity', function(req, res) {

    let sql = `select * from user`

    connection.query(sql, (err, result) => {
        if (err) console.log(err);
        res.render('createActivity', {
            check: false,
            checkDate: false,
            id:req.cookies.cookieName
        });

    })
});




app.post('/addActivity', (req, res) => {

    const {
        activityName,
        activityStarts,
        activityEnds,
        activityCapacity,
        date,
        activityLocation
    } = req.body;

    let checkSQL = `select * from activity where userId="${req.cookies.cookieName}" 
        and activityName= "${activityName}" and date = CURDATE()`

    var date2 = new Date();
    var current_time = date2.getHours() + ":" + date2.getMinutes()


    var current_date = date2.getFullYear() + "-" + (date2.getMonth() + 1) + "-" + date2.getDate();


    let s = date + "";
    let n = +s.substring(8, 10);

    if (n < date2.getDate()) {
        res.render('createActivity', {
            check: false,
            checkDate: true
        });

    } else {

        let insertSQL = `INSERT INTO activity 
              (userId,activityName,activityStarts,activityEnds,activityCapacity,date,activityLocation)   VALUES
               ("${req.cookies.cookieName}", "${activityName}","${activityStarts}","${activityEnds}",
               "${activityCapacity}","${date}","${activityLocation}" )`;

        connection.query(checkSQL, (err, result1) => {
            if (err) throw err;
            if (result1.length == 0) {

                let idSQL=`select idgame from activity where activityName="${activityName}" and userId="${req.cookies.cookieName}"`;
              


                connection.query(insertSQL, (err, result) => {
                    if (err) throw err;

                })
                connection.query(idSQL, (err, idResult) => {

                    let insertSQL2 = `Insert Into waitinglist(userId,invitedId,idgame) values ("${req.cookies.cookieName}",
                     "${0}",${idResult[0].idgame})`;
     
                connection.query(insertSQL2, (err, result) => {
                    if (err) throw err;

                })

            })
                res.redirect(`/activityLounge?id=${req.cookies.cookieName}`);
            } else {
                res.render('createActivity', {
                    check: true,
                    checkDate: false
                });

            }
        })
    }

})




app.post('/requestEnrollement', (req, res) => {
    const {
        Userid,
        id,
        idgame
    } = req.query;

    let sql1 = `Insert Into waitinglist(userId,invitedId,idgame) values ("${Userid}", "${id}",${idgame})`

    connection.query(sql1, (err, result) => {
        if (err) throw err;

    })
    res.redirect(`/activityLounge?id=${id}`);


})


app.post('/deleteActivity', (req, res) => {

    const {
        idgame
    } = req.query;

    let deleteSQL = `Delete from activity
                                          where 
                                          idgame= ${idgame}`;
    let deleteSQl2 = `Delete from waitinglist
                                          where 
                                          idgame= ${idgame}`;
    let deleteSQl3 = `Delete from activitylounge
                                          where 
                                          idgame= ${idgame}`;
    connection.query(deleteSQL, (err, result) => {
        if (err) throw err;

        connection.query(deleteSQl2, (err, result1) => {

            if (err) throw err;


        })
    })
    
    connection.query(deleteSQl3, (err, result1) => {

        if (err) throw err;


    })
    res.redirect(`/activityLounge?id=${req.cookies.cookieName}`);
})


app.get('/manageActivities', (req, res) => {

 
    let sql = `select  distinct activity.activityName,
    activityCapacity,enrolled,activity.idgame  FROM  tsc.activity where activity.userId = "${req.cookies.cookieName}"; `
    
   
        connection.query(sql, (err, result) => {
   
       
            res.render('manageActivities', {
                activity: result,
              
                id: req.cookies.cookieName,
            
         
          
        })
    })

});


app.get('/activityProfile', (req, res) => {


    const {
        id,
        Userid
    } = req.query;


    let sql = `select * from user where UserId = "${Userid}"`;
    let sql2 = `select * from register  where userId = "${Userid}"`;
    let sql3 = `select distinct interest from interests where userId="${Userid}"`
    let sql4 = `select * from follow where followedId = "${Userid}" AND userId = ${id} `;

    connection.query(sql, (err, result) => {

        connection.query(sql2, (err, result2) => {
            connection.query(sql3, (err, result3) => {
                connection.query(sql4, (err, result4) => {


                    if (result4.length == 0) {

                        res.render('activityProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: false,
                            id: req.cookies.cookieName
                        });

                    } else {

                        res.render('activityProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: true,
                            id: req.cookies.cookieName
                        });

                    }



                })
            })
        })



    })

});


app.get('/manageActivity', function(req, res) {
const{id}=req.query;
    let sql = `select distinct userName ,user.userId, register.profile
    FROM tsc.user join tsc.register using(userId) where userId in
    (Select invitedId from tsc.waitinglist where idgame=${id}) ; `
    let sqlCount=`select count(invitedId)-1 as count from tsc.waitinglist where userId="${req.cookies.cookieName}"`
    connection.query(sql, (err, result) => {
        if (err) console.log(err);


        res.render('manageActivity', {
            users:result,
            idgame:id,
            id:req.cookies.cookieName,
            check: false,
            checkDate: false
        });

    })
});


app.post('/acceptEnrollement', (req, res) => {
    const {
        Userid,
        idgame
    } = req.query;

    let sql1 = `Insert Into activitylounge(userId,invitedId,idgame) values ("${req.cookies.cookieName}", "${Userid}",${idgame})`
    let deleteSQL=`delete from waitinglist where idgame=${idgame} and invitedId="${Userid}"`
    let updateEnrolled= `UPDATE tsc.activity Set enrolled= enrolled+1 where idgame=${idgame}`

    connection.query(sql1, (err, result) => {
        if (err) throw err;

    })
    connection.query(deleteSQL, (err, result) => {
        if (err) throw err;

    })
    connection.query(updateEnrolled, (err, result) => {
        if (err) throw err;

    })
    res.redirect(`/manageActivity?id=${idgame}`);


})

app.post('/declineEnrollement', (req, res) => {
    const {
        Userid,
        idgame
    } = req.query;

    let deleteSQL = `delete from waitinglist where idgame=${idgame} and invitedId="${Userid}"` 

    connection.query(deleteSQL, (err, result) => {
        if (err) throw err;

    })
    res.redirect(`/manageActivity?id=${idgame}`);


})

app.get('/viewEnrolled', function(req, res) {
const{idgame}=req.query;
    let sql = `select distinct userName ,user.userId, register.profile
    FROM tsc.user join tsc.register using(userId) where userId in
    (Select invitedId from tsc.activitylounge where idgame=${idgame}) ;`
console.log(sql)
    connection.query(sql, (err, result) => {
        if (err) console.log(err);
        console.log(result);
        res.render('viewEnrolled', {
            users:result,
            idgame:idgame,
            id:req.cookies.cookieName,
            check: false,
            checkDate: false
        });

    })
});



app.get('/checkRequestProfile', (req, res) => {


    const {
        id,
        Userid,
        idgame
    } = req.query;


    let sql = `select * from user where UserId = "${Userid}"`;
    let sql2 = `select * from register  where userId = "${Userid}"`;
    let sql3 = `select distinct interest from interests where userId="${Userid}"`
    let sql4 = `select * from follow where followedId = "${Userid}" AND userId = ${id} `;

    connection.query(sql, (err, result) => {

        connection.query(sql2, (err, result2) => {
            connection.query(sql3, (err, result3) => {
                connection.query(sql4, (err, result4) => {
                    if (result4.length == 0) {

                        res.render('checkRequestProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: false,
                            idgame:idgame,
                            id: req.cookies.cookieName
                        });

                    } else {

                        res.render('checkRequestProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: true,
                            id: req.cookies.cookieName,
                            idgame:idgame
                        });

                    }



                })
            })
        })



    })

});



app.get('/checkEnrolledProfile', (req, res) => {


    const {
        id,
        Userid,
        idgame
    } = req.query;


    let sql = `select * from user where UserId = "${Userid}"`;
    let sql2 = `select * from register  where userId = "${Userid}"`;
    let sql3 = `select distinct interest from interests where userId="${Userid}"`
    let sql4 = `select * from follow where followedId = "${Userid}" AND userId = ${id} `;

    connection.query(sql, (err, result) => {

        connection.query(sql2, (err, result2) => {
            connection.query(sql3, (err, result3) => {
                connection.query(sql4, (err, result4) => {
                    if (result4.length == 0) {

                        res.render('checkEnrolledProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: false,
                            idgame:idgame,
                            id: req.cookies.cookieName
                        });

                    } else {

                        res.render('checkEnrolledProfile', {
                            user: result[0],
                            info: result2[0],
                            interests: result3,
                            followed: true,
                            id: req.cookies.cookieName,
                            idgame:idgame
                        });

                    }



                })
            })
        })



    })

});




app.use(express.static('image'))


app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/images'));

const PORT = 4001;
app.listen(PORT);

console.log(`Server is running on ${PORT}`);