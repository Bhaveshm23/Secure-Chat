var express =  require('express'),
    app     =  express(),
    server  =  require('http').createServer(app),
    io      =  require('socket.io').listen(server),
    users = {};

    app.set("view engine", "ejs");


app.get('/',function(req,res){
    res.render('index');
});

//Socket functionality on server
//When a client connects to socket io app, they turn on a connection event

io.sockets.on('connection',function(socket){

    socket.on('new user',function(data,callback){
        //if nickname is already in array then send false
        if(data in users){
            //it is in array
            callback(false);
        }else{
            callback(true);
            socket.nickname = data; //since each user has a socket of itself
            users[socket.nickname]  = socket;
            updateNickNames();
        }
    });

    socket.on('send message',function(data,callback){ //server side send message 
        var msg = data.trim();
        //sending private message to the user when @username is typed
        if(msg.substr(0,1) === "@"){
            //send message privately
            //messge format --  @username 'space' message
            msg = msg.substr(1); //msg = username 'space' message
            var ind = msg.indexOf(' '); //find the index of 1st space
            if(ind !== -1){
                //check wheather user is valid ie. in the list or not
                    var name = msg.substr(0, ind);
                    var msg  = msg.substr(ind+1);
                    if(name in users){
                        console.log('Private message');
                        users[name].emit('private message',{msg:msg, nick:socket.nickname});
                    }else{
                        callback('Error! Enter a valid user');
                    }
            }else{
                console.log("Error! Please enter a message");
            }

        }else{
            //send message to everyone
            io.sockets.emit('new message',{msg:msg, nick:socket.nickname}); //passing the nickname

        }
    });


    //removing the user on disconnect
    socket.on('disconnect',function(data){
        if(!socket.nickname) return; // not a registered nickname
        delete users[socket.nickname]; //deleting from list
        updateNickNames();
    });

    function updateNickNames(){
        io.sockets.emit('usernames',Object.keys(users)); //this will give array of nicknames

    }

});





server.listen(3000, function(){
    console.log("Server running....")
});