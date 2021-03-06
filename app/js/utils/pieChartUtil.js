module.exports = function(wattTimeData, utilityData){
  var greenBound, yellowBound;
  var yellowTimes = [];
  var greenTimes = [];
  var redTimes = [];

  // Count UtilityAPI datapoints that fall within each time bracket
  var greenCount = 0;
  var yellowCount = 0;
  var redCount = 0;

  var greenKwh = 0;
  var yellowKwh = 0;
  var redKwh = 0;

  function sortByTimestamp(a,b) {
    var dateA = new Date(a.timestamp);
    var dateB = new Date(b.timestamp);
    if (dateA < dateB)
      return -1;
    if (dateA > dateB)
      return 1;
    return 0;
  }
  
  var getCarbonRange = function(wattTimeData){
    var min = Number.POSITIVE_INFINITY;
    var max = Number.NEGATIVE_INFINITY;
    for(var i = 0; i < wattTimeData.length; i++){
      if(wattTimeData[i].carbon !== null && wattTimeData[i].carbon > max){
        max = wattTimeData[i].carbon;
      }
      else if(wattTimeData[i].carbon !== null && wattTimeData[i].carbon < min){
        min = wattTimeData[i].carbon;
      }
    }
    return [min, max];
  };

  var getBin = function(carbon){
    if(carbon <= greenBound){
      return 'green';
    }
    else if(carbon > greenBound && carbon <= yellowBound){
      return 'yellow';
    }
    else {
      return 'red';
    }
  };

  var computeBrackets = function(wattTimeData, greenBound, yellowBound){
    var currentBin = null;
    var currentBracket = null;
    for(var i = 0; i < wattTimeData.length; i++){
      if(currentBin === null){
        currentBracket = [null, null];
        currentBracket[0] = wattTimeData[i].timestamp;
        currentBin = getBin(wattTimeData[i].carbon);
      }
      else if(getBin(wattTimeData[i].carbon) !== currentBin || i === wattTimeData.length-1){
        currentBracket[1] = wattTimeData[i].timestamp;
        if(currentBin === 'green'){
          greenTimes.push(currentBracket);
        }
        else if(currentBin === 'yellow'){
          yellowTimes.push(currentBracket);
        }
        else{
          redTimes.push(currentBracket);
        }
        currentBin = null;
      }
    }
  };

  var countUtilityApiPoints = function(utlityApiData){
    for(var i = 0; i < utlityApiData.length; i++){
      var intervalTime = new Date(utlityApiData[i].interval_start);
      var foundTime = false;

      if(!foundTime){
        for(var j = 0; j < greenTimes.length; j++){
          var greenStartTime = new Date(greenTimes[j][0]);
          var greenEndTime = new Date(greenTimes[j][1]);

          if(intervalTime > greenStartTime && intervalTime < greenEndTime){
            greenCount++;
            greenKwh += utlityApiData[i].interval_kWh;
            foundTime = true;
          }
        }
      }
      if(!foundTime){
        for(var k = 0; k < yellowTimes.length; k++){
          var yellowStartTime = new Date(yellowTimes[k][0]);
          var yellowEndTime = new Date(yellowTimes[k][1]);
          if(intervalTime > yellowStartTime && intervalTime < yellowEndTime){
            yellowCount++;
            yellowKwh += utlityApiData[i].interval_kWh;
            foundTime = true;
          }
        }
      }
      else {
        redCount++;
        redKwh += utlityApiData[i].interval_kWh;
      }
      
    }

    // Round here to avoid ridiculous numbers because JavaScript
    redKwh = Math.round(redKwh * 100) / 100;
    yellowKwh = Math.round(yellowKwh * 100) / 100;
    greenKwh = Math.round(greenKwh * 100) / 100;
  };

  var range = getCarbonRange(wattTimeData);
  var sortedWattTime = wattTimeData.sort(sortByTimestamp);
  var oneThirdRange = ((range[1] - range[0])/3);
  
  greenBound = range[0] + oneThirdRange;
  yellowBound = greenBound + oneThirdRange;
  
  computeBrackets(sortedWattTime, greenBound, yellowBound);
  countUtilityApiPoints(utilityData);

  return ([{text: redKwh + ' kWh', quantity: redCount},
                            {text: yellowKwh + ' kWh', quantity: yellowCount},
                            {text: greenKwh + ' kWh', quantity: greenCount}
                            ]);
};