sap.ui.define([
	"sap/ui/demo/fiori2/controller/BaseController",
	'sap/f/library',
	'sap/ndc/BarcodeScanner',
	'sap/m/MessageBox',
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, fioriLibrary, BarcodeScanner, MessageBox, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("sap.ui.demo.fiori2.controller.Detail", {
		onInit: function () {
			var oOwnerComponent = this.getOwnerComponent();
			
			//QRModel
			var oQrModel = new JSONModel({ Qr: false });
			this.getView().setModel(oQrModel,"Qr");
			
			this.oRouter = oOwnerComponent.getRouter();
			this.oModel = oOwnerComponent.getModel();

			// this.oRouter.getRoute("master").attachPatternMatched(this._onOrderMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onOrderMatched, this);
			// this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onOrderMatched, this);

		},

		_onOrderMatched: function (oEvent) {

			sap.ui.core.BusyIndicator.show(0);

			this._orden = oEvent.getParameter("arguments").orden || this._orden || "0";

			//obtiene info detalle
			this.getDataByOrder(this._orden);

			var oPanel = this.getView();
			oPanel.setBusy(true);

			//Url Servicio
			var oModel = this.getOwnerComponent().getModel("ModelOrdenes");
			var sServiceUrl = oModel.sServiceUrl;

			//Definir modelo del servicio web
			var oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

			var vFilterEntity = "/OperacionesSet?$filter=IdOrden eq '" + this._orden + "'";

			//Leer datos del ERP
			var oRead = this.fnReadEntity(oModelService, vFilterEntity);

			if (oRead.tipo === "S") {
				this.oDataOperaciones = oRead.datos.results;
			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			var oDataOperaciones = "";
			//SI el modelo NO existe, se crea.
			if (!oDataOperaciones) {
				oDataOperaciones = {
					lstItemsOperaciones: []
				};
			}

			oDataOperaciones.lstItemsOperaciones = this.oDataOperaciones;

			var oTablaOperaciones = this.byId("operacionesTable");
			var oModel2 = new sap.ui.model.json.JSONModel(oDataOperaciones);
			oTablaOperaciones.setModel(oModel2);
			
			var oTabFilterOp = this.getView().byId("ictbFilterOp");
			
			oTabFilterOp.setCount(oDataOperaciones.lstItemsOperaciones.length);
			
			oTablaOperaciones.getBinding("items").refresh();

			oPanel.setBusy(false);

			// this.getView().bindElement({
			// 	path: "/OrderCollection/" + this._order,
			// 	model: "orders"
			// });
		},

		closeOrder: function () {

			var bClose = true;

			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.confirm("Esta seguro que desea cerrar la orden?", {
				styleClass: bCompact ? "sapUiSizeCompact" : "",
				onClose: function (sButton) {
					if (sButton === MessageBox.Action.OK) {
						var aItems = this.getView().byId("operacionesTable").getItems();

						for (var i = 0; i < aItems.length; i++) {

							var oItem = aItems[i].getBindingContext().getObject();

							if (!oItem.CompOp || !oItem.CompRep) {
								bClose = false;
							}

						}

						if (bClose) {
							this.onNavBack();
						} else {
							MessageBox.confirm("Aun no se han completado las operaciones de la orden", {
								styleClass: bCompact ? "sapUiSizeCompact" : "",
								onClose: function (sBut) {}.bind(this)
							});
						}
					}
				}.bind(this)
			});

		},

		getDataByOrder: function (sOrderId) {

			var oModel = this.getView().getModel("ModelOrdenes");

			var sKey = oModel.createKey("/OrdenesSet", {
				IdOrden: sOrderId
			});

			oModel.read(sKey, {
				success: jQuery.proxy(this.mapDetailData, this),
				error: jQuery.proxy(this.onError, this)
			});

		},

		mapDetailData: function (oData, response) {
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel, "detail");
			sap.ui.core.BusyIndicator.hide();
		},

		onError: function (oError) {
			sap.ui.core.BusyIndicator.hide();
		},

		onListItemPress: function (oEvent) {
			var oItem = oEvent.getSource();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var bHash = false;

			var operationPath = oEvent.getSource().getBindingContext().getPath(),
				operationPathItem = operationPath.split("/").slice(-1).pop(),
				IdOrden = this._orden,
				IdOperacion = oEvent.getSource().getBindingContext().getModel().getData().lstItemsOperaciones[operationPathItem].IdOperacion;

			if (sap.ui.core.routing.History.getInstance().getPreviousHash()) {
				bHash = true;
			}

			oRouter.navTo("detailDetail", {
				layout: fioriLibrary.LayoutType.ThreeColumnsMidExpanded,
				orden: IdOrden,
				operacion: IdOperacion
			}, {}, bHash);
		},

		onSupplierPress: function (oEvent) {
			var supplierPath = oEvent.getSource().getBindingContext("products").getPath(),
				supplier = supplierPath.split("/").slice(-1).pop();

			this.oRouter.navTo("detailDetail", {
				layout: fioriLibrary.LayoutType.ThreeColumnsMidExpanded,
				supplier: supplier,
				product: this._product
			});
		},

		onEditToggleButtonPress: function () {
			var oObjectPage = this.getView().byId("ObjectPageLayout"),
				bCurrentShowFooterState = oObjectPage.getShowFooter();

			oObjectPage.setShowFooter(!bCurrentShowFooterState);
		},

		onPressCaptureQR: function (oEvent) {

			try {
				var that = this;
				
				
				BarcodeScanner.scan(
					function (result) {
						// sap.m.MessageBox.show("Se ha escaneado el Equipo:\n" +
						// 	 result.text);
						var idEquipo = that.getView().byId("txtEquipo").getText();
						if (result.text === idEquipo) {
							sap.m.MessageBox.show("Equipo:" +
								result.text + " escaneado correctamente");
							
							that.getView().getModel("Qr").setProperty("/Qr",true);

							that.idEquipo = result.text;
							var obtnCerrarOperaciones = that.byId("btnCerrarOperaciones");
							//obtnCerrarOperaciones.setEnabled(true); 
							//obtnCerrarOperaciones.setVisible(true);
						} else {
							sap.m.MessageBox.show("El Equipo escaneado:" + result.text + " no concuerda con el Equipo de la Orden: " + idEquipo);
						}

					},
					function (Error) {
						sap.m.MessageBox.show("Scanning failed: ", Error, "");
					}
				);

			} catch (e) {
				sap.m.MessageBox.show("Cordova plugin is not available.", "");
			}

		},

		onExit: function () {
			this.oRouter.getRoute("master").detachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").detachPatternMatched(this._onProductMatched, this);
		}
	});
});