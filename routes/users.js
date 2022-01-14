const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const Church = require('../models/Church')
const User = require('../models/User')
const axios = require('axios')


//ROUTES ----------------------------------------------------------------

//return all the user data, requires db_id
router.get('/', async (req,res) => {
    try {
        if (!req.query.userId) res.status(403).json( {message: 'noUserId'} )
        else {
            const user = await User.findById(req.query.userId)
            res.status(200).json( user )
        }
        
    } catch (e) { res.status(500).json({ message: "serverError" }) }
})


//returns db_id, requires username
router.get('/login', async (req,res) => {
    try {
        const user = await findUserByUsername(req.query.username)
        if (!user) res.status(403).json({ message: 'usernameNotCorrect' })
        else {
            syncUser(user).then(updatedUser => {
                res.status(200).json({ _id:updatedUser._id}) 
            }).catch(err => {
                res.status(200).json({ message:err }) 
            })
        }
    }
    catch (err) { 
        res.status(500).json({ message: "serverError" }) }
})

//updates user info
router.patch('/', async (req,res) => {
    try {
        if (!req.body.id) {
            res.status(400).json({message: "invalidId"})
        }
        else {
            const updatedUser = await User.findOneAndUpdate({_id: req.body.id}, {...req.body}, {new: true})
            if (!updatedUser) res.status(500).json({message: "userNotFound"})
            else res.status(200).json(updatedUser)
        }
    } catch (err) {
        res.status(500).json({ message: "serverError" }) }
})

//creates new user if doesn't exist, requires accessToken, refreshtoken, and username; returns db_id
router.post('/', async (req,res) => {
    try {
        //Church Setup
        const { churchName, churchId } = await getChurchPCO(req.body.accessToken)
        const dbChurchId = await doesChurchExist(churchId)

        const churchModel = await new Church({ PCO_Id: churchId, name: churchName })
        if (!dbChurchId) {
            const savedChurch = await churchModel.save()
            churchModel.PCO_Id = savedChurch.PCO_Id
        }

        //User Setup
        const PCO_User = await getMyUserPCO(req.body.accessToken)
        const { dbUserId, dbUserUsername } = await doesUserExist(PCO_User.userPCO_Id)
        
        const userModel = new User({...PCO_User, username: req.body.username, churchId: churchModel.PCO_Id, refreshToken: req.body.refreshToken})

        //tries to add the user
        if (!dbUserId) {
            try {
                const savedUser = await userModel.save()
                userModel._id = savedUser._id
                res.status(200).json({db_id: userModel._id})
            } catch (e) {
                res.status(403).json({message: e.code, details: Object.keys(e.keyPattern)})
            }
        }
        //if user exists but usernames are different, user account already exists with different username
        else if (dbUserUsername != userModel.username){
            res.status(200).json({message: 'userAlreadyExists', details: ['accountCreatedWithDifferentUsername']})
        }
        // user exists and has same username
        else {
            syncUser(userModel).then(updatedUser => {
                res.status(200).json({db_id: updatedUser._id, warning: 'accountWasAlreadyCreated'})
            })
        }

        

    } catch (err) {
        console.log(err)
        res.status(500).json({message: err})
    }
})




//HELPER METHODS---------------------------------------------------------


//returns the church name and id associated with the auth token
const getChurchPCO = async (accessToken) => {
    const churchConfig = {
        method: 'get',
        url: 'https://api.planningcenteronline.com/services/v2',
        headers: {
            'Authorization': 'Bearer '+accessToken
        }
    }
    const churchRes = await axios(churchConfig)
    const churchName = churchRes.data.data.attributes.name
    const churchId = churchRes.data.data.id
    return { churchName, churchId }
}

//returns db id if exists
const doesChurchExist = async (churchId) => {
    const church = await Church.findOne({PCO_Id: churchId})
    try { return church._id }
    catch { return null }
}

//returns User obj. associated with auth token
const getMyUserPCO = async (accessToken) => {
    try {
        const userConfig = {
            method: 'get',
            url: 'https://api.planningcenteronline.com/services/v2/me',
            headers: {
                'Authorization': 'Bearer '+accessToken
            }
        }
        const userRes = await axios(userConfig)
        const userData = userRes.data.data
        const newUser = {
            userPCO_Id: userData.id,
            firstName: userData.attributes.first_name,
            lastName: userData.attributes.last_name,
            birthdate: userData.attributes.birthdate,
            profilePhotoURL: userData.attributes.photo_url,
            profilePhotoURLThumbnail: userData.attributes.photo_thumbnail_url,
            permissionLevel: userData.attributes.permissions,
            accessToken: accessToken,
        }
        return newUser
    }
    catch (e) {
        const statusCode = e.request.res.socket._httpMessage.res.statusCode
        if (statusCode == 401) {
            let newAccessToken = await refreshAccessToken(accessToken)
            return getMyUserPCO(newAccessToken)
        }
        else {
            return {err: e.request.res.socket._httpMessage.res.statusCode}
        }
    }
    
}

//returns db id if exists
const doesUserExist = async (userId) => {
    const user = await User.findOne({userPCO_Id: userId})
    try { return { dbUserId: user._id, dbUserUsername: user.username} }
    catch { return { dbUserId: null, dbUserUsername: null } }
}

//returns db_id if username exists
const findUserByUsername = async (username) => {
    const user = await User.findOne({username: username})
    try { return user }
    catch { return null }
}

//sends PCO user to DB
const syncUser = async (user) => {
    const pcoUser = await getMyUserPCO(user.accessToken)
    if (pcoUser.err) return new Promise((res, rej)=> rej('could not update user'))
    return new Promise ((res, rej) => {
        User.findOneAndUpdate({username: user.username}, {...pcoUser}, {new: true}).then(updatedUser => {
            res(updatedUser)
        })
    })
}


//gets new accesstoken
const refreshAccessToken = async (oldAccessToken) => {
    try {
        //finds refresh token in db
        const user = await User.findOne({accessToken: oldAccessToken})
        if (!user.refreshToken) throw new Error('refreshTokenNotFound')

        const payload = {
            "client_id":process.env.CLIENT_ID,
            "client_secret":process.env.CLIENT_SECRET,
            "refresh_token": user.refreshToken,
            "grant_type": "refresh_token"
        }

        const authRes = await axios.post('https://api.planningcenteronline.com/oauth/token', payload);
        const data = authRes.data

        //updates refresh and access token in db
        const updatedUser = await User.findOneAndUpdate({accessToken: oldAccessToken}, {accessToken:data.access_token, refreshToken: data.refresh_token}, {new: true})
        if (!updatedUser) throw new Error('unableToSyncAuthToDb')

        return updatedUser.accessToken
    }
    catch (e) {
        console.log(e)
        return e
    }
}



module.exports = router