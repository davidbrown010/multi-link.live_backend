const express = require('express')
const router = express.Router()
require('dotenv/config')

router.get('/auth-redirect', async (req,res)=> {
    try {
        if (req.query.redirect == null) throw new Error('noRedirectFound')
        res.status(200).json({ redirectLink: "https://api.planningcenteronline.com/oauth/authorize?client_id="+process.env.CLIENT_ID+"&redirect_uri="+req.query.redirect+"&response_type=code&scope=services"})
    } catch (err) { res.status(500).json( { message: err } )}
})


module.exports = router