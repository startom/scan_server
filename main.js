const express = require("express");
const bodyParser = require('body-parser');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const cors = require('cors');
const fs = require('fs');
const path = require('path');

server.listen(8090, () => {
    console.log(`server running on port 8090`);
});

var posts = [];
var str_posts = '';
var tags = [];
var interval = undefined;
var anchors = [];

fs.readFile('loctags.json', 'utf8', function(err, data){
    if(data != ''){
        tags = JSON.parse(data);
    }
    console.log(tags);
})

fs.readFile('locanchors.json', 'utf8', function(err, data){
    if(data != ''){
        anchors = JSON.parse(data);
    }
    console.log(anchors);
})

app.use(bodyParser.json());
app.use(cors());

//app.use(express.static(path.join(__dirname, '~/dev/vuejs/scandata')));

app.use((err, req, res, next) => {
    console.error(err);
    if (err.status === 400)
        return res.status(err.status).send('not ok');
    return next(err);
});

app.post('/iris/tags', (req, res) => {

    var unique = 1;

	str_posts = JSON.stringify(req.body, undefined, 2);
    posts = JSON.parse(str_posts);
    console.log('tags received');
    
    if(posts.tags != undefined){
                    
        for(var i = 0; i < posts.tags.length; i++ ) {

            for(var j = 0; j < tags.length; j++) {
                if(tags[j].data.epc === posts.tags[i].data.epc){
                    unique = 0;
                }
            }

            if(unique === 1){

                if(JSON.stringify(tags).search(JSON.stringify(posts.tags[i].data.epc)) === -1){
                    tags.push(posts.tags[i]);
                }

            }

            unique = 1;

        }

        fs.writeFile('loctags.json', JSON.stringify(tags, undefined, 2), function(err){
            if(err) throw err;
            console.log('tags saved');
        });

        io.sockets.emit('tagsChannel', JSON.stringify(tags));

        return res.status(200).send("OK");
                    
    }

})

app.post('/iris/anchors', (req, res) => {

    var str = '';

    str = JSON.stringify(req.body, undefined, 2);
    anchors = JSON.parse(str);
    console.log('anchors received');
    
    fs.writeFile('locanchors.json', JSON.stringify(anchors, undefined, 2), function(err){
            if(err) throw err;
            console.log('anchors saved');
        });
    //io.sockets.emit.broadcast('anchorsChannel', JSON.stringify(anchors));

    io.sockets.emit('anchorsChannel', JSON.stringify(anchors));

    return res.status(200).send("OK");

})

.get('/iris/tags', (req,res) => {
	res.setHeader("Content-Type", "application/json");
	res.send(str_posts);
})

.get('/iris/anchors', (req,res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(str);
});


io.sockets.on('connection', function(socket){

    socket.emit('messageChannel', 'connected');

    socket.emit('tagsChannel', JSON.stringify(tags));
    socket.emit('anchorsChannel', JSON.stringify(anchors));

    socket.on('pingServer', function(){
        console.log('ping reçu');
        socket.emit('messageChannel', 'ping received');
    })

    socket.on('flushTags', function(){
        console.log('flushing tags ... ');
        tags = [];
        fs.writeFile('loctags.json', '', function(err){
            if(err) throw err;
            console.log('flushing complete');
        });
    })

    socket.on('flushAnchors', function(){
        console.log('flushing anchors ... ');
        anchors = [];
        fs.writeFile('locanchors.json', '', function(err){
            if(err) throw err;
            console.log('flushing complete');
        });
    })

    // interval = setInterval(() => {
    //     if(tags != []){
    //         socket.broadcast.emit('tagsChannel', JSON.stringify(tags));
    //         socket.emit('tagsChannel', JSON.stringify(tags));
    //     }
    //     if(anchors != []){
    //         socket.broadcast.emit('anchorsChannel', JSON.stringify(anchors));
    //         socket.emit('anchorsChannel', JSON.stringify(anchors));
    //     }
        
    // }, 2000);

});
