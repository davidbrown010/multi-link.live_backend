const express = require('express')
const router = express.Router()
require('dotenv/config')

router.get('/auth-redirect', async (req,res)=> {
    try {
        res.status(200).json({ redirectLink: "https://api.planningcenteronline.com/oauth/authorize?client_id="+process.env.CLIENT_ID+"&redirect_uri=http://192.168.4.40:5000/multi-link.live/auth/register-redirect.php&response_type=code&scope=services"})
    } catch (err) { res.status(500).json( { message: err } )}
})

router.get('/login-redirect', async (req,res)=> {
    try{
        res.status(200).json({ redirectLink: "https://api.planningcenteronline.com/oauth/authorize?client_id="+process.env.CLIENT_ID+"&redirect_uri=http://192.168.4.40:5000/multi-link.live/auth/login-redirect.php&response_type=code&scope=services"})
    } catch (err) { res.status(500).json( { message: err } )}
})

module.exports = router