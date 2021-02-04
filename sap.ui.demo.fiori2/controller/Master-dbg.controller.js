sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/fiori2/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/m/MessageBox',
	'sap/f/library'
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, fioriLibrary) {
	"use strict";

	var that = this;
	
	return Controller.extend("sap.ui.demo.fiori2.controller.Master", {
		onInit: function () {
			this.oView = this.getView();
			this._bDescendingSort = false;
			this.oProductsTable = this.oView.byId("productsTable");
			this.oRouter = this.getOwnerComponent().getRouter();
		
			
			
			this.oRouter.getRoute("master").attachPatternMatched(this._onOrderMatched, this);
			
		},

		_onOrderMatched: function(){
			
			var oPanel = this.getView();
			oPanel.setBusy(true);
			
			//Url Servicio
			var oModel = this.getOwnerComponent().getModel("ModelOrdenes");
			var sServiceUrl = oModel.sServiceUrl;

			//Definir modelo del servicio web
			var oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

			var vFilterEntity = "/OrdenesSet";
			
			//Leer datos del ERP
			var oRead = this.fnReadEntity(oModelService, vFilterEntity);

			if (oRead.tipo === "S") {
				this.oDataDetalleOrders = oRead.datos.results;
			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			var oDataDetalleOrders = "";
			//SI el modelo NO existe, se crea.
			if (!oDataDetalleOrders) {
				oDataDetalleOrders = {
					lstItemsOrders: []
				};
			}

			oDataDetalleOrders.lstItemsOrders = this.oDataDetalleOrders;

			var oTablaDetalleOrders = this.byId("ordersTable");
			var oModel2 = new sap.ui.model.json.JSONModel(oDataDetalleOrders);
			oTablaDetalleOrders.setModel(oModel2);
			oPanel.setBusy(false);
			
		},
		
		onSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("Name", FilterOperator.Contains, sQuery)];
			}

			this.oProductsTable.getBinding("items").filter(oTableSearchState, "Application");
		},

		onAdd: function () {
			MessageBox.information("This functionality is not ready yet.", {title: "Aw, Snap!"});
		},

		onSort: function () {
			this._bDescendingSort = !this._bDescendingSort;
			var oBinding = this.oProductsTable.getBinding("items"),
				oSorter = new Sorter("Name", this._bDescendingSort);

			oBinding.sort(oSorter);
		},

		onListItemPress: function (oEvent) {
			var oItem = oEvent.getSource();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			var orderPath = oEvent.getSource().getBindingContext().getPath(),
				orderPathItem = orderPath.split("/").slice(-1).pop(),
				orden = oEvent.getSource().getBindingContext().getModel().getData().lstItemsOrders[orderPathItem].IdOrden;

			oRouter.navTo("detail", {layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded, orden: orden});
		}
	});
});
