var http       = require('http')
  , AlexaSkill = require('./AlexaSkill')
  , APP_ID     = 'amzn1.echo-sdk-ams.app.63ef2ea2-3d2f-4d43-a5de-df2cf564f93e';

var urlArrival = function(stopId){
  return 'http://trimet.org/ws/int/v2/arrivals/?locIDs=' + stopId;
};
var urlAlerts = function(stopId){
  return 'http://trimet.org/ws/int/v1/detours?json=true';
};

// 0 = start
// 1 = requested alert but no route
// 2 = requested alert with route
// 3 = requested arrival but no route no stop
// 4 = requested arrival but no route with stop
// 5 = requested arrival with route but no stop
// 6 = requested arrival with route with stop


var getJSON = function(stopId, callback){
  http.get(urlArrival(stopId), function(res){
    var body = '';

    res.on('data', function(data){
      body += data;
    });

    res.on('end', function(){
      var result = JSON.parse(body);
      callback(result);
    });

  }).on('error', function(e){
    console.log('Error: ' + e);
  });
};

//Arrivals Request
var handleArrivalsRequest = function(intent, session, response){
  var routeBus = intent.slots.routeBus.value || null;
  var routeTrain = intent.slots.routeTrain.value || null;
  var stop = intent.slots.stop.value || null;

  var text = '';

  //User states no route or stop. "Get arrivals"
  if (routeBus == null && routeTrain == null && stop == null){
    session.attributes.stage = 3;
    text = 'For what line would you like arrivals for?';
    response.ask(text);
  }

  //User states bus route but no stop. "Get arrivals for line 35."
  else if (routeBus != null && routeTrain == null && stop == null){
    session.attributes.stage = 5;
    session.attributes.route = routeBus;
    text = 'Line ' + routeBus + ', got it. What is the stop number?';
    response.ask(text);
  }

  //User states train route but no stop. "Get arrivals for orange line."
  else if (routeBus == null && routeTrain != null && stop == null){
    session.attributes.stage = 5;
    session.attributes.route = routeTrain;
    text = 'The ' + routeTrain + ' line, got it. What is the stop number?';
    response.ask(text);

  }

  //User states bus route and stop. "Get arrivals for line 35 at 1234."
  else if (routeBus != null && routeTrain == null && stop != null){
    text = {
      speech: '<speak>Bus line ' + routeBus + ' will arrive in 5 minutes at stop <say-as interpret-as="spell-out">' + stop + '</say-as></speak>',
      type: AlexaSkill.speechOutputType.SSML
    };
    response.tell(text);
  }

  //User states train route and stop. "Get arrivals for orange line at 1234."
  else if (routeBus == null && routeTrain != null && stop != null){
    getJSON(stop, function(data){
      text = {
        speech: '<speak>The ' + routeTrain + ' will arrive in 5 minutes at ' + data.resultSet.location[0].desc + ', stop <say-as interpret-as="spell-out">' + stop + '</say-as></speak>',
        type: AlexaSkill.speechOutputType.SSML
      };
      response.tell(text);
    });
  }
};

//Alerts Request
var handleAlertsRequest = function(intent, session, response){
  var routeBus = intent.slots.routeBus.value || null;
  var routeTrain = intent.slots.routeTrain.value || null;

  var text = '';

  if (routeBus == null && routeTrain == null){
    session.attributes.stage = 1;
    text = 'For what line would you like alerts for?';
    response.ask(text);
  }
  else if (routeBus == null && routeTrain != null){
    text = 'There are no alerts for the ' + routeTrain + ' line';
    response.tell(text);
  }
  else if (routeBus != null && routeTrain == null){
    text = 'There are no alerts for bus line ' + routeBus;
    response.tell(text);
  }
};

//Info Request
var handleInfoRequest = function(intent, session, response){
  var routeTrain = intent.slots.routeTrain.value || null;
  var infoNumber = intent.slots.infoNumber.value || null;
  var text = '';

  if (session.attributes.stage == 0){
    text = 'I didnt quite get that. You can say, get arrivals or get alerts.';
    response.ask(text);
  }

  if (session.attributes.stage == 1){
    if (routeTrain == null && infoNumber != null){
      text = 'There are no alerts for bus line' + infoNumber;
      response.tell(text);
    }
    else if (routeTrain != null && infoNumber == null){
      text = 'There are no alerts for the ' + routeTrain + ' line';
      response.tell(text);
    }
  }

  //speak arrivals
  if (session.attributes.stage == 5){
    if (infoNumber != null && session.attributes.route != null){
      text = {
        speech: '<speak>The ' + session.attributes.route + ' will arrive in 5 minutes at stop <say-as interpret-as="spell-out">' + infoNumber + '</say-as></speak>',
        type: AlexaSkill.speechOutputType.SSML
      };
      response.tell(text);
    }
    else {
      text = 'I didnt quite get that. What is the stop number?';
      response.ask(text);
    }
  }

  //get stop for arrivals
  if (session.attributes.stage == 3){
    if (routeTrain == null && infoNumber != null){
      session.attributes.stage = 5;
      text = 'Got it! Please state a stop number for bus line ' + infoNumber;
      session.attributes.route = infoNumber;
      response.ask(text);
    }
    else if (routeTrain != null && infoNumber == null){
      session.attributes.stage = 5;
      text = 'Got it! Please state a stop number for the ' + routeTrain + ' line';
      session.attributes.route = routeTrain;
      response.ask(text);
    }
  }
};

var BusSchedule = function(){
  AlexaSkill.call(this, APP_ID);
};

BusSchedule.prototype = Object.create(AlexaSkill.prototype);
BusSchedule.prototype.constructor = BusSchedule;

//On Call with no Intents
BusSchedule.prototype.eventHandlers.onLaunch = function(launchRequest, session, response){
  var output = 'Hello ' +
    'Welcome to TriMet. Would you like to get arrivals or alerts today?';

  var reprompt = 'You can say, get arrivals or get alerts.';

  response.ask(output, reprompt);
};

//On Intent
BusSchedule.prototype.intentHandlers = {
  GetArrivalsIntent: function(intent, session, response){
    handleArrivalsRequest(intent, session, response);
  },
  GetAlertsIntent: function(intent, session, response){
    handleAlertsRequest(intent, session, response);
  },
  GetInfoIntent: function(intent, session, response){
    handleInfoRequest(intent, session, response);
  },
  HelpIntent: function(intent, session, response){
    var speechOutput = 'You can say, get arrivals or get alerts.';
    response.ask(speechOutput);
  }
};

exports.handler = function(event, context) {
    var skill = new BusSchedule();
    skill.execute(event, context);
};