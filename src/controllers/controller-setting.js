module.exports ={
    setting(req,res){
        res.render("setting",{
            url: 'http://localhost:5050/',
            userName: req.session.username,
        });
    }
}