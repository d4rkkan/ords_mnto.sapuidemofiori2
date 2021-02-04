sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/fiori2/controller/BaseController",
	'sap/m/MessageBox',
	"sap/m/MessageToast"
], function (JSONModel, Controller, MessageBox, MessageToast) {
	"use strict";

	return Controller.extend("sap.ui.demo.fiori2.controller.DetailDetail", {
		onInit: function () {
			var oOwnerComponent = this.getOwnerComponent();

			this.oRouter = oOwnerComponent.getRouter();
			this.oModel = oOwnerComponent.getModel();

			// this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onPatternMatch, this);
			// this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatch, this);
			// this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatch, this);
			this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onPatternMatch, this);
		},

		_onPatternMatch: function (oEvent) {

			sap.ui.core.BusyIndicator.show(0);
			
			var oTabBar = this.getView().byId("ictBar");
			oTabBar.setSelectedKey("Op");
			
			this._orden = oEvent.getParameter("arguments").orden || this._supplier || "0";
			this._operacion = oEvent.getParameter("arguments").operacion || this._product || "0";

			this.getOperationsData(this._orden, this._operacion);

			var oPanel = this.getView();
			oPanel.setBusy(true);

			//Url Servicio
			var oModel = this.getOwnerComponent().getModel("ModelOrdenes");
			var sServiceUrl = oModel.sServiceUrl;

			//Definir modelo del servicio web
			var oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

			var vFilterEntity = "/RepuestosSet?$filter=IdOrden eq '" + this._orden + "' and IdOperacion eq '" + this._operacion + "' ";

			//Leer datos del ERP
			var oRead = this.fnReadEntity(oModelService, vFilterEntity);

			if (oRead.tipo === "S") {
				this.oDataRepuestos = oRead.datos.results;
			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			var oDataRepuestos = "";
			//SI el modelo NO existe, se crea.
			if (!oDataRepuestos) {
				oDataRepuestos = {
					lstItemsRepuestos: []
				};
			}

			oDataRepuestos.lstItemsRepuestos = this.oDataRepuestos;

			var oTablaRepuestos = this.byId("repuestosTable");
			var oModel2 = new sap.ui.model.json.JSONModel(oDataRepuestos);
			oTablaRepuestos.setModel(oModel2);

			oTablaRepuestos.getBinding("items").refresh();
			
			oPanel.setBusy(false);

			// this.getView().bindElement({
			// 	path: "/ProductCollectionStats/Filters/1/values/" + this._supplier,
			// 	model: "products"
			// });
		},

		getOperationsData: function (sOrderId, sOperation) {

			var oModel = this.getView().getModel("ModelOrdenes");

			var sKey = oModel.createKey("/OperacionesSet", {
				IdOrden: sOrderId,
				IdOperacion: sOperation
			});

			oModel.read(sKey, {
				success: jQuery.proxy(this.mapOperationData, this),
				error: jQuery.proxy(this.onError, this)
			});

		},

		mapOperationData: function (oData, response) {
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel, "detOperation");
			sap.ui.core.BusyIndicator.hide();
		},

		onError: function (oError) {
			sap.ui.core.BusyIndicator.hide();
		},

		onPressGuardarRepuestos: function (oEvent) {

			var sText = "";
			var sTabId = this.getView().byId("ictBar").getSelectedKey();

			if (sTabId === "Op") {

				sText = "Esta seguro que desea guardar los tiempos de las operaciones?";

			} else {
				sText = "Esta seguro que desea guardar la información de repuestos ?";
			}

			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.confirm(
				sText, {
					styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: function (sButton) {
						if (sButton === MessageBox.Action.OK) {
							sap.ui.core.BusyIndicator.show(0);

							if (sTabId === "Op") {
								this.saveOperationDetail();
							} else {
								this.saveRepuestos();
							}

						}
					}.bind(this)
				}
			);
		},

		saveRepuestos: function () {
			var oTable = this.getView().byId("repuestosTable");
			var aSelectedItems = oTable.getSelectedItems();
			var bLast = false;

			var oModelSrc = this.getView().getModel("ModelOrdenes");

			if (!aSelectedItems.length) {
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.confirm(
					"Por favor seleccione por lo menos un repuesto", {
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function (sButton) {
							if (sButton === MessageBox.Action.OK) {
								sap.ui.core.BusyIndicator.hide();
							}
						}.bind(this)
					}
				);
			}

			for (var i = 0; i < aSelectedItems.length; i++) {

				var oJsonData = aSelectedItems[i].getBindingContext().getObject();

				if ((i + 1) === aSelectedItems.length) {
					bLast = true;
				}

				oModelSrc.create("/RepuestosSet", oJsonData, {
					success: jQuery.proxy(this.successSaveRep, this, bLast),
					error: jQuery.proxy(this.onError, this)
				});

			}

		},

		successSaveRep: function (bLast, oData, response) {
			if (bLast) {
				sap.ui.core.BusyIndicator.hide();
				MessageToast.show("Se han guardado la información de repuestos exitosamente");
				this.onNavBack();
			}
		},

		saveOperationDetail: function () {
			var oView = this.getView();
			var oModelSrc = oView.getModel("ModelOrdenes");

			var oModelForm = oView.getModel("detOperation");
			var oJsonForm = oModelForm.getProperty("/");

			oModelSrc.create("/OperacionesSet", oJsonForm, {
				success: jQuery.proxy(this.successSaveOp, this),
				error: jQuery.proxy(this.onError, this)
			});
		},

		successSaveOp: function (oData, response) {
			sap.ui.core.BusyIndicator.hide();
			MessageToast.show("Se han guardado las operaciones exitosamente");
			this.onNavBack();
		},

		handleLiveChange: function (oEvent) {
			var oTextArea = oEvent.getSource(),
				iValueLength = oTextArea.getValue().length,
				iMaxLength = oTextArea.getMaxLength(),
				sState = iValueLength > iMaxLength ? "Warning" : "None";

			oTextArea.setValueState(sState);
		},

		onExit: function () {
			this.oRouter.getRoute("detailDetail").detachPatternMatched(this._onPatternMatch, this);
		}
	});
});