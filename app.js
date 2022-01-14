const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv/config')

app.use(bodyParser.json())

//Import Routes (Middleware)
const postsRoute = require('./routes/posts')
const authRoute = require('./routes/auth')
const userRoute = require('./routes/users')

app.use('/posts', postsRoute)
app.use('/auth', authRoute)
app.use('/users', userRoute)

app.get('/', (req,res)=> {
    res.send('We are on home')
})

//Connect to DB
mongoose.connect(process.env.DB_CONNECTION, () => {
    console.log('Connected to DB!')
})

//START SERVER
const port = process.env.PORT || 3000
app.listen(3000)
