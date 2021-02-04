sap.ui.define([
	"cbc/co/simulador_costos/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/core/EventBus",
	"sap/m/MessageBox"	
], function (Controller, JSONModel, History, MessageToast, EventBus, MessageBox) {
	"use strict";

	var oPageController = Controller.extend("cbc.co.simulador_costos.controller.Utilities.FormuladoraMaterial", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf cbc.co.simulador_costos.view.FormuladoraMaterial
		 */
		onInit: function () {
			//var oModel = new JSONModel(jQuery.sap.getModulePath("cbc.co.simulador_costos", "/dataFormuladora.json"));

			var myRoute = this.getOwnerComponent().getRouter().getRoute("rtChFormuladoraMaterial");
			myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);

			var bus = sap.ui.getCore().getEventBus();
			//const bus = this.getOwnerComponent().getEventBus();
			// 1. ChannelName, 2. EventName, 3. Function to be executed, 4. Listener
			bus.subscribe("GridAdminFormuladoraChannel", "onNavigateEvent", this.onDataReceived, this);			

		},
		
		onMyRoutePatternMatched: function (event) {
			// your code when the view is about to be displayed ..

			this.oIdMaterial = event.getParameter("arguments").oIdMaterial;
			this.oSociedad = event.getParameter("arguments").oSociedad;
			this.oCentro = event.getParameter("arguments").oCentro;
			this.oYear = event.getParameter("arguments").oYear;
			this.oMes = event.getParameter("arguments").oMes;
			this.oIdFormula = event.getParameter("arguments").oIdFormula;
			this.oTxtFormula = event.getParameter("arguments").oTxt;


			this.oTxtFormula = decodeURIComponent(this.oTxtFormula); 
			
			if (this.oTxtFormula === "0"){
				this.oTxtFormula = "";
			}

			var oTitle = "Id Material:" + this.oIdMaterial +
					     " - Sociedad:" + this.oSociedad +
					     " - Centro:" + this.oCentro +
					     " - A\u00F1o:" + this.oYear +
					     " - Mes:" + this.oMes;

			var oModel = new JSONModel();
			
			var oCalcData = {
				"expression": this.oTxtFormula,
				"title": oTitle,
				"showToolbar": false,
				"variables": [
					
					{
						"key": "PrecioProductivo",
						"label": "Precio Productivo"
					},
					{
						"key": "CostoConversion",
						"label": "Costo Conversion"
					},
					{
						"key": "CostoEnvio",
						"label": "Costo Envio"
					},
					{
						"key": "CostoMaterial",
						"label": "Costo Material"
					}					
				]
			};

			oModel.setData(oCalcData);
			
			this.getView().setModel(oModel);
			
			this._oBuilder = this.getView().byId("builder");

			this._oModelSettings = new JSONModel({
				expression: this.oTxtFormula,
				layoutType: "VisualOnly",
				showInputToolbar: false,
				allowComparison: false,
				allowComparisonOperators: false,
				allowLogical: false,
				readOnly: false
			});
			this.getView().setModel(this._oModelSettings, "settings");

			this._oBuilder.setShowInputToolbar(true);

		},		
		
		/**
		 * Open calculator
		 * @function
		 * @param 
		 * @private
		 */		
		onDataReceived: function (channel, event, data) {
			// do something with the data (bind to model)
			//console.log(JSON.stringify(data));

			this.oIdCommoditie = data.oIdCommoditie;
			this.oIdFormula = data.oIdFormula;
			this.oTxtFormula = data.oTxtFormula;

			var oDataModel = new sap.ui.model.json.JSONModel(data);

			var oTitle = "Id Commoditie:" + this.oIdCommoditie ;

			var oBuilder = this.getView().byId("builder");

			this.getOwnerComponent().setModel(oDataModel, "Formuladora");

			//	oBuilder.setProperty("title", oTitle);
			//	oBuilder.setProperty("expression", this.oTxtFormula);

			//disabledDefaultTokens="abs;sqrt;roundup;rounddown;round"
			// oBuilder.getModel().setProperty("title", oTitle);	
			// oBuilder.getModel().setProperty("expr", this.oTxtFormula);
			// oBuilder.getModel().refresh(); 

		},
		
		/**
		 * Return page
		 * @function
		 * @param 
		 * @private
		 */		
		onToPage1: function (oEvent) {

			var sPreviousHash = History.getInstance().getPreviousHash();

			//The history contains a previous entry
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				// There is no history!
				// replace the current hash with page 1 (will not add an history entry)
				this.getOwnerComponent().getRouter().navTo("rtChCommodities", null, true);
			}
		}		

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf cbc.co.simulador_costos.view.FormuladoraMaterial
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf cbc.co.simulador_costos.view.FormuladoraMaterial
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf cbc.co.simulador_costos.view.FormuladoraMaterial
		 */
		//	onExit: function() {
		//
		//	}

	});
	return oPageController;
});