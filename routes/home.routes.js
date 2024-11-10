const express = require('express');
const router = express.Router();
const db = require('../db');
const requestIp = require('request-ip');
const { alterPasswordVulnerability, updateLoginAttemptsForIP } = require('./helpers.functions');



router.get('/', async function (req, res) {
    res.render('home', {
        order: undefined,
        user_name: undefined,
        err_sql: undefined,
        err_login: undefined,
        msg_login: undefined,
    });
});


router.post('/', async function (req, res) {
    console.log(req.body)
    try {
        if (req.body.form_type == 'broken-auth-form') {
            const resultPassChange = await alterPasswordVulnerability(req.body.vulnerability);
            
            const sqlUser = `SELECT * FROM users WHERE user_name = $1;`;
            const resultUser = (await db.query(sqlUser, [req.body.user])).rows;
            console.log(resultUser)

            if (!req.body.vulnerability) {
                const {'g-recaptcha-response': recaptchaResponse} = req.body;
                if (!recaptchaResponse) {
                    return res.status(400).send('Captcha is required');
                }


                var clientIp = requestIp.getClientIp(req);
                const sqlIPaddr = `SELECT * FROM login_attempts WHERE ip_address = $1;`;
                const resultIPaddr = (await db.query(sqlIPaddr, [clientIp])).rows;
                console.log(resultIPaddr)
                if (resultIPaddr.length == 0) {
                    const sqlInserNewIPaddr = `INSERT INTO login_attempts 
                    (ip_address, attempt_count, last_attempt) VALUES ($1, 1, now()::timestamp)`;
                    const resultInserNewIPaddr = (await db.query(sqlInserNewIPaddr, [clientIp])).rows;
                } else if (resultIPaddr[0].attempt_count >= 3 && Date.now() - new Date(resultIPaddr[0].last_attempt).getTime() < 3 * 60 * 1000) {
                    return res.render('home', {
                        order: undefined,
                        user_name: undefined,
                        err_sql: undefined,
                        err_login: 'Too many failed attempts. Try again after few minutes.',
                        msg_login: undefined,
                    });
                }

                if (resultUser.length == 0) {
                    const resultupdateLoginAttemptsForIP = await updateLoginAttemptsForIP(resultIPaddr[0], 1, clientIp, undefined)
                    res.render('home', {
                        order: undefined,
                        user_name: undefined,
                        err_sql: undefined,
                        err_login: 'Incorrect user name or password!',
                        msg_login: undefined,
                    });

                } else if (req.body.password !== resultUser[0].password) {
                    const resultupdateLoginAttemptsForIP = await updateLoginAttemptsForIP(resultIPaddr[0], 1, clientIp, undefined)
                    res.render('home', {
                        order: undefined,
                        user_name: undefined,
                        err_sql: undefined,
                        err_login: 'Incorrect user name or password!',
                        msg_login: undefined,
                    });

                } else {
                    const resultupdateLoginAttemptsForIP = await updateLoginAttemptsForIP(undefined, undefined, clientIp, 1)
                    res.render('home', {
                        order: undefined,
                        user_name: undefined,
                        err_sql: undefined,
                        err_login: undefined,
                        msg_login: 'Login successful!',
                    });
                }

            } else {
                if (resultUser.length == 0) {
                    res.render('home', {
                        order: undefined,
                        user_name: undefined,
                        err_sql: undefined,
                        err_login: 'Incorrect user name',
                        msg_login: undefined,
                    });
                } else if (req.body.password !== resultUser[0].password ) {
                    res.render('home', {
                        order: undefined,
                        user_name: undefined,
                        err_sql: undefined,
                        err_login: 'Incorrect password',
                        msg_login: undefined,
                    });
                } else {
                    res.render('home', {
                        order: undefined,
                        user_name: undefined,
                        err_sql: undefined,
                        err_login: undefined,
                        msg_login: 'Login successful!',
                    });
                }
            }


        //  SQL INJECT
        } else {
            if (!req.body.vulnerability) {
                if (isNaN(req.body.orderid) || req.body.orderid.trim() == '') {
                    return res.render('home', {
                                order: undefined,
                                user_name: undefined,
                                err_sql: 'Invalid input for Order ID. Please enter ID number!',
                                err_login: undefined,
                                msg_login: undefined,
                            });
                }

                const sqlOrder = `SELECT reciver_name, delivery_address, quantity, what FROM orders WHERE order_id = $1;`;
                const resultOrder = (await db.query(sqlOrder, [req.body.orderid])).rows;
                console.log(resultOrder)

                if (resultOrder.length == 0) {
                    res.render('home', {
                        order: undefined,
                        user_name: undefined,
                        err_sql: 'Incorrect Order ID',
                        err_login: undefined,
                        msg_login: undefined,
                    });
                } else {
                    res.render('home', {
                        order: JSON.stringify(resultOrder),
                        user_name: undefined,
                        err_sql: undefined,
                        err_login: undefined,
                        msg_login: undefined,
                    });
                }

            } else {
                try {
                    const sqlOrder = `SELECT reciver_name, delivery_address, quantity, what FROM orders WHERE order_id = ` + req.body.orderid + `;`;
                    const resultOrder = (await db.query(sqlOrder, [])).rows;
                    console.log(sqlOrder)

                    if (resultOrder.length == 0) {
                        res.render('home', {
                            order: undefined,
                            user_name: undefined,
                            err_sql: 'Incorrect Order ID',
                            err_login: undefined,
                            msg_login: undefined,
                        });
                    } else {
                        res.render('home', {
                            order: JSON.stringify(resultOrder),
                            user_name: undefined,
                            err_sql: undefined,
                            err_login: undefined,
                            msg_login: undefined,
                        });
                    }
                }  catch (err) {
                    console.log(err);
                    res.type('text/plain');
                    res.status(500);
                    res.send('500 Server Error: ' + err);
                }
                
            }
            
        }
    } catch (err) {
        console.log(err);
        res.type('text/plain');
        res.status(500);
        res.send('500 Server Error');
    }
});

module.exports = router;