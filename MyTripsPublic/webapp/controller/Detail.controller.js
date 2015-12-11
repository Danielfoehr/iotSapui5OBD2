/*global location */
sap.ui.define([
	"Vorlage/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"Vorlage/model/formatter",
	'sap/m/MessageToast'
], function(BaseController, JSONModel, formatter,MessageToast) {
	"use strict";
	var detailPage;
	var controllerReference;
	var initialGeoPosition="";
	var long;
	var lat;
	
	
	return BaseController.extend("Vorlage.controller.Detail", {
		
		formatter: formatter,
		

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			
			jQuery.sap.require("sap.ui.core.IconPool");
			jQuery.sap.require("sap.viz.ui5.data.FlattenedDataset");
			jQuery.sap.require("sap.ui.vbm.GeoMap");
		
		
			detailPage = this.byId("page");
			
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

		
			
			controllerReference = this;

		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 *Consume XSJS service to get detail trip data. 
		 *Create content for views defined in detail.view.xml.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			
			var Args =	oEvent.getParameter("arguments");
			MessageToast.show(Args.AddParameter); 
			
			var data = {
				    TripID: Args.AddParameter
				};
		
	     	var oTripIDModel = new sap.ui.model.json.JSONModel(data);
			var detailPageCore = this.byId("page");//you can get view by ID from every part in controller
			detailPageCore.setModel(oTripIDModel);


//Get Detail Data with ajax


			//replace  <yourAccountId>
			var aUrl = "https://s9hanaxs.hanatrial.ondemand.com/<yourAccountId>trial/iot/ODBService.xsjs?cmd=retrieveDetailData&TRIPID="+Args.AddParameter ;
			
			jQuery.ajax({
					url: aUrl,
					method: 'GET',
					dataType: 'JSON',
					success: function(Result) { 
						
				/*	"C_TDISTANCE": "330",
				      "C_DURATION": "3 hours and 5 minutes",
				      "C_STARTTIME": "1:45 am",
				      "C_ENDTIME": "4:51 am",
				      "C_FUELCONSUMED": "13",
				      "C_AVGSPEED": "52",
				      "C_AVGACCELERATION": "32",
				      "C_GEAR": "2.6",
				      "C_TAVGSPEED": "50.83333333333333333333333333333333",
				      "C_TAVGACCELERATION": "30.83333333333333333333333333333333",
    					"C_TGEAR": "2.25"*/
    				 
						
					  controllerReference._setUpControls(Result);

	},
				
					error: function(jqXHR, textStatus, errorThrown) { 
						
						jQuery.get("../testdataDetail.json", function(data) {
						controllerReference._setUpControls(data);
						});
						
					
					

					}
			});



		//paralell get GPS Positions

		var aUrl = "https://s9hanaxs.hanatrial.ondemand.com/<yourAccountId>trial/iot/ODBService.xsjs?cmd=retrieveDetailGPSPositions&TRIPID="+Args.AddParameter ;

		jQuery.ajax({
					url: aUrl,
					method: 'GET',
					dataType: 'JSON',
					success: function(Result) { 
						
				/*	
					{
					  "results": [
					    {
					      "C_GPSPOSITION": "40.748440, -73.984559"
					    },
					    {
					      "C_GPSPOSITION": "40.748440, -73.984559"
					    },
					    {
					      "C_GPSPOSITION": "40.748440, -73.984559"
					    },
					    {
					      "C_GPSPOSITION": "40.748440, -73.984559"
					    },
					    {
					      "C_GPSPOSITION": "40.748440, -73.983559"
					    }
					  ]
					}*/
    				 
						
					  controllerReference._setUpGeoMap(Result,Args.AddParameter);

	},
				
					error: function(jqXHR, textStatus, errorThrown) { 
						
						jQuery.get("../testdataGPS.json", function(data) {
							
						   	
						   	
						   	controllerReference._setUpGeoMap(data,Args.AddParameter);
						});
						
					
					

					}
			});

		},
		
		/**
		 * Method to create and set all the content for the views defined in detail.view.xml
		 * Parameter: detailResult : JSON from XSJS service inheriting the car data from hana
		 * 
		 */
		_setUpControls: function(detailResult) {
			
		//Creating numeric content for Distance
			
			var distance = new  sap.suite.ui.commons.NumericContent();
			distance.setTruncateValueTo(5);
			distance.setValue((detailResult.C_TDISTANCE));
			distance.setValueColor("Good");
			distance.setSize("Auto");
			distance.setWidth("100%");
								
			var tileContentDistance = this.byId("tileContentDistance");
			tileContentDistance.setContent(distance);
			
			
//Creating numeric content for Duration
			
			var duration = new  sap.suite.ui.commons.NumericContent();
			
			duration.setValue(detailResult.C_DURATION);
		
			duration.setSize("Auto");
			duration.setWidth("100%");
								
			var tileContentDuration = this.byId("tileContentDuration");
			
			tileContentDuration.setContent(duration);
			
			
//Creating numeric content for Start Time
			
			var startTime = new  sap.suite.ui.commons.NumericContent();
			startTime.setTruncateValueTo(5);
			startTime.setValue((detailResult.C_STARTTIME));
			
			startTime.setSize("Auto");
			startTime.setWidth("100%");
								
			var tileContentStartTime = this.byId("tileContentStartTime");
			
			
				//Determine if its am or pm
			
			if(detailResult.C_STARTTIME.indexOf("am") > -1 ){
			tileContentStartTime.setUnit("am");
			} else {
			tileContentStartTime.setUnit("pm");
			}
	
			tileContentStartTime.setContent(startTime);
			
//Creating numeric content for content for End Time
			
			var endTime = new  sap.suite.ui.commons.NumericContent();
			endTime.setTruncateValueTo(5);
			endTime.setValue((detailResult.C_ENDTIME));
		
			endTime.setSize("Auto");
			endTime.setWidth("100%");
								
			var tileContentEndTime = this.byId("tileContentEndTime");
			
			
				//Determine if its am or pm
			
			if(detailResult.C_ENDTIME.indexOf("am") > -1 ){
			tileContentEndTime.setUnit("am");
			} else {
			tileContentEndTime.setUnit("pm");
			}
	
			tileContentEndTime.setContent(endTime);
			
//Creating numeric content for Fuel Consumed
					
			var fuelCost = new  sap.suite.ui.commons.NumericContent();
			fuelCost.setTruncateValueTo(5);
		
			fuelCost.setValue((detailResult.C_FUELCONSUMED));
			fuelCost.setSize("Auto");
			fuelCost.setWidth("100%");
								
			var	tileContentFuelConsumed = this.byId("tileContentFuelConsumed");
			
			tileContentFuelConsumed.setContent(fuelCost);		
			
//Creating numeric content for fuel cost
			
		//Used YQL (google it- worth it!) to get live average gallon price of california from www.gasbuddy.com
		var gasPriceWebsite = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Fwww.gasbuddy.com%2FUS%22%20and%20xpath%3D'%2F%2Fdiv%5B%40id%3D%22searchItems%22%5D%2Fdiv%5Blast()-1%5D%2Fdiv%2Fdiv%5B%40class%20%3D%22col-sm-2%20col-xs-3%20text-right%22%5D%2Ftext()'&format=json&diagnostics=true&callback=";
		jQuery.ajax({
					url: gasPriceWebsite,
					method: 'GET',
					dataType: 'JSON',
					success: function(Result) { 
				
					var californiaGasPricePerGallon = Result.query.results;	
					controllerReference._setUpFuelCostControl(parseFloat(californiaGasPricePerGallon),parseFloat(detailResult.C_FUELCONSUMED));

	},
					error: function(jqXHR, textStatus, errorThrown) { 
						   	//just take a random :)
						   	controllerReference._setUpFuelCostControl(2.5,parseFloat(detailResult.C_FUELCONSUMED));
					}
			});
			
					
			
//Creating Column Micro Chart for Average Gear
			
			var thisTripColor;
			var totalTripColor;
			
			var microChartControl = new sap.suite.ui.commons.ColumnMicroChart();
			
			//determine colors
			
			if(parseFloat(detailResult.C_GEAR) > parseFloat(detailResult.C_TGEAR)){
				thisTripColor = "Good";
				totalTripColor = "Error";
			}
			else {
				 totalTripColor = "Good";
				 thisTripColor = "Error";
			}
			
			
			
						 var leftBottomLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 leftBottomLabel.setLabel("This Trip");
						 leftBottomLabel.setColor(thisTripColor);
						 
						 var leftTopLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 leftTopLabel.setLabel(detailResult.C_GEAR);
						 leftTopLabel.setColor(thisTripColor);
						 
						 var rightBottomLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 rightBottomLabel.setLabel("Total Average");
						 rightBottomLabel.setColor(totalTripColor);
						 
						 var rightTopLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 rightTopLabel.setLabel(detailResult.C_TGEAR);
						 rightTopLabel.setColor(totalTripColor);
			 
			 
			microChartControl.setLeftBottomLabel(leftBottomLabel);
			microChartControl.setLeftTopLabel(leftTopLabel);
			microChartControl.setRightBottomLabel(rightBottomLabel);
			microChartControl.setRightTopLabel(rightTopLabel);
			
			microChartControl.addStyleClass("marginTopLeft");
			
			microChartControl.setSize("Auto");
			

			
			var columnData = new sap.suite.ui.commons.ColumnData();
			
			columnData.setValue(parseInt(detailResult.C_GEAR));
			columnData.setColor(thisTripColor);
			
			var columnData2 = new sap.suite.ui.commons.ColumnData();
			
			columnData2.setValue(parseInt(detailResult.C_TGEAR));
			columnData2.setColor(totalTripColor);
			
			
			microChartControl.addColumn(columnData);
			microChartControl.addColumn(columnData2);
			
			var testTileContent = this.byId("tileContentGear");
			
			testTileContent.setContent(microChartControl);
		
//Creating Column Micro Chart for Average Speed
			
			
			
			var microChartControlSpeed = new sap.suite.ui.commons.ColumnMicroChart();
			
			if(parseFloat(detailResult.C_AVGSPEED) > parseFloat(detailResult.C_TAVGSPEED)){
				thisTripColor = "Good";
				totalTripColor = "Error";
			}
			else {
				 totalTripColor = "Good";
				 thisTripColor = "Error";
			}
			
			
						 var leftBottomLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 leftBottomLabel.setLabel("This Trip");
						 leftBottomLabel.setColor(thisTripColor);
						 
						 var leftTopLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 leftTopLabel.setLabel(detailResult.C_AVGSPEED) ;
						 leftTopLabel.setColor(thisTripColor);
						 
						 var rightBottomLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 rightBottomLabel.setLabel("Total Average");
						 rightBottomLabel.setColor(totalTripColor);
						 
						 var rightTopLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 rightTopLabel.setLabel(detailResult.C_TAVGSPEED);
						 rightTopLabel.setColor(totalTripColor);
			 
			 
			microChartControlSpeed.setLeftBottomLabel(leftBottomLabel);
			microChartControlSpeed.setLeftTopLabel(leftTopLabel);
			microChartControlSpeed.setRightBottomLabel(rightBottomLabel);
			microChartControlSpeed.setRightTopLabel(rightTopLabel);
			
			microChartControlSpeed.addStyleClass("marginTopLeft");
			
			microChartControlSpeed.setSize("Auto");
			

			
			var columnData = new sap.suite.ui.commons.ColumnData();
			
			columnData.setValue(parseInt(detailResult.C_AVGSPEED));
			columnData.setColor(thisTripColor);
			
			var columnData2 = new sap.suite.ui.commons.ColumnData();
			
			columnData2.setValue(parseInt(detailResult.C_TAVGSPEED));
			columnData2.setColor(totalTripColor);
			
			
			microChartControlSpeed.addColumn(columnData);
			microChartControlSpeed.addColumn(columnData2);
			
			var tileContentSpeed = this.byId("tileContentSpeed");
			
			tileContentSpeed.setContent(microChartControlSpeed);
					
//Creating Column Micro Chart for Average Acceleration
			
			
			
			var microChartControlAcc = new sap.suite.ui.commons.ColumnMicroChart();
			
			if(parseFloat(detailResult.C_AVGACCELERATION) < parseFloat(detailResult.C_TAVGACCELERATION)){
				thisTripColor = "Good";
				totalTripColor = "Error";
			}
			else {
				 totalTripColor = "Good";
				 thisTripColor = "Error";
			}
			
						 var leftBottomLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 leftBottomLabel.setLabel("This Trip");
						 leftBottomLabel.setColor(thisTripColor);
						 
						 var leftTopLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 leftTopLabel.setLabel(detailResult.C_AVGACCELERATION);
						 leftTopLabel.setColor(thisTripColor);
						 
						 var rightBottomLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 rightBottomLabel.setLabel("Total Average");
						 rightBottomLabel.setColor(totalTripColor);
						 
						 var rightTopLabel = new sap.suite.ui.commons.ColumnMicroChartLabel();
						 rightTopLabel.setLabel(detailResult.C_TAVGACCELERATION);
						 rightTopLabel.setColor(totalTripColor);
			 
			 
			microChartControlAcc.setLeftBottomLabel(leftBottomLabel);
			microChartControlAcc.setLeftTopLabel(leftTopLabel);
			microChartControlAcc.setRightBottomLabel(rightBottomLabel);
			microChartControlAcc.setRightTopLabel(rightTopLabel);
			
			microChartControlAcc.addStyleClass("marginTopLeft");
			
			microChartControlAcc.setSize("Auto");
			

			
			var columnData = new sap.suite.ui.commons.ColumnData();
			
			columnData.setValue(parseInt(detailResult.C_AVGACCELERATION));
			columnData.setColor(thisTripColor);
			
			var columnData2 = new sap.suite.ui.commons.ColumnData();
			
			columnData2.setValue(parseInt(detailResult.C_TAVGACCELERATION));
			columnData2.setColor(totalTripColor);
			
			
			microChartControlAcc.addColumn(columnData);
			microChartControlAcc.addColumn(columnData2);
			
			var tileContentAcc = this.byId("tileContentAcc");
			
			tileContentAcc.setContent(microChartControlAcc);			
			
		},

	/**
	 * Method which transforms the retreived gps positions from the XSJS service and sets the data to tthe geoMap in the detail page
	 * */
	_setUpGeoMap: function(gpsData,TripId) {
		
		/*	GPS result data from Ajax call
					{
					  "results": [
					    {
					      "C_GPSPOSITION": "9.983360000;53.550240000"
					    },
					    {
					      "C_GPSPOSITION": "9.983360000;53.550240000"
					    },
					    {
					      "C_GPSPOSITION": "9.984230000;53.550220000"
					    },
					    {
					      "C_GPSPOSITION": "9.983920000;53.549400000"
					    },
					    {
					      "C_GPSPOSITION": "9.983400000;53.548450000"
					    }
					  ]
					}*/
					
	
			var gpsPosition = "";
			for (var i=0; i<gpsData["results"].length; i++) {
				
				if (i === 0){
					gpsPosition = gpsData.results[i].C_GPSPOSITION + ";0"	;
				}else {
					gpsPosition = gpsPosition + ";" + gpsData.results[i].C_GPSPOSITION + ";0"	;
				}
			}		
		
		/* output format for geo map
		
		// Longigtude;Latitude;0;...;0"  
		//"9.983360000;53.550240000;0;9.983360000;53.550240000;0;9.984230000;53.550220000;0;9.983920000;53.549400000;0;9.983400000;53.548450000;0"
		//"9.983360000;53.550240000;0;9.983360000,53.550240000;0;9.984230000,53.550220000;0;9.983920000,53.549400000;0;9.983400000,53.548450000;0" */
		
		
			var route = this.byId("Route");
			
			route.setLabelText("Trip \""+ TripId + "\"" )	;
			
		
			route.setPosition(gpsPosition);
			
		var array = gpsData.results[0].C_GPSPOSITION.toString().split(";");
		long = array[0];
		lat = array[1];
	},
	
	onContextMenuGeo: function(){
	//called when long pressed on geo map		
		var map = controllerReference.byId("map");
		map.zoomToGeoPosition(long,lat,10);
	},	  
		  
	/**
	 * Sets the content to the fuelCOst control defined in detail.view.xml 
	 */
	_setUpFuelCostControl: function(gallonPrice,fuelConsumed){
		
		var fuelCost = new  sap.suite.ui.commons.NumericContent();
			fuelCost.setTruncateValueTo(5);
			
			//Get gallon prize from the web! -> for now just calc with fixed value
			
			fuelCost.setValue((fuelConsumed * gallonPrice));
			fuelCost.setValueColor("Error");
			fuelCost.setSize("Auto");
			fuelCost.setWidth("100%");
								
			var tileContentFuelCost = this.byId("tileContentFuelCost");
			
			tileContentFuelCost.setContent(fuelCost);		
	}
	
	});

});