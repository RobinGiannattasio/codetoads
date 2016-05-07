var db = require('./../db/config');
var request = require('request');
var Game = db.Game;
var User = db.User;

//easy, eedium, hard, insane
var easy = [
  'sum-of-multiples',
  'name-on-billboard',
  'fix-your-code-before-the-garden-dies',
  'printing-array-elements-with-comma-delimiters'
];

var med = [
    'wheel-of-fortune',
    'special-multiples',
    'dna-sequence-tester',
    'i-love-big-nums-and-i-cannot-lie'
];

var grabPrompt = function(level, iterator) {
  //randomly pick challenge based on choice posted
  if (level === 'easy') {
    var rand = easy[Math.floor(Math.random() * easy.length)];
  } else {
    var rand = med[Math.floor(Math.random() * med.length)];
  }
  //generate query
  var options = {
    headers: {
      Authorization: process.env.cwKey
    },
    url : 'https://www.codewars.com/api/v1/code-challenges/' +
    rand + '/javascript/train'
  }
  //grab prompt and send back
  request.post(options, function(err, response, body) {
    var info = JSON.parse(body);
    //async data
    iterator(info);
  });
}

module.exports.saveUser = function(req, res) {
  User.create({
      auth_id: req.body.user_id,
      username: req.body.nickname,
      firstname: req.body.given_name,
      lastname: req.body.family_name
    }, function(error, doc) {
      console.log(doc);
    });

}

module.exports.makeGame = function(req, res) {
  var result = [];
  for (var i = 0; i < 3; i++) {
    grabPrompt('easy', function(info) {
      result.push(info);
      //send result array when question amount is hit
      if (result.length === 3) {
        res.send(result);
      }
    });
  }
}

module.exports.submitAttempt = function(req, res) {
  // var project_id = '5727dcf97fc662c6970009e2';
  // var solution_id = '5727dcf90838ffce0f000918';

  //add to options for post query
  var options = { method: 'POST',
    url: 'https://www.codewars.com/api/v1/code-challenges/projects/' +
          req.body.project_id +
          '/solutions/' +
          req.body.solution_id +
          '/attempt',
    headers:
     {
       'cache-control': 'no-cache',
       'content-type': 'application/json',
       output_format: 'raw',
       authorization: process.env.cwKey
     },
    body: { code: req.body.code }, // 'function greet(){return \'hello world\'}'
    json: true };
  //post
  request.post(options, function(err, response, body) {
    if (err) {
      return console.error('failed', err);
    }
    if (body.success) {
      var innerOptions = {
        url: 'https://www.codewars.com/api/v1/deferred/' +
        body.dmid,
        headers: {
          Authorization: process.env.cwKey
        }
      }
      setTimeout(function() {
          request.get(innerOptions, function(err, response, innerBody) {
            if (err) {
              return console.error('failed defer', err);
            }
          res.send({response: innerBody, setup: req.body.code});
        });
      }, 1500);
    }
  });
}
// }
