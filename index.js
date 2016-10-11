var http       = require('http')
  , AlexaSkill = require('src/AlexaSkill')
  , request = require('request')
  , APP_ID     = 'amzn1.ask.skill.8ac7057e-58b3-4afb-a84a-e368bbaa5c20';

//Info Request
var handleInfoRequest = function(intent, session, response){
  var searchWord = intent.slots.searchWord.value || null;
  var timestamp = session.sessionId;
  var text = '';

  if (searchWord != null){
    text = 'Got it! Searching for ' + searchWord + '.';
    
    var formData = {
      search_term: searchWord
    }

    request.post({url:'http://beta.trimet.org/api/echo-search/', formData: formData}, function optionalCallback(err, httpResponse, body) {
      if (!err) {
        console.log(httpResponse);
        console.log(body);
        response.tell(text);
      }
      else {
        console.log(err);
        text = 'Sorry, unable to search at this time.';
        response.tell(text);
      }
    });
  }
  else {
    text = "Sorry, I wasn't able to understand you. What would you like to search for?"
    response.ask(text);
  }
};

var TwitterMonitor = function(){
  AlexaSkill.call(this, APP_ID);
};

TwitterMonitor.prototype = Object.create(AlexaSkill.prototype);
TwitterMonitor.prototype.constructor = TwitterMonitor;

//On Call with no Intents
TwitterMonitor.prototype.eventHandlers.onLaunch = function(launchRequest, session, response){

  var output = 'Hello!' +
    ' What would you like to search for?';

  var reprompt = 'What would you like to search for?';

  response.ask(output, reprompt);

};

//On Intent
TwitterMonitor.prototype.intentHandlers = {

  GetSearchIntent: function(intent, session, response){
    handleInfoRequest(intent, session, response);
  },
  HelpIntent: function(intent, session, response){
    var speechOutput = 'You can say, search for Portland, or search for TriMet.';

    response.ask(speechOutput);

  }
};

exports.handler = function(event, context) {
    var skill = new TwitterMonitor();
    skill.execute(event, context);
};