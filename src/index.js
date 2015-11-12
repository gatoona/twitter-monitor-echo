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

var sessionNow = 0;
var route = null;
var stop = null;

var getArrivalsJSON = function(stopId, callback){
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
  var routeBus = intent.slots.routeBus.value;
  var routeTrain = intent.slots.routeTrain.value;
  var stop = intent.slots.stop.value;

  var text = '';

  //User states no route or stop. "Get arrivals"
  if (routeBus == null && routeTrain == null && stop == null){
    text = 'For what line would you like arrivals for?';
    sessionNow = 3;
    response.ask(text);
  }

  //User states bus route but no stop. "Get arrivals for line 35."
  else if (routeBus != null && routeTrain == null && stop == null){
    text = 'Line ' + routeBus + ', got it. What is the stop ID?';
    sessionNow = 5;
    response.ask(text);
  }

  //User states train route but no stop. "Get arrivals for orange line."
  else if (routeBus == null && routeTrain != null && stop == null){
    text = 'The ' + routeTrain + ' line, got it. What is the stop ID?';
    sessionNow = 5;
    response.ask(text);
  }

  //User states bus route and stop. "Get arrivals for line 35 at 1234."
  else if (routeBus != null && routeTrain == null && stop != null){
    text = 'Bus line ' + routeBus + ' will arrive in 5 minutes at stop ' + stop;
    response.tellWithCard(text, text, text);
  }

  //User states train route and stop. "Get arrivals for orange line at 1234."
  else if (routeBus == null && routeTrain != null && stop != null){
    text = 'The ' + routeTrain + ' line will arrive in 5 minutes at stop ' + stop;
    response.tellWithCard(text, text, text);
  }

  // getArrivalsJSON(intent.slots.bus.value, function(data){
  // 	console.log(data);
  //   if(data.resultSet){
  //     var text = data
  //                 .resultSet
  //                 .location[0]
  //                 .desc;

  //     var cardText = 'The next bus is: ' + text;
  //   } else {
  //     var text = 'That bus stop does not exist.'
  //     var cardText = text;
  //   }

  //   var heading = 'Next bus for stop: ' + intent.slots.bus.value;
  //   response.tellWithCard(text, heading, cardText);
  // });
};

//Alerts Request
var handleAlertsRequest = function(intent, session, response){
	var routeBus = intent.slots.routeBus.value;
	var routeTrain = intent.slots.routeTrain.value;

	var text = '';

	if (routeBus == null && routeTrain == null){
		text = 'For what line would you like alerts for?';
		sessionNow = 1;
		response.ask(text);
	}
	else if (routeBus == null && routeTrain != null){
		text = 'There are no alerts for the ' + routeTrain + ' line';
		response.tellWithCard(text, text, text);
	}
	else if (routeBus != null && routeTrain == null){
		text = 'There are no alerts for bus line ' + routeBus;
		response.tellWithCard(text, text, text);
	}
};

//Info Request
var handleInfoRequest = function(intent, session, response){
	var routeTrain = intent.slots.routeTrain.value;
	var infoNumber = intent.slots.infoNumber.value;
	var text = '';

	if (sessionNow == 0){
		text = 'I didnt quite get that. You can say, get arrivals or get alerts.';
		response.ask(text);
	}

	else if (sessionNow == 1){
		if (routeTrain == null && infoNumber != null){
			text = 'There are no alerts for bus line ' + infoNumber;
			response.tellWithCard(text, text, text);
		}
		else if (routeTrain != null && infoNumber == null){
			text = 'There are no alerts for the ' + routeTrain + ' line';
			response.tellWithCard(text, text, text);
		}
	}

  //get stop for arrivals
  else if (sessionNow == 3){
    if (routeTrain == null && infoNumber != null){
      text = 'Got it! Please state a stop id for bus line ' + infoNumber;
      sessionNow = 5;
      route = infoNumber;
      response.ask(text);
    }
    else if (routeTrain != null && infoNumber == null){
      text = 'Got it! Please state a stop id for the ' + routeTrain + ' line';
      sessionNow = 5;
      route = routeTrain;
      response.ask(text);
    }
  }

  //speak arrivals
  else if (sessionNow == 5){
    if (infoNumber != null && route != null){
      text = 'The ' + route + ' will arrive in 5 minutes at stop ' + infoNumber;
      response.tellWithCard(text, text, text);
    }
    else {
      text = 'I didnt quite get that. What is the stop id?';
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
    'Would you like to get TriMet arrivals or alerts?';

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