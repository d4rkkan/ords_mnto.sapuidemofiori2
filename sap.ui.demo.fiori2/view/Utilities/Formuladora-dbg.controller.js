sap.ui.define([
	"cbc/co/simulador_costos/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/core/EventBus",
	"sap/m/MessageBox"
], function (Controller, JSONModel, History, MessageToast, EventBus, MessageBox) {
	"use strict";

	var oPageController = Controller.extend("cbc.co.simulador_costos.controller.Utilities.Formuladora", {

		onInit: function () {
			//var oModel = new JSONModel(jQuery.sap.getModulePath("cbc.co.simulador_costos", "/dataFormuladora.json"));

			var myRoute = this.getOwnerComponent().getRouter().getRoute("rtChFromuladora");
			myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);

			//var bus = sap.ui.getCore().getEventBus();
			// 1. ChannelName, 2. EventName, 3. Function to be executed, 4. Listener
			//bus.subscribe("GridAdminFormuladoraChannel", "onNavigateEvent", this.onDataReceived, this);

		},
		onAfterRendering: function () {
				
		},

		onDataReceived: function (channel, event, data) {
			// do something with the data (bind to model)
			//console.log(JSON.stringify(data));

			// this.oIdCommoditie = data.oIdCommoditie;
			// this.oIdFormula = data.oIdFormula;
			// this.oTxtFormula = data.oTxtFormula;

			// var oDataModel = new sap.ui.model.json.JSONModel(data);

			// var oTitle = "Id Commoditie:" + this.oIdCommoditie ;

			// var oBuilder = this.getView().byId("builder");

			// this.getOwnerComponent().setModel(oDataModel, "Formuladora");


		},

		onMyRoutePatternMatched: function (event) {
			// your code when the view is about to be displayed ..

			var oBuilder = this.getView().byId("builder");
			oBuilder.setShowInputToolbar(true);
			oBuilder.destroyFunctions();
			oBuilder.removeAllFunctions();
			oBuilder.allowFunction("ABS", false);
			oBuilder.allowFunction("Round", false);
			oBuilder.allowFunction("RoundUp", false);
			oBuilder.allowFunction("RoundDown", false);
			oBuilder.allowFunction("SQRT", false);
			
			this.oIdCommoditie = event.getParameter("arguments").oIdCommoditie;
			this.oSociedad = event.getParameter("arguments").oSociedad;
			this.oCentro = event.getParameter("arguments").oCentro;
			this.oYear = event.getParameter("arguments").oYear;
			this.oMes = event.getParameter("arguments").oMes;
			this.oVersion = event.getParameter("arguments").oVersion;
			this.oIdFormula = event.getParameter("arguments").oIdFormula;
			this.oTxtFormula = event.getParameter("arguments").oTxt;


			this.oTxtFormula = decodeURIComponent(this.oTxtFormula); 
			
			if (this.oTxtFormula === "0"){
				this.oTxtFormula = " ";
			}

			var oTitle = "Id Commoditie:" + this.oIdCommoditie +
					     " - Sociedad:" + this.oSociedad +
					     " - Centro:" + this.oCentro +
					     " - A\u00F1o:" + this.oYear +
					     " - Mes:" + this.oMes +
					     " - Version:" + this.oVersion;

			var oModel = new JSONModel();
			
			var oCalcData = {
				"expression": this.oTxtFormula,
				"title": oTitle,
				"showToolbar": false,
				"layoutType": "VisualOnly",
				"showInputToolbar": false,
				"allowComparison": false,
				"allowComparisonOperators": false,
				"allowLogical": false,
				"readOnly": false,
				"variables": [
					{
						"key": "Precio",
						"label": "Precio"
					},
					{
						"key": "OtrosCostos",
						"label": "Otros Costos"
					},
					{
						"key": "PesoMaterial",
						"label": "Peso Material"
					}
					
				]
			};

			oModel.setData(oCalcData);
			this.getView().setModel(oModel);
			this.getView().getModel().refresh();
		},

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
		},

		saveFormula: function (oEvent) {
			var oModel = this.getView().getModel("ModelSimulador"),
				oBuilder = this.getView().byId("builder"),
				oBuilderData = oBuilder.getProperty("expression"),
				sServiceUrl = this.getView().getModel("ModelSimulador").sServiceUrl,
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true),	
		    	oEntidad = {};

			oEntidad = {
				IdCommoditie: this.oIdCommoditie,
				Sociedad: this.oSociedad,
				Centro: this.oCentro,
				Fotrcost: this.oIdFormula,
				Txtlg: oBuilderData,
				Year: this.oYear,
				Mes: this.oMes,
				Version: this.oVersion
			};
			
			
			//Crea el Commoditie
			
			var oCreate = this.fnCreateEntity(oModelService, "/formuladoraSet", oEntidad);

			if (oCreate.tipo === 'S') {
				this.oIdFormula = oCreate.datos.Fotrcost;
				var oTitle = "Id Commoditie:" + this.oIdCommoditie + " - Id Formula:" + this.oIdFormula;
				oBuilder.getModel().setProperty("title", oTitle);	
				
				MessageBox.show(
					'Datos guardados correctamente', {
						icon: MessageBox.Icon.SUCCESS,
						title: "Exito",
						actions: [MessageBox.Action.OK],
						onClose: function (oAction) {
							if (oAction === sap.m.MessageBox.Action.OK) {
								return;
							}
						}
					}
				);

			} else if (oCreate.tipo === 'E') {

				MessageBox.show(
					oCreate.msjs, {
						icon: MessageBox.Icon.ERROR,
						title: "Error"
							// actions: [MessageBox.Action.YES, MessageBox.Action.NO],
							// onClose: function (oAction) {
							// 	/ * do something * /
							// }
					}
				);

			}
			
		 
		},

		layoutTypeChanged: function (oEvent) {
			var sKey = oEvent.getSource().getProperty("selectedKey");
			this._oBuilder.setShowInputToolbar(sKey === "TextualOnly");
		},
		handleChange: function (oEvent) {
			var oItem = oEvent.getSource().getSelectedItem(),
				oData = oItem.getCustomData(),
				sKey = oData[0].getKey();

			this.getView().byId("builder").updateOrCreateItem(sKey);
		},
		setSelection: function (oEvent) {
			var oList = this.getView().byId("Tree"),
				sKey = oEvent.getParameter("key");

			if (!sKey) {
				var oSelectedItemInVariablesList = oList.getSelectedItem();
				if (oSelectedItemInVariablesList) {
					oList.setSelectedItem(oSelectedItemInVariablesList, false);
				}
			} else {
				var aItems = oList.getItems();
				for (var k = 0; k < aItems.length; k++) {
					var oItem = aItems[k],
						sItemKey = aItems[k].getCustomData()[0].getValue();

					if (sKey === sItemKey) {
						oList.setSelectedItem(oItem, true);
						return;
					}
				}
			}

		}
	});

	return oPageController;
});