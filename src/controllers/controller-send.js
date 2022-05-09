module.exports ={
    send(req,res){
        res.render("send",{
            url: 'http://localhost:5050/',
            userName: req.session.username,
        });
    }
}