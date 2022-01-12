const express = require('express')
const router = express.Router()
const Post = require('../models/Post')

//ROUTES
//GET BACK ALL THE POSTS
router.get('/', async (req,res)=> {
    try{
        const posts = await Post.find().limit(5)
        res.status(200).json(posts)
    } catch (err) { res.status(500).json({message: err})}
})

//SUBMITS A POST
router.post('/', async (req, res)=> {
    console.log(req.body)
    const post = new Post({
        title: req.body.title,
        description: req.body.description
    })
    try {
        const savedPost = await post.save()
        res.status(200).json(savedPost)
    } catch (err) { res.status(500).json({message: err}) }
})

//SPECIFIC POST
router.get('/:postId', async (req,res)=> {
    try {
        const post = await Post.findById(req.params.postId)
        res.status(200).json(post)
    } catch (err) { res.status(500).json({ message: err }) }
})

//DELETE POST
router.delete('/:postId', async (req,res)=> {
    try {
        const post = await Post.remove({_id: req.params.postId})
        res.status(200).json(post)
    } catch (err) { res.status(500).json({message: err}) }
})

//UPDATE POST
router.patch('/:postId', async (req,res)=> {
    try {
        const post = await Post.updateOne({ _id: req.params.postId }, { $set: {title: req.body.title, description: req.body.description} })
        res.status(200).json(post)
    } catch (err) { res.status(500).json({message: err}) }
})

module.exports = router